import { prisma } from '../../db/prisma';
import type { Prisma } from '@prisma/client';

export const gradeRepository = {
  findAll: async () => {
    return prisma.grade.findMany({
      orderBy: { xpRequired: 'asc' },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });
  },

  findById: async (id: number) => {
    return prisma.grade.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });
  },

  findByXp: async (xp: number) => {
    return prisma.grade.findFirst({
      where: { xpRequired: { lte: xp } },
      orderBy: { xpRequired: 'desc' },
    });
  },

  create: async (data: Prisma.GradeCreateInput) => {
    return prisma.grade.create({ data });
  },

  update: async (id: number, data: Prisma.GradeUpdateInput) => {
    return prisma.grade.update({
      where: { id },
      data,
    });
  },

  delete: async (id: number) => {
    return prisma.grade.delete({ where: { id } });
  },
};
