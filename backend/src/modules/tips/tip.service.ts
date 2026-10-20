import { tipRepository } from './tip.repository';
import type { Prisma, Tip } from '@prisma/client';
import { prisma } from '../../db/prisma';
import { assertCanParticipate } from '../../utils/accountStatus.util';
import { AppError } from '../../utils/appError.util';
import { xpService } from '../xp/xp.service';
import { badgeService } from '../badges/badge.service';
import { XpAction } from '../../types/xp.types';
import type { CreateTipDto, GetTipsQuery, UpdateTipDto } from './tip.validation';
import { isStaff } from '../../utils/roles.util';

// Longueur du contenu visible par un visiteur non connecté
export const PREVIEW_LENGTH = 200;
const DAY_MS = 24 * 60 * 60 * 1000;

// Score de tendance : votes, commentaires et vues sur la période, bonus pour les tips récents
const TRENDING_WEIGHTS = { upvote: 3, downvote: -2, comment: 2, view: 0.5, newTipBonus: 5 };

type TipWithContent = Tip & { comments?: unknown };

// Version "aperçu" d'un tip pour les visiteurs : début du contenu, sans images ni commentaires
export const toPreview = <T extends TipWithContent>(tip: T) => {
  const { comments: _comments, ...rest } = tip;
  const content = tip.content ?? '';
  return {
    ...rest,
    content: content.length > PREVIEW_LENGTH ? `${content.slice(0, PREVIEW_LENGTH)}…` : content,
    images: [],
    isPreview: true,
  };
};

const resolveCategoryIds = async (names: string[]): Promise<number[]> => {
  const categories = await prisma.category.findMany({ select: { id: true, name: true } });
  const byName = new Map(categories.map((category) => [category.name.toLowerCase(), category.id]));

  const unknown = names.filter((name) => !byName.has(name.toLowerCase()));
  if (unknown.length > 0) {
    throw new AppError(`Unknown categories: ${unknown.join(', ')}`, 400);
  }

  return [...new Set(names.map((name) => byName.get(name.toLowerCase()) as number))];
};

