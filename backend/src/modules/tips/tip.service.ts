import { tipRepository } from './tip.repository';
import type { Tip } from '@prisma/client';
import { AppError } from '../../utils/appError.util';

export const tipService = {
  getAllTips: async (query?: { q?: string; skip?: number; take?: number }): Promise<Tip[]> => {
    const { q, skip = 0, take = 50 } = query || {};

    const where = q
      ? {
          OR: [
            { title: { contains: q, mode: 'insensitive' as const } },
            { content: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : undefined;

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
    return tipRepository.create({
      title: data.title,
      content: data.content,
      user: {
        connect: { id: data.userId },
      },
    });
  },

  updateTip: async (
    id: number,
    userId: number,
    data: { title?: string; content?: string },
  ): Promise<Tip> => {
    const tip = await tipRepository.findById(id);

    if (!tip) {
      throw new AppError('Tip not found', 404);
    }

    if (tip.userId !== userId) {
      throw new AppError('Unauthorized to update this tip', 403);
    }

    return tipRepository.update(id, data);
  },

  deleteTip: async (id: number, userId: number): Promise<void> => {
    const tip = await tipRepository.findById(id);

    if (!tip) {
      throw new AppError('Tip not found', 404);
    }

    if (tip.userId !== userId) {
      throw new AppError('Unauthorized to delete this tip', 403);
    }

    await tipRepository.delete(id);
  },
};
