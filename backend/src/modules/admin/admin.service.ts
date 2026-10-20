import type { Prisma } from '@prisma/client';
import { prisma } from '../../db/prisma';
import { AppError } from '../../utils/appError.util';
import { isBanned, isMuted, formatSanctionEnd } from '../../utils/accountStatus.util';
import { removeUploadedFile } from '../../utils/imageUpload.util';
import { notificationService } from '../notifications/notification.service';
import { trustService } from '../trust/trust.service';
import type {
  BadgeUpdateInput,
  GradeInput,
  SanctionInput,
  TrustIndexInput,
} from './admin.validation';

const DAY_MS = 24 * 60 * 60 * 1000;
const ANALYTICS_DAYS = 30;
const MY_MODERATION_LINK = '/my-moderation';

const addDays = (days: number) => new Date(Date.now() + days * DAY_MS);

export class AdminService {
  // ---------- Utilisateurs ----------

  async listUsers(query: { q?: string; skip: number; take: number; sort?: string }) {
    const where: Prisma.UserWhereInput = query.q
      ? {
          OR: [
            { username: { contains: query.q, mode: 'insensitive' } },
            { email: { contains: query.q, mode: 'insensitive' } },
            { firstname: { contains: query.q, mode: 'insensitive' } },
            { lastname: { contains: query.q, mode: 'insensitive' } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          email: true,
          firstname: true,
          lastname: true,
          avatarProfile: true,
          xp: true,
          trustIndex: true,
          grade: true,
          createdAt: true,
          lastLoginAt: true,
          bannedAt: true,
          bannedUntil: true,
          banReason: true,
          mutedUntil: true,
          moderator: { select: { isActive: true } },
          admin: { select: { userId: true } },
          _count: { select: { tips: true, comments: true } },
        },
        orderBy:
          query.sort === 'trust-asc'
            ? { trustIndex: 'asc' }
            : query.sort === 'trust-desc'
              ? { trustIndex: 'desc' }
              : { createdAt: 'desc' },
        skip: query.skip,
        take: query.take,
      }),
      prisma.user.count({ where }),
    ]);

    const now = new Date();
    return {
      total,
      items: users.map(({ moderator, admin, ...user }) => ({
        ...user,
        role: admin ? 'ADMIN' : moderator?.isActive ? 'MODERATOR' : 'USER',
        isBanned: isBanned(user, now),
        isMuted: isMuted(user, now),
      })),
    };
  }

  async banUser(targetId: number, adminId: number, { reason, days }: SanctionInput) {
    await this.assertManageable(targetId, adminId);
    const bannedUntil = days ? addDays(days) : null;

    await prisma.user.update({
      where: { id: targetId },
      data: { bannedAt: new Date(), bannedUntil, banReason: reason },
    });
    await this.recomputeTrustAfter(targetId);
    // Connexion et renouvellement de token refusés : l'accès est coupé au plus tard 15 min après
    return this.logAction(adminId, targetId, 'BAN', reason, { days: days ?? null });
  }

  async unbanUser(targetId: number, adminId: number) {
    await prisma.user.update({
      where: { id: targetId },
      data: { bannedAt: null, bannedUntil: null, banReason: null },
    });
    return this.logAction(adminId, targetId, 'UNBAN');
  }

  async muteUser(targetId: number, adminId: number, { reason, days }: SanctionInput) {
    await this.assertManageable(targetId, adminId);
    if (!days) {
      throw new AppError('a mute must have a duration', 400);
    }
    const mutedUntil = addDays(days);

    await prisma.user.update({ where: { id: targetId }, data: { mutedUntil } });
    const action = await this.logAction(adminId, targetId, 'MUTE', reason, { days });
    await this.recomputeTrustAfter(targetId);
    await notificationService.notify(targetId, {
      type: 'MODERATION',
      title: `Vous ne pouvez plus publier ${formatSanctionEnd(mutedUntil)}`,
      body: reason,
      link: MY_MODERATION_LINK,
    });
    return action;
  }

  async unmuteUser(targetId: number, adminId: number) {
    await prisma.user.update({ where: { id: targetId }, data: { mutedUntil: null } });
    return this.logAction(adminId, targetId, 'UNMUTE');
  }

  // Ajustement manuel de l'indice de confiance (abus, bug, erreur), tracé dans l'historique
  async setTrustIndex(targetId: number, adminId: number, { trustIndex, reason }: TrustIndexInput) {
    const user = await this.findUserOrThrow(targetId);

    const { computed, trustAdjustment } = await trustService.setManualTrustIndex(
      targetId,
      trustIndex,
    );
    return this.logAction(adminId, targetId, 'TRUST_ADJUST', reason, {
      previous: user.trustIndex,
      next: trustIndex,
      computed,
      adjustment: trustAdjustment,
    });
  }

  // Remet la progression à zéro (XP, grade, badges, indice de confiance) sans supprimer le contenu
  async resetUser(targetId: number, adminId: number) {
    await this.assertManageable(targetId, adminId);
    const lowestGrade = await prisma.grade.findFirst({ orderBy: { xpRequired: 'asc' } });

    await prisma.$transaction([
      prisma.userBadge.deleteMany({ where: { userId: targetId } }),
      prisma.user.update({
        where: { id: targetId },
        data: { xp: 0, trustAdjustment: 0, gradeId: lowestGrade?.id ?? null },
      }),
    ]);
    await trustService.recomputeUser(targetId);
    return this.logAction(adminId, targetId, 'RESET');
  }

  async deleteUser(targetId: number, adminId: number) {
    await this.assertManageable(targetId, adminId);
    const user = await this.findUserOrThrow(targetId);

    await prisma.user.delete({ where: { id: targetId } });
    removeUploadedFile(user.avatarProfile);
  }

  // ---------- Grades et badges ----------

  async listGrades() {
    return prisma.grade.findMany({
      orderBy: { xpRequired: 'asc' },
      include: { _count: { select: { users: true } } },
    });
  }

  async createGrade(data: GradeInput) {
    const grade = await prisma.grade.create({ data });
    await this.recomputeGrades();
    return grade;
  }

  async updateGrade(id: number, data: Partial<GradeInput>) {
    await this.findGradeOrThrow(id);
    const grade = await prisma.grade.update({ where: { id }, data });
    await this.recomputeGrades();
    return grade;
  }

  async deleteGrade(id: number) {
    await this.findGradeOrThrow(id);
    if ((await prisma.grade.count()) <= 1) {
      throw new AppError('at least one grade is required', 400);
    }

    await prisma.user.updateMany({ where: { gradeId: id }, data: { gradeId: null } });
    await prisma.grade.delete({ where: { id } });
    await this.recomputeGrades();
  }

  async listBadges() {
    return prisma.badge.findMany({
      orderBy: { id: 'asc' },
      include: { _count: { select: { userBadges: true } } },
    });
  }

  // Les conditions d'obtention restent dans le code (badge.service) ; l'admin gère l'affichage et l'XP
  async updateBadge(id: number, data: BadgeUpdateInput) {
    const badge = await prisma.badge.findUnique({ where: { id } });
    if (!badge) {
      throw new AppError('badge not found', 404);
    }
    return prisma.badge.update({ where: { id }, data });
  }

  // ---------- Analytics ----------

  async getAnalytics() {
    const since = new Date(Date.now() - ANALYTICS_DAYS * DAY_MS);
    const now = new Date();

    const [
      totalUsers,
      newUsers,
      activeUsers,
      tipsByStatus,
      recentTips,
      categories,
      openReports,
      openAppeals,
      bannedUsers,
      topContributors,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: since } } }),
      prisma.user.count({
        where: {
          OR: [
            { lastLoginAt: { gte: since } },
            { tips: { some: { createdAt: { gte: since } } } },
            { comments: { some: { createdAt: { gte: since } } } },
          ],
        },
      }),
      prisma.tip.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.tip.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
      prisma.category.findMany({
        select: {
          id: true,
          name: true,
          _count: { select: { tips: { where: { tip: { status: 'APPROVED' } } } } },
        },
      }),
      prisma.report.count({ where: { status: 'OPEN' } }),
      prisma.appeal.count({ where: { status: 'OPEN' } }),
      prisma.user.count({
        where: {
          bannedAt: { not: null },
          OR: [{ bannedUntil: null }, { bannedUntil: { gt: now } }],
        },
      }),
      prisma.user.findMany({
        select: { id: true, username: true, xp: true, _count: { select: { tips: true } } },
        orderBy: { xp: 'desc' },
        take: 5,
      }),
    ]);

    // Tips publiés par jour sur la période (jours sans tip inclus)
    const perDay = new Map<string, number>();
    for (let i = ANALYTICS_DAYS - 1; i >= 0; i--) {
      perDay.set(new Date(Date.now() - i * DAY_MS).toISOString().slice(0, 10), 0);
    }
    for (const tip of recentTips) {
      const day = tip.createdAt.toISOString().slice(0, 10);
      if (perDay.has(day)) perDay.set(day, perDay.get(day)! + 1);
    }

    const statusCount = (status: string) =>
      tipsByStatus.find((group) => group.status === status)?._count._all ?? 0;

    return {
      users: { total: totalUsers, newLast30Days: newUsers, activeLast30Days: activeUsers },
      tips: {
        total: tipsByStatus.reduce((sum, group) => sum + group._count._all, 0),
        approved: statusCount('APPROVED'),
        pending: statusCount('PENDING'),
        rejected: statusCount('REJECTED'),
        perDay: [...perDay.entries()].map(([date, count]) => ({ date, count })),
      },
      popularCategories: categories
        .map((category) => ({ id: category.id, name: category.name, tips: category._count.tips }))
        .sort((a, b) => b.tips - a.tips)
        .slice(0, 10),
      moderation: { openReports, openAppeals, pendingTips: statusCount('PENDING'), bannedUsers },
      topContributors: topContributors.map((user) => ({
        id: user.id,
        username: user.username,
        xp: user.xp,
        tips: user._count.tips,
      })),
    };
  }

  // ---------- Outils internes ----------

  // Recalcule l'indice une fois l'action enregistrée (la sanction compte dans le calcul)
  private async recomputeTrustAfter(userId: number) {
    setImmediate(() => {
      trustService.recomputeUser(userId).catch(() => undefined);
    });
  }

  // Réaffecte à chaque utilisateur le grade correspondant à son XP
  private async recomputeGrades() {
    const grades = await prisma.grade.findMany({ orderBy: { xpRequired: 'asc' } });

    await prisma.$transaction(
      grades.map((grade, index) =>
        prisma.user.updateMany({
          where: {
            xp: {
              gte: grade.xpRequired,
              ...(grades[index + 1] ? { lt: grades[index + 1]!.xpRequired } : {}),
            },
          },
          data: { gradeId: grade.id },
        }),
      ),
    );
  }

  private async findUserOrThrow(id: number) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new AppError('user not found', 404);
    }
    return user;
  }

  private async findGradeOrThrow(id: number) {
    const grade = await prisma.grade.findUnique({ where: { id } });
    if (!grade) {
      throw new AppError('grade not found', 404);
    }
    return grade;
  }

  // Un admin n'agit ni sur lui-même ni sur un autre admin
  private async assertManageable(targetId: number, adminId: number) {
    if (targetId === adminId) {
      throw new AppError('you cannot perform this action on yourself', 400);
    }

    const target = await prisma.user.findUnique({
      where: { id: targetId },
      include: { admin: true },
    });
    if (!target) {
      throw new AppError('user not found', 404);
    }
    if (target.admin) {
      throw new AppError('this action cannot target an administrator', 403);
    }
  }

  private logAction(
    adminId: number,
    userId: number,
    actionType: string,
    reason?: string,
    metadata?: Prisma.InputJsonValue,
  ) {
    return prisma.moderationAction.create({
      data: { moderatorId: adminId, userId, actionType, reason, metadata },
    });
  }
}

export const adminService = new AdminService();