export const tipService = {
  getAllTips: async (
    query?: Omit<GetTipsQuery, 'skip' | 'take'> & { skip?: number; take?: number },
  ): Promise<Tip[]> => {
    const { q, category, located, skip = 0, take = 50 } = query || {};

    const where: Prisma.TipWhereInput = { status: 'APPROVED' }; // Ne montrer que les tips approuvés

    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { content: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.categories = {
        some: { category: { name: { equals: category, mode: 'insensitive' } } },
      };
    }

    if (located) {
      where.latitude = { not: null };
      where.longitude = { not: null };
    }

    return tipRepository.findAll({ skip, take, where });
  },

  getTipById: async (id: number): Promise<Tip> => {
    const tip = await tipRepository.findById(id);

    if (!tip) {
      throw new AppError('Tip not found', 404);
    }

    return tip;
  },

  // Détail selon le lecteur : aperçu pour un visiteur, complet pour un membre connecté.
  // Un tip non publié n'est visible que par son auteur, les modérateurs et les admins.
  getTipForViewer: async (id: number, viewerId?: number) => {
    const tip = await tipRepository.findById(id);
    if (!tip) {
      throw new AppError('Tip not found', 404);
    }

    if (tip.status !== 'APPROVED') {
      const allowed = !!viewerId && (viewerId === tip.userId || (await isStaff(viewerId)));
      if (!allowed) {
        throw new AppError('Tip not found', 404);
      }
      return tip;
    }

    await tipService.recordView(id, viewerId);
    return viewerId ? tip : toPreview(tip);
  },

  // Une vue par membre (les visiteurs anonymes sont comptés à chaque visite)
  recordView: async (tipId: number, userId?: number): Promise<void> => {
    if (userId) {
      const alreadyViewed = await prisma.tipsView.findFirst({ where: { tipId, userId } });
      if (alreadyViewed) return;
    }
    await prisma.tipsView.create({ data: { tipId, userId } });
  },

  // Tips les plus populaires sur la période (activité récente, pas seulement les plus anciens)
  getTrending: async (days: number, take = 20) => {
    const since = new Date(Date.now() - days * DAY_MS);
    const recentActivity = { createdAt: { gte: since } };

    const tips = await prisma.tip.findMany({
      where: {
        status: 'APPROVED',
        OR: [
          recentActivity,
          { votes: { some: recentActivity } },
          { comments: { some: recentActivity } },
          { views: { some: { viewedAt: { gte: since } } } },
        ],
      },
      include: {
        user: { select: { id: true, firstname: true, lastname: true, avatarProfile: true } },
        categories: { include: { category: true } },
        _count: {
          select: {
            comments: { where: recentActivity },
            views: { where: { viewedAt: { gte: since } } },
            votes: true,
          },
        },
      },
    });

    const votes = await prisma.vote.groupBy({
      by: ['tipId', 'value'],
      where: { tipId: { in: tips.map((tip) => tip.id) }, ...recentActivity },
      _count: { _all: true },
    });
    const voteCount = (tipId: number, positive: boolean) =>
      votes
        .filter((v) => v.tipId === tipId && (positive ? v.value > 0 : v.value < 0))
        .reduce((total, v) => total + v._count._all, 0);

    const w = TRENDING_WEIGHTS;
    return (
      tips
        .map((tip) => {
          const upvotes = voteCount(tip.id, true);
          const downvotes = voteCount(tip.id, false);
          const score =
            upvotes * w.upvote +
            downvotes * w.downvote +
            tip._count.comments * w.comment +
            tip._count.views * w.view +
            (tip.createdAt >= since ? w.newTipBonus : 0);
          return {
            ...tip,
            trending: {
              score: Math.round(score * 10) / 10,
              upvotes,
              downvotes,
              comments: tip._count.comments,
              views: tip._count.views,
            },
          };
        })
        .filter((tip) => tip.trending.score > 0)
        // À score égal, le plus récent d'abord
        .sort(
          (a, b) =>
            b.trending.score - a.trending.score || b.createdAt.getTime() - a.createdAt.getTime(),
        )
        .slice(0, take)
    );
  },

  // Les interactions (commentaires, votes, signalements) ne sont possibles que sur un tip publié
  getPublishedTipOrThrow: async (id: number): Promise<Tip> => {
    const tip = await prisma.tip.findUnique({ where: { id } });

    if (!tip) {
      throw new AppError('tip not found', 404);
    }

    if (tip.status !== 'APPROVED') {
      throw new AppError('tip is not published', 400);
    }

    return tip;
  },

  createTip: async (data: CreateTipDto & { userId: number }): Promise<Tip> => {
    await assertCanParticipate(data.userId);

    const existingTips = await tipRepository.findAll({
      where: {
        userId: data.userId,
        title: {
          equals: data.title,
          mode: 'insensitive' as const,
        },
      },
      take: 10,
    });

    if (existingTips.length > 0 && data.content) {
      const duplicateFound = existingTips.some((existingTip) => {
        const normalizeText = (text: string | null | undefined): string =>
          (text || '').trim().toLowerCase();

        return normalizeText(existingTip.content) === normalizeText(data.content);
      });

      if (duplicateFound) {
        throw new AppError(
          'Vous avez déjà créé un tip avec ce titre et ce contenu. Évitez les doublons.',
          409,
        );
      }
    }

    const categoryIds = data.categories ? await resolveCategoryIds(data.categories) : [];

    const tip = await tipRepository.create({
      title: data.title,
      content: data.content,
      address: data.address,
      latitude: data.latitude,
      longitude: data.longitude,
      images: data.images,
      categories: {
        create: categoryIds.map((categoryId) => ({ category: { connect: { id: categoryId } } })),
      },
      user: {
        connect: { id: data.userId },
      },
    });

    await xpService.addXp(data.userId, XpAction.TIP_CREATED);

    await badgeService.checkAndAwardBadges(data.userId);

    return tip;
  },

  updateTip: async (id: number, userId: number, data: UpdateTipDto): Promise<Tip> => {
    const tip = await tipRepository.findById(id);

    if (!tip) {
      throw new AppError('tip not found', 404);
    }

    if (tip.userId !== userId) {
      throw new AppError('unauthorized to update this tip', 403);
    }

    const { categories, ...fields } = data;
    const updateData: Prisma.TipUpdateInput = { ...fields };

    if (categories) {
      const categoryIds = await resolveCategoryIds(categories);
      updateData.categories = {
        deleteMany: {},
        create: categoryIds.map((categoryId) => ({ category: { connect: { id: categoryId } } })),
      };
    }

    return tipRepository.update(id, updateData);
  },

  deleteTip: async (id: number, userId: number): Promise<void> => {
    const tip = await tipRepository.findById(id);

    if (!tip) {
      throw new AppError('tip not found', 404);
    }

    if (tip.userId !== userId) {
      throw new AppError('unauthorized to delete this tip', 403);
    }

    await tipRepository.delete(id);
  },

  getTipsByUserId: async (
    userId: number,
    query?: { skip?: number; take?: number },
  ): Promise<Tip[]> => {
    const { skip = 0, take = 50 } = query || {};

    return tipRepository.findAll({
      skip,
      take,
      where: { userId },
    });
  },

  getAllTags: async (): Promise<string[]> => {
    const categories = await prisma.category.findMany({
      select: { name: true },
      orderBy: { name: 'asc' },
    });

    return categories.map((category) => category.name);
  },
};
