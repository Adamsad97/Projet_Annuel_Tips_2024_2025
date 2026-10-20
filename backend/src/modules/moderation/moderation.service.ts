import { moderationRepository } from './moderation.repository';
import { AppError } from '../../utils/appError.util';
import { prisma } from '../../db/prisma';
import { xpService } from '../xp/xp.service';
import { XP_REWARDS, XpAction } from '../../types/xp.types';
import { socketService } from '../../websocket/socket.service';
import { notificationService } from '../notifications/notification.service';
import { trustService } from '../trust/trust.service';
import { categoryService } from '../categories/category.service';
import { challengeService } from '../sponsoring/challenge.service';
import { gamificationService } from '../gamification/gamification.service';

// Page où l'utilisateur consulte ses sanctions et peut les contester
const MY_MODERATION_LINK = '/my-moderation';

export class ModerationService {
  async getPendingReports(skip: number = 0, take: number = 20) {
    const reports = await moderationRepository.findPendingReports(skip, take);
    const total = await moderationRepository.countPendingReports();

    return {
      data: reports,
      meta: {
        total,
        skip,
        take,
        hasMore: skip + take < total,
      },
    };
  }

  async resolveReport(
    reportId: number,
    moderatorId: number,
    action: 'APPROVE' | 'REJECT',
    reason?: string,
  ) {
    const report = await moderationRepository.findReportById(reportId);

    if (!report) {
      throw new AppError('report not found', 404);
    }

    if (report.status !== 'OPEN') {
      throw new AppError('report has already been processed', 400);
    }

    const canModerate =
      (await moderationRepository.isModerator(moderatorId)) ||
      (await moderationRepository.isAdmin(moderatorId));
    if (!canModerate) {
      throw new AppError('moderator access required', 403);
    }

    if (action === 'REJECT') {
      if (report.tipId) {
        await prisma.tip.update({
          where: { id: report.tipId },
          data: { status: 'REJECTED' },
        });
      }
      if (report.commentId) {
        await prisma.comment.delete({
          where: { id: report.commentId },
        });
      }

      await moderationRepository.updateReportStatus(reportId, 'RESOLVED');
    } else {
      if (report.tipId) {
        await prisma.tip.update({
          where: { id: report.tipId },
          data: { status: 'APPROVED' },
        });
      }

      await moderationRepository.updateReportStatus(reportId, 'REJECTED');
    }
    let targetUserId = 0;
    if (report.tipId) {
      const tip = await prisma.tip.findUnique({ where: { id: report.tipId } });
      targetUserId = tip?.userId || 0;
    } else if (report.commentId) {
      const comment = await prisma.comment.findUnique({ where: { id: report.commentId } });
      targetUserId = comment?.userId || 0;
    }

    await moderationRepository.createModerationAction({
      moderatorId,
      userId: targetUserId,
      actionType: `RESOLVE_REPORT_${action}`,
      reason,
      metadata: { reportId, tipId: report.tipId, commentId: report.commentId },
    });
    await this.rewardModerator(moderatorId);
    // Signalement validé : pénalise l'auteur ; rejeté : pénalise le signaleur
    this.recomputeTrust(targetUserId, report.userId);

    if (action === 'REJECT' && targetUserId) {
      await notificationService.notify(targetUserId, {
        type: 'MODERATION',
        title: report.tipId
          ? 'Un de vos tips a été retiré suite à un signalement'
          : 'Un de vos commentaires a été supprimé suite à un signalement',
        body: reason,
        link: MY_MODERATION_LINK,
      });
    }

    return { success: true, action };
  }

