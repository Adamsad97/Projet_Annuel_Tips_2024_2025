import type { TipKind } from '@prisma/client';
import { prisma } from '../../db/prisma';
import { AppError } from '../../utils/appError.util';
import { isStaff } from '../../utils/roles.util';
import {
  GAMIFICATION_RULES,
  PERKS_BY_GRADE_RANK,
  STAFF_PERKS,
  isGamificationEnforced,
  type GradePerks,
} from './gamification.config';

const DAY_MS = 24 * 60 * 60 * 1000;

const perksForRank = (rank: number): GradePerks =>
  PERKS_BY_GRADE_RANK[Math.min(rank, PERKS_BY_GRADE_RANK.length - 1)]!;

interface TipDraft {
  kind: TipKind;
  content?: string | null;
  images?: string[];
  latitude?: number | null;
}

export class GamificationService {
  // Avantages actuels, quota du jour et aperçu du prochain palier
  async getPerks(userId: number) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { xp: true } });
    if (!user) {
      throw new AppError('user not found', 404);
    }

    const grades = await prisma.grade.findMany({ orderBy: { xpRequired: 'asc' } });
    const reachedGrades = grades.filter((grade) => grade.xpRequired <= user.xp);
    const rank = Math.max(0, reachedGrades.length - 1);
    const currentGrade = reachedGrades[reachedGrades.length - 1] ?? grades[0] ?? null;
    const nextGrade = grades.find((grade) => grade.xpRequired > user.xp) ?? null;
    const staff = await isStaff(userId);

    const perks = staff ? STAFF_PERKS : perksForRank(rank);
    const publishedToday = await prisma.tip.count({
      where: { userId, createdAt: { gte: new Date(Date.now() - DAY_MS) } },
    });

    return {
      xp: user.xp,
      isStaff: staff,
      grade: currentGrade ? { name: currentGrade.name, rank } : null,
      perks,
      publishedToday,
      remainingToday: Math.max(0, perks.tipsPerDay - publishedToday),
      canPublishTip: staff || user.xp >= GAMIFICATION_RULES.minXpToPublishTip,
      minXpToPublishTip: GAMIFICATION_RULES.minXpToPublishTip,
      nextGrade: nextGrade
        ? {
            name: nextGrade.name,
            xpRequired: nextGrade.xpRequired,
            xpMissing: nextGrade.xpRequired - user.xp,
            perks: perksForRank(rank + 1),
          }
        : null,
      enforced: isGamificationEnforced(),
    };
  }

  // Vérifie qu'un nouveau tip / une nouvelle question respecte les avantages du membre
  async assertCanCreate(userId: number, draft: TipDraft): Promise<void> {
    if (!isGamificationEnforced()) return;

    const status = await this.getPerks(userId);
    const { perks } = status;

    if (draft.kind === 'TIP' && !status.canPublishTip) {
      throw new AppError(
        `you need ${status.minXpToPublishTip} XP to publish a tip (you have ${status.xp}): ` +
          'ask questions and comment to earn XP',
        403,
      );
    }

    if (status.remainingToday <= 0) {
      throw new AppError(
        `daily limit reached: your grade allows ${perks.tipsPerDay} publications per 24 hours`,
        403,
      );
    }

    this.assertContentWithinPerks(perks, draft);
  }

  async assertCanUpdate(userId: number, draft: Omit<TipDraft, 'kind'>): Promise<void> {
    if (!isGamificationEnforced()) return;

    const { perks } = await this.getPerks(userId);
    this.assertContentWithinPerks(perks, draft);
  }

  // Rétrograder un membre est une permission débloquée par l'activité du modérateur
  async assertCanDowngrade(moderatorId: number): Promise<void> {
    if (!isGamificationEnforced()) return;

    const moderator = await prisma.user.findUniqueOrThrow({
      where: { id: moderatorId },
      select: { xp: true, admin: { select: { userId: true } } },
    });
    if (!moderator.admin && moderator.xp < GAMIFICATION_RULES.minModeratorXpToDowngrade) {
      throw new AppError(
        `downgrading members requires ${GAMIFICATION_RULES.minModeratorXpToDowngrade} XP ` +
          `(you have ${moderator.xp}): keep moderating to unlock it`,
        403,
      );
    }
  }

  private assertContentWithinPerks(perks: GradePerks, draft: Omit<TipDraft, 'kind'>) {
    if (draft.content && draft.content.length > perks.maxContentLength) {
      throw new AppError(
        `content too long for your grade (${perks.maxContentLength} characters max)`,
        400,
      );
    }
    if (draft.images && draft.images.length > perks.maxImages) {
      throw new AppError(`your grade allows ${perks.maxImages} image(s) per tip`, 400);
    }
    if (draft.latitude != null && !perks.canAddLocation) {
      throw new AppError('adding a location is unlocked at the next grade', 403);
    }
  }
}

export const gamificationService = new GamificationService();
