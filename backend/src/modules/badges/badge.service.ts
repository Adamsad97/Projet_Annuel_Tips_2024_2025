import { prisma } from '../../db/prisma';
import { BadgeCode, type BadgeConditions, type UserBadgeStats } from '../../types/badge.types';
import { AppError } from '../../utils/appError.util';
import { xpService } from '../xp/xp.service';
import { XpAction } from '../../types/xp.types';

export class BadgeService {
  private readonly BADGE_CONDITIONS: BadgeConditions = {
    [BadgeCode.FIRST_TIP]: {
      check: (stats) => stats.tipsCount >= 1,
      xpReward: 5,
    },
    [BadgeCode.TIP_MASTER]: {
      check: (stats) => stats.tipsCount >= 50,
      xpReward: 50,
    },
    [BadgeCode.TIP_LEGEND]: {
      check: (stats) => stats.tipsCount >= 200,
      xpReward: 200,
    },
    [BadgeCode.HELPFUL]: {
      check: (stats) => stats.tipsUpvotes >= 100,
      xpReward: 30,
    },
    [BadgeCode.SUPER_HELPFUL]: {
      check: (stats) => stats.tipsUpvotes >= 500,
      xpReward: 100,
    },
    [BadgeCode.SOCIAL]: {
      check: (stats) => stats.followersCount >= 10,
      xpReward: 20,
    },
    [BadgeCode.INFLUENCER]: {
      check: (stats) => stats.followersCount >= 100,
      xpReward: 100,
    },
    [BadgeCode.COMMENTATOR]: {
      check: (stats) => stats.commentsCount >= 50,
      xpReward: 30,
    },
    [BadgeCode.EARLY_BIRD]: {
      check: (stats) => {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return stats.createdAt < thirtyDaysAgo;
      },
      xpReward: 50,
    },
  };

  async checkAndAwardBadges(userId: number): Promise<string[]> {
    const stats = await this.getUserStats(userId);
    const awardedBadges: string[] = [];

    for (const [badgeCode, condition] of Object.entries(this.BADGE_CONDITIONS)) {
      const hasEarned = condition.check(stats);
      const alreadyHas = await this.userHasBadge(userId, badgeCode);

      if (hasEarned && !alreadyHas) {
        await this.awardBadge(userId, badgeCode as BadgeCode);
        awardedBadges.push(badgeCode);
      }
    }

    return awardedBadges;
  }

  private async getUserStats(userId: number): Promise<UserBadgeStats> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        tips: {
          include: {
            votes: true,
          },
        },
        comments: true,
        followers: true,
      },
    });

    if (!user) {
      throw new AppError('user not found', 404);
    }

    const tipsUpvotes = user.tips.reduce((total, tip) => {
      const upvotes = tip.votes.filter((vote) => vote.value > 0).length;
      return total + upvotes;
    }, 0);

    return {
      tipsCount: user.tips.length,
      tipsUpvotes,
      commentsCount: user.comments.length,
      followersCount: user.followers.length,
      createdAt: user.createdAt,
    };
  }

  private async userHasBadge(userId: number, badgeCode: string): Promise<boolean> {
    const userBadge = await prisma.userBadge.findFirst({
      where: {
        userId,
        badge: { code: badgeCode },
      },
    });

    return userBadge !== null;
  }

  async awardBadge(userId: number, badgeCode: BadgeCode): Promise<void> {
    const badge = await prisma.badge.findUnique({
      where: { code: badgeCode },
    });

    if (!badge) {
      throw new AppError(`Badge with code ${badgeCode} not found`, 404);
    }

    const alreadyHas = await this.userHasBadge(userId, badgeCode);
    if (alreadyHas) {
      return;
    }

    await prisma.userBadge.create({
      data: {
        userId,
        badgeId: badge.id,
      },
    });

    const xpReward = this.BADGE_CONDITIONS[badgeCode].xpReward;
    if (xpReward > 0) {
      await xpService.addXp(userId, XpAction.BADGE_EARNED, xpReward);
    }
  }

  async getUserBadges(userId: number) {
    const userBadges = await prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true },
      orderBy: { earnedAt: 'desc' },
    });

    return userBadges.map((ub) => ({
      ...ub.badge,
      earnedAt: ub.earnedAt,
    }));
  }


  async getAllBadgesWithStatus(userId: number) {
    const allBadges = await prisma.badge.findMany();
    const userBadges = await this.getUserBadges(userId);
    const stats = await this.getUserStats(userId);

    return allBadges.map((badge) => {
      const earned = userBadges.find((ub) => ub.id === badge.id);
      const condition = this.BADGE_CONDITIONS[badge.code as BadgeCode];

      return {
        ...badge,
        earned: !!earned,
        earnedAt: earned?.earnedAt,
        progress: condition ? this.calculateBadgeProgress(badge.code as BadgeCode, stats) : 0,
      };
    });
  }

  private calculateBadgeProgress(badgeCode: BadgeCode, stats: UserBadgeStats): number {
    switch (badgeCode) {
      case BadgeCode.FIRST_TIP:
        return Math.min(100, (stats.tipsCount / 1) * 100);
      case BadgeCode.TIP_MASTER:
        return Math.min(100, (stats.tipsCount / 50) * 100);
      case BadgeCode.TIP_LEGEND:
        return Math.min(100, (stats.tipsCount / 200) * 100);
      case BadgeCode.HELPFUL:
        return Math.min(100, (stats.tipsUpvotes / 100) * 100);
      case BadgeCode.SUPER_HELPFUL:
        return Math.min(100, (stats.tipsUpvotes / 500) * 100);
      case BadgeCode.SOCIAL:
        return Math.min(100, (stats.followersCount / 10) * 100);
      case BadgeCode.INFLUENCER:
        return Math.min(100, (stats.followersCount / 100) * 100);
      case BadgeCode.COMMENTATOR:
        return Math.min(100, (stats.commentsCount / 50) * 100);
      case BadgeCode.EARLY_BIRD:
        return 0; // Ce badge ne peut pas être progressif
      default:
        return 0;
    }
  }
}

export const badgeService = new BadgeService();