  async approveTip(tipId: number, moderatorId: number) {
    const tip = await prisma.tip.findUnique({
      where: { id: tipId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
        categories: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!tip) {
      throw new AppError('tip not found', 404);
    }

    if (tip.status !== 'PENDING') {
      throw new AppError('tip is not pending approval', 400);
    }

    const updatedTip = await prisma.tip.update({
      where: { id: tipId },
      data: { status: 'APPROVED' },
    });

    await xpService.addXp(tip.userId, XpAction.TIP_APPROVED);
    await moderationRepository.createModerationAction({
      moderatorId,
      userId: tip.userId,
      actionType: 'APPROVE_TIP',
      metadata: { tipId },
    });
    await this.rewardModerator(moderatorId);
    await notificationService.notify(tip.userId, {
      type: 'MODERATION',
      title: `Votre tip « ${tip.title} » a été publié`,
      body: `+${XP_REWARDS[XpAction.TIP_APPROVED]} XP`,
      link: `/tips/${tip.id}`,
    });

    socketService.emitTipApproved({
      tipId: tip.id,
      title: tip.title,
      author: {
        id: tip.user.id,
        username: tip.user.username,
      },
      category: {
        id: tip.categories[0]?.category.id || 0,
        name: tip.categories[0]?.category.name || 'uncategorized',
      },
      createdAt: tip.createdAt,
    });

    // Abonnés aux catégories du tip : notification en temps réel
    await categoryService.notifyFollowersOfNewTip(tip);
    // Défis sponsorisés remplis par ce tip : bonus d'XP pour l'auteur
    await challengeService.rewardApprovedTip(tip);

    return updatedTip;
  }

  async rejectTip(tipId: number, moderatorId: number, reason: string) {
    const tip = await prisma.tip.findUnique({ where: { id: tipId } });

    if (!tip) {
      throw new AppError('tip not found', 404);
    }

    await prisma.tip.update({
      where: { id: tipId },
      data: { status: 'REJECTED' },
    });

    await moderationRepository.createModerationAction({
      moderatorId,
      userId: tip.userId,
      actionType: 'REJECT_TIP',
      reason,
      metadata: { tipId },
    });
    await this.rewardModerator(moderatorId);
    await notificationService.notify(tip.userId, {
      type: 'MODERATION',
      title: `Votre tip « ${tip.title} » a été refusé`,
      body: reason,
      link: MY_MODERATION_LINK,
    });

    socketService.emitTipRejected(tipId);

    return tip;
  }

  async getPendingTips(skip: number = 0, take: number = 20) {
    const tips = await prisma.tip.findMany({
      where: { status: 'PENDING' },
      include: {
        user: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            email: true,
            avatarProfile: true,
          },
        },
        categories: {
          include: { category: true },
        },
        _count: {
          select: {
            comments: true,
            votes: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
      skip,
      take,
    });

    const total = await prisma.tip.count({ where: { status: 'PENDING' } });

    return {
      data: tips,
      meta: {
        total,
        skip,
        take,
        hasMore: skip + take < total,
      },
    };
  }

  async promoteUser(userId: number, adminId: number, role: 'MODERATOR' | 'ADMIN') {
    const isAdmin = await moderationRepository.isAdmin(adminId);
    if (!isAdmin) {
      throw new AppError('admin access required', 403);
    }
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (role === 'MODERATOR') {
      await moderationRepository.promoteToModerator(userId);
    } else {
      await moderationRepository.promoteToAdmin(userId);
    }

    await moderationRepository.createModerationAction({
      moderatorId: adminId,
      userId,
      actionType: `PROMOTE_TO_${role}`,
    });

    return { success: true, role };
  }

  async demoteModerator(userId: number, adminId: number, reason: string) {
    const isAdmin = await moderationRepository.isAdmin(adminId);
    if (!isAdmin) {
      throw new AppError('admin access required', 403);
    }

    const isModerator = await moderationRepository.isModerator(userId);
    if (!isModerator) {
      throw new AppError('user is not an active moderator', 400);
    }

    await moderationRepository.demoteModerator(userId);

    await moderationRepository.createModerationAction({
      moderatorId: adminId,
      userId,
      actionType: 'DEMOTE_MODERATOR',
      reason,
    });

    return { success: true };
  }

  // Avertissement formel, visible et contestable par l'utilisateur
  async warnUser(targetId: number, moderatorId: number, reason: string) {
    await this.assertCanSanction(targetId, moderatorId);

    const action = await moderationRepository.createModerationAction({
      moderatorId,
      userId: targetId,
      actionType: 'WARN',
      reason,
    });
    await this.rewardModerator(moderatorId);
    this.recomputeTrust(targetId);
    await notificationService.notify(targetId, {
      type: 'MODERATION',
      title: 'Vous avez reçu un avertissement',
      body: reason,
      link: MY_MODERATION_LINK,
    });

    return action;
  }

  // Rétrograde d'un grade : l'XP redescend au seuil du grade inférieur
  async downgradeUser(targetId: number, moderatorId: number, reason: string) {
    await this.assertCanSanction(targetId, moderatorId);
    await gamificationService.assertCanDowngrade(moderatorId);

    const user = await prisma.user.findUniqueOrThrow({ where: { id: targetId } });
    // Grade réel d'après l'XP (gradeId peut être en retard si les grades ont changé)
    const currentGrade = await prisma.grade.findFirst({
      where: { xpRequired: { lte: user.xp } },
      orderBy: { xpRequired: 'desc' },
    });
    const currentThreshold = currentGrade?.xpRequired ?? 0;
    const previousGrade = await prisma.grade.findFirst({
      where: { xpRequired: { lt: currentThreshold } },
      orderBy: { xpRequired: 'desc' },
    });

    if (!previousGrade) {
      throw new AppError('user is already at the lowest grade', 400);
    }

    await prisma.user.update({
      where: { id: targetId },
      data: { xp: previousGrade.xpRequired, gradeId: previousGrade.id },
    });

    const action = await moderationRepository.createModerationAction({
      moderatorId,
      userId: targetId,
      actionType: 'DOWNGRADE',
      reason,
      metadata: { previousXp: user.xp, previousGradeId: user.gradeId },
    });
    await this.rewardModerator(moderatorId);
    this.recomputeTrust(targetId);
    await notificationService.notify(targetId, {
      type: 'MODERATION',
      title: `Vous avez été rétrogradé au grade ${previousGrade.name}`,
      body: reason,
      link: MY_MODERATION_LINK,
    });

    return action;
  }

  async getUserActions(userId: number) {
    return prisma.moderationAction.findMany({
      // L'indice de confiance est réservé aux admins (panneau dédié) : ses ajustements ne sont
      // pas montrés aux modérateurs
      where: { userId, actionType: { not: 'TRUST_ADJUST' } },
      include: {
        moderator: { select: { id: true, username: true } },
        appeal: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  // Un modérateur ne sanctionne ni lui-même, ni un autre modérateur, ni un admin
  private async assertCanSanction(targetId: number, moderatorId: number) {
    if (targetId === moderatorId) {
      throw new AppError('you cannot sanction yourself', 400);
    }

    const target = await prisma.user.findUnique({
      where: { id: targetId },
      include: { moderator: true, admin: true },
    });

    if (!target) {
      throw new AppError('user not found', 404);
    }

    if (target.admin || target.moderator?.isActive) {
      throw new AppError('moderators and admins can only be demoted by an admin', 403);
    }
  }

  // Les modérateurs gagnent de l'XP (et donc des grades / badges) avec leur activité
  private async rewardModerator(moderatorId: number) {
    await xpService.addXp(moderatorId, XpAction.MODERATION_ACTION);
  }

  // Recalcul de l'indice de confiance en tâche de fond, sans ralentir la réponse
  private recomputeTrust(...userIds: number[]) {
    trustService.recomputeInBackground(...userIds);
  }

  async getModerationStats() {
    const [pendingReports, pendingTips, totalModerators, totalActions] = await Promise.all([
      moderationRepository.countPendingReports(),
      prisma.tip.count({ where: { status: 'PENDING' } }),
      prisma.moderator.count({ where: { isActive: true } }),
      prisma.moderationAction.count(),
    ]);

    return {
      pendingReports,
      pendingTips,
      totalModerators,
      totalActions,
    };
  }

  async getModeratorHistory(moderatorId: number, limit: number = 50) {
    return moderationRepository.findModeratorActions(moderatorId, limit);
  }
}

export const moderationService = new ModerationService();
