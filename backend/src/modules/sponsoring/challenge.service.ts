import type { Prisma } from '@prisma/client';
import { prisma } from '../../db/prisma';
import { AppError } from '../../utils/appError.util';
import { xpService } from '../xp/xp.service';
import { notificationService } from '../notifications/notification.service';
import { XpAction } from '../../types/xp.types';
import type { ChallengeInput } from './sponsoring.validation';

interface ApprovedTip {
  id: number;
  userId: number;
  kind: string;
  createdAt: Date;
  categories: Array<{ category: { id: number } }>;
}

export class ChallengeService {
  // Défis en cours, avec les places restantes et l'état pour le membre connecté
  async listActive(userId?: number) {
    const now = new Date();
    const challenges = await prisma.sponsoredChallenge.findMany({
      where: { isActive: true, startsAt: { lte: now }, endsAt: { gt: now } },
      include: {
        category: { select: { id: true, name: true } },
        _count: { select: { rewards: true } },
        rewards: userId ? { where: { userId }, select: { id: true } } : false,
      },
      orderBy: { endsAt: 'asc' },
    });

    return challenges.map(({ _count, rewards, ...challenge }) => ({
      ...challenge,
      rewardsGiven: _count.rewards,
      remainingRewards:
        challenge.maxRewards === null ? null : Math.max(0, challenge.maxRewards - _count.rewards),
      completedByMe: !!rewards?.length,
    }));
  }

  // Appelé quand un modérateur publie un tip : verse les bonus des défis remplis
  async rewardApprovedTip(tip: ApprovedTip): Promise<number[]> {
    if (tip.kind !== 'TIP') return [];

    const now = new Date();
    const categoryIds = tip.categories.map((c) => c.category.id);
    const challenges = await prisma.sponsoredChallenge.findMany({
      where: {
        isActive: true,
        categoryId: { in: categoryIds },
        startsAt: { lte: tip.createdAt },
        endsAt: { gt: now },
      },
      include: { _count: { select: { rewards: true } } },
    });

    const rewarded: number[] = [];
    for (const challenge of challenges) {
      // Tip créé pendant le défi (pas de recyclage d'anciens tips) et budget non épuisé
      if (tip.createdAt > challenge.endsAt) continue;
      if (challenge.maxRewards !== null && challenge._count.rewards >= challenge.maxRewards)
        continue;

      try {
        await prisma.challengeReward.create({
          data: {
            challengeId: challenge.id,
            userId: tip.userId,
            tipId: tip.id,
            xp: challenge.xpBonus,
          },
        });
      } catch (error) {
        // Déjà récompensé pour ce défi (contrainte unique) : on ne verse pas deux fois
        if ((error as { code?: string }).code === 'P2002') continue;
        throw error;
      }

      await xpService.addXp(tip.userId, XpAction.CHALLENGE_REWARD, challenge.xpBonus);
      await notificationService.notify(tip.userId, {
        type: 'CHALLENGE',
        title: `Défi réussi : +${challenge.xpBonus} XP`,
        body: `« ${challenge.title} », offert par ${challenge.sponsorName}`,
        link: `/tips/${tip.id}`,
      });
      rewarded.push(challenge.id);
    }

    return rewarded;
  }

  // ---------- Administration ----------

  async list() {
    const challenges = await prisma.sponsoredChallenge.findMany({
      include: {
        category: { select: { id: true, name: true } },
        campaign: { select: { id: true, name: true } },
        _count: { select: { rewards: true } },
      },
      orderBy: { startsAt: 'desc' },
    });
    return challenges.map(({ _count, ...challenge }) => ({
      ...challenge,
      rewardsGiven: _count.rewards,
    }));
  }

  async create(data: ChallengeInput) {
    await this.assertCategoryExists(data.categoryId);
    return prisma.sponsoredChallenge.create({
      data: this.toData(data) as Prisma.SponsoredChallengeUncheckedCreateInput,
    });
  }

  async update(id: number, data: Partial<ChallengeInput>) {
    await this.findOrThrow(id);
    if (data.categoryId) await this.assertCategoryExists(data.categoryId);
    return prisma.sponsoredChallenge.update({ where: { id }, data: this.toData(data) });
  }

  async remove(id: number) {
    await this.findOrThrow(id);
    await prisma.sponsoredChallenge.delete({ where: { id } });
  }

  private toData(data: Partial<ChallengeInput>): Prisma.SponsoredChallengeUncheckedUpdateInput {
    return {
      ...data,
      ...(data.startsAt ? { startsAt: new Date(data.startsAt) } : {}),
      ...(data.endsAt ? { endsAt: new Date(data.endsAt) } : {}),
    };
  }

  private async assertCategoryExists(categoryId: number) {
    if (!(await prisma.category.findUnique({ where: { id: categoryId } }))) {
      throw new AppError('category not found', 400);
    }
  }

  private async findOrThrow(id: number) {
    const challenge = await prisma.sponsoredChallenge.findUnique({ where: { id } });
    if (!challenge) {
      throw new AppError('challenge not found', 404);
    }
    return challenge;
  }
}

export const challengeService = new ChallengeService();
