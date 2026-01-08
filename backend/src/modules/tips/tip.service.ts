import { tipRepository } from './tip.repository';
import type { Tip } from '@prisma/client';
import { AppError } from '../../utils/appError.util';
import { xpService } from '../xp/xp.service';
import { badgeService } from '../badges/badge.service';
import { XpAction } from '../../types/xp.types';

export const tipService = {
  getAllTips: async (query?: { q?: string; skip?: number; take?: number }): Promise<Tip[]> => {
    const { q, skip = 0, take = 50 } = query || {};

    const where = q
      ? {
          OR: [
            { title: { contains: q, mode: 'insensitive' as const } },
            { content: { contains: q, mode: 'insensitive' as const } },
          ],
          status: 'APPROVED' as const, // Ne montrer que les tips approuvés
        }
      : { status: 'APPROVED' as const };

    return tipRepository.findAll({ skip, take, where });
  },

  getTipById: async (id: number): Promise<Tip> => {
    const tip = await tipRepository.findById(id);

    if (!tip) {
      throw new AppError('Tip not found', 404);
    }

    return tip;
  },

  createTip: async (data: { title: string; content?: string; userId: number }): Promise<Tip> => {
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

    const tip = await tipRepository.create({
      title: data.title,
      content: data.content,
      user: {
        connect: { id: data.userId },
      },
    });

    await xpService.addXp(data.userId, XpAction.TIP_CREATED);

    await badgeService.checkAndAwardBadges(data.userId);

    return tip;
  },

  updateTip: async (
    id: number,
    userId: number,
    data: { title?: string; content?: string },
  ): Promise<Tip> => {
    const tip = await tipRepository.findById(id);

    if (!tip) {
      throw new AppError('tip not found', 404);
    }

    if (tip.userId !== userId) {
      throw new AppError('unauthorized to update this tip', 403);
    }

    return tipRepository.update(id, data);
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
    return [
      'React',
      'Vue',
      'Docker',
      'Node.js',
      'TypeScript',
      'PostgreSQL',
      'Git',
      'CSS',
      'JavaScript',
      'API',
    ];
  },
};
