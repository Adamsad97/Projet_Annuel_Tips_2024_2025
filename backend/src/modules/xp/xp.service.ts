import { prisma } from '../../db/prisma';
import type { XpAction } from '../../types/xp.types';
import { XP_REWARDS, type XpGainedEvent, type LevelUpEvent } from '../../types/xp.types';
import { AppError } from '../../utils/appError.util';

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

  async getLeaderboard(limit: number = 10, skip: number = 0) {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstname: true,
        lastname: true,
        email: true,
        avatarProfile: true,
        xp: true,
        grade: true,
        _count: {
          select: { tips: true, userBadges: true },
        },
      },
      orderBy: { xp: 'desc' },
      take: limit,
      skip,
    });

    return users.map((user, index) => ({
      rank: skip + index + 1,
      user: {
        id: user.id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        avatarProfile: user.avatarProfile,
      },
      xp: user.xp,
      grade: user.grade,
      tipsCount: user._count.tips,
      badgesCount: user._count.userBadges,
    }));
  }
}

export const xpService = new XpService();
