import { tipRepository } from './tip.repository';
import type { Prisma, Tip } from '@prisma/client';
import { prisma } from '../../db/prisma';
import { assertCanParticipate } from '../../utils/accountStatus.util';
import { AppError } from '../../utils/appError.util';
import { xpService } from '../xp/xp.service';
import { badgeService } from '../badges/badge.service';
import { XpAction } from '../../types/xp.types';
import type { CreateTipDto, GetTipsQuery, UpdateTipDto } from './tip.validation';

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
