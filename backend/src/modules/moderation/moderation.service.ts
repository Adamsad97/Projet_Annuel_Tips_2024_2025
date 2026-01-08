import { moderationRepository } from './moderation.repository';
import { AppError } from '../../utils/appError.util';
import { prisma } from '../../db/prisma';
import { xpService } from '../xp/xp.service';
import { XpAction } from '../../types/xp.types';
import { socketService } from '../../websocket/socket.service';

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

    const isModerator = await moderationRepository.isModerator(moderatorId);
    if (!isModerator) {
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
    });

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
    });

    socketService.emitTipApproved({
      tipId: tip.id,
      title: tip.title,
      content: tip.content || '',
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
