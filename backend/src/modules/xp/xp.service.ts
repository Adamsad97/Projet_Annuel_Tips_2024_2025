import { Prisma } from '@prisma/client';
import { prisma } from '../../db/prisma';
import type { XpAction } from '../../types/xp.types';
import { XP_REWARDS, type XpGainedEvent, type LevelUpEvent } from '../../types/xp.types';
import { AppError } from '../../utils/appError.util';
import { TRUST_RULES } from '../trust/trust.config';

export class XpService {
  async addXp(userId: number, action: XpAction, customAmount?: number): Promise<XpGainedEvent> {
    const xpToAdd = customAmount ?? XP_REWARDS[action];

    if (xpToAdd === 0) {
      throw new AppError('xp amount cannot be zero', 400);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { xp: { increment: xpToAdd } },
      select: { id: true, xp: true, gradeId: true },
    });

    const event: XpGainedEvent = {
      userId,
      action,
      amount: xpToAdd,
      newTotal: updatedUser.xp,
    };

    await this.checkGradePromotion(userId);

    return event;
  }

  async checkGradePromotion(userId: number): Promise<LevelUpEvent | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { grade: true },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const appropriateGrade = await prisma.grade.findFirst({
      where: { xpRequired: { lte: user.xp } },
      orderBy: { xpRequired: 'desc' },
    });

    if (!appropriateGrade || appropriateGrade.id === user.gradeId) {
      return null;
    }

    // Anti-troll : un compte peu fiable garde son grade tant que son indice ne remonte pas
    const isPromotion = appropriateGrade.xpRequired > (user.grade?.xpRequired ?? -1);
    if (isPromotion && user.trustIndex < TRUST_RULES.minTrustForGradePromotion) {
      return null;
    }

    await prisma.user.update({
      where: { id: userId },
      data: { gradeId: appropriateGrade.id },
    });

    const event: LevelUpEvent = {
      userId,
      oldGrade: user.grade?.name ?? null,
      newGrade: appropriateGrade.name,
      newGradeId: appropriateGrade.id,
    };

    return event;
  }

  async getUserProgress(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        grade: true,
        userBadges: {
          include: { badge: true },
          orderBy: { earnedAt: 'desc' },
        },
        _count: {
          select: {
            tips: true,
            comments: true,
            votes: true,
            followers: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const nextGrade = await prisma.grade.findFirst({
      where: { xpRequired: { gt: user.xp } },
      orderBy: { xpRequired: 'asc' },
    });

    return {
      currentXp: user.xp,
      currentGrade: user.grade,
      nextGrade,
      xpToNextGrade: nextGrade ? nextGrade.xpRequired - user.xp : 0,
      progressPercent: this.calculateProgressPercent(
        user.xp,
        user.grade?.xpRequired ?? 0,
        nextGrade?.xpRequired,
      ),
      badges: user.userBadges.map((ub) => ({
        ...ub.badge,
        earnedAt: ub.earnedAt,
      })),
      stats: {
        tipsCreated: user._count.tips,
        commentsCreated: user._count.comments,
        votesGiven: user._count.votes,
        followers: user._count.followers,
      },
    };
  }

  private calculateProgressPercent(
    currentXp: number,
    currentGradeXp: number,
    nextGradeXp?: number,
  ): number {
    if (!nextGradeXp) return 100;

    const xpInCurrentGrade = currentXp - currentGradeXp;
    const xpNeededForNextGrade = nextGradeXp - currentGradeXp;

    return Math.min(100, Math.max(0, (xpInCurrentGrade / xpNeededForNextGrade) * 100));
  }

  // Classement public : pas d'email ni de donnée privée.
  // sort = xp (total, sans période : l'XP n'est pas historisée), tips (tips publiés)
  // ou votes (votes positifs reçus sur ses tips publiés), sur la période choisie.
  async getLeaderboard(options: LeaderboardOptions = {}) {
    const { sort = 'xp', period = 'all', take = 10, skip = 0 } = options;
    const since = periodStart(period);

    let rankedIds: number[];
    if (sort === 'xp') {
      const ranked = await prisma.user.findMany({
        select: { id: true },
        orderBy: [{ xp: 'desc' }, { id: 'asc' }],
        take,
        skip,
      });
      rankedIds = ranked.map((user) => user.id);
    } else if (sort === 'tips') {
      const ranked = await prisma.tip.groupBy({
        by: ['userId'],
        where: { status: 'APPROVED', ...(since && { createdAt: { gte: since } }) },
        _count: { _all: true },
        orderBy: [{ _count: { userId: 'desc' } }, { userId: 'asc' }],
        take,
        skip,
      });
      rankedIds = ranked.map((row) => row.userId);
    } else {
      const ranked = await prisma.$queryRaw<Array<{ userId: number }>>`
        SELECT t."userId" AS "userId"
        FROM "Vote" v JOIN "Tip" t ON t.id = v."tipId"
        WHERE v.value > 0 AND t.status = 'APPROVED'
          AND v."createdAt" >= ${since ?? new Date(0)}
        GROUP BY t."userId"
        ORDER BY COUNT(*) DESC, t."userId" ASC
        LIMIT ${take} OFFSET ${skip}`;
      rankedIds = ranked.map((row) => row.userId);
    }

    if (rankedIds.length === 0) return [];

    const [users, tipCounts, voteCounts] = await Promise.all([
      prisma.user.findMany({
        where: { id: { in: rankedIds } },
        select: {
          id: true,
          username: true,
          firstname: true,
          lastname: true,
          avatarProfile: true,
          xp: true,
          grade: true,
          _count: { select: { userBadges: true } },
        },
      }),
      prisma.tip.groupBy({
        by: ['userId'],
        where: {
          userId: { in: rankedIds },
          status: 'APPROVED',
          ...(since && { createdAt: { gte: since } }),
        },
        _count: { _all: true },
      }),
      prisma.$queryRaw<Array<{ userId: number; votes: number }>>`
        SELECT t."userId" AS "userId", COUNT(*)::int AS votes
        FROM "Vote" v JOIN "Tip" t ON t.id = v."tipId"
        WHERE v.value > 0 AND t.status = 'APPROVED'
          AND v."createdAt" >= ${since ?? new Date(0)}
          AND t."userId" IN (${Prisma.join(rankedIds)})
        GROUP BY t."userId"`,
    ]);

    const usersById = new Map(users.map((user) => [user.id, user]));
    const tipsByUser = new Map(tipCounts.map((row) => [row.userId, row._count._all]));
    const votesByUser = new Map(voteCounts.map((row) => [row.userId, row.votes]));

    return rankedIds.flatMap((id, index) => {
      const user = usersById.get(id);
      if (!user) return [];
      return [
        {
          rank: skip + index + 1,
          userId: user.id,
          username: user.username,
          firstname: user.firstname,
          lastname: user.lastname,
          avatarProfile: user.avatarProfile,
          xp: user.xp,
          grade: user.grade,
          role: user.grade?.name ?? null,
          tips: tipsByUser.get(id) ?? 0,
          votes: votesByUser.get(id) ?? 0,
          badges: user._count.userBadges,
        },
      ];
    });
  }
}

export type LeaderboardSort = 'xp' | 'tips' | 'votes';
export type LeaderboardPeriod = 'week' | 'month' | 'all';

interface LeaderboardOptions {
  sort?: LeaderboardSort;
  period?: LeaderboardPeriod;
  take?: number;
  skip?: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function periodStart(period: LeaderboardPeriod): Date | null {
  if (period === 'week') return new Date(Date.now() - 7 * DAY_MS);
  if (period === 'month') return new Date(Date.now() - 30 * DAY_MS);
  return null;
}

export const xpService = new XpService();
