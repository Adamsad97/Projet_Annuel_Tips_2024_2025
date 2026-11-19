import { VISIBLE_COMMENT } from '../comments/comment.visibility';
import { prisma } from '../../db/prisma';
import type { Tip, Prisma } from '@prisma/client';
import { tipAuthorSelect } from './tip.select';

export const tipRepository = {
  findAll: async (options?: {
    skip?: number;
    take?: number;
    where?: Prisma.TipWhereInput;
    include?: Prisma.TipInclude;
  }): Promise<Tip[]> => {
    return prisma.tip.findMany({
      skip: options?.skip,
      take: options?.take,
      where: options?.where,
      include: options?.include || {
        user: { select: tipAuthorSelect },
        categories: {
          include: {
            category: true,
          },
        },
        _count: {
          select: {
            comments: { where: VISIBLE_COMMENT },
            votes: true,
            views: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  },

  findById: async (id: number): Promise<Tip | null> => {
    return prisma.tip.findUnique({
      where: { id },
      include: {
        user: { select: tipAuthorSelect },
        categories: {
          include: {
            category: true,
          },
        },
        comments: {
          where: VISIBLE_COMMENT,
          include: {
            user: {
              select: {
                id: true,
                firstname: true,
                lastname: true,
                avatarProfile: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            comments: { where: VISIBLE_COMMENT },
            votes: true,
            views: true,
          },
        },
      },
    });
  },

  create: async (data: Prisma.TipCreateInput): Promise<Tip> => {
    return prisma.tip.create({
      data,
      include: {
        user: { select: tipAuthorSelect },
        categories: {
          include: {
            category: true,
          },
        },
      },
    });
  },

  update: async (id: number, data: Prisma.TipUpdateInput): Promise<Tip> => {
    return prisma.tip.update({
      where: { id },
      data,
      include: {
        categories: {
          include: {
            category: true,
          },
        },
      },
    });
  },

  delete: async (id: number): Promise<Tip> => {
    return prisma.tip.delete({
      where: { id },
    });
  },

  count: async (where?: Prisma.TipWhereInput): Promise<number> => {
    return prisma.tip.count({ where });
  },
};
