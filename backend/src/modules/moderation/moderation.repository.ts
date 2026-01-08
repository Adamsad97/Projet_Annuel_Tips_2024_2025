import { prisma } from '../../db/prisma';
import type { Prisma, ReportStatus } from '@prisma/client';

export const moderationRepository = {
  findPendingReports: async (skip: number = 0, take: number = 20) => {
    return prisma.report.findMany({
      where: { status: 'OPEN' },
      include: {
        tip: {
          include: {
            user: {
              select: {
                id: true,
                firstname: true,
                lastname: true,
                email: true,
                avatarProfile: true,
              },
            },
          },
        },
        comment: {
          include: {
            user: {
              select: {
                id: true,
                firstname: true,
                lastname: true,
                email: true,
                avatarProfile: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            email: true,
            avatarProfile: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
      skip,
      take,
    });
  },

  findReportById: async (id: number) => {
    return prisma.report.findUnique({
      where: { id },
      include: {
        tip: true,
        comment: true,
        user: true,
      },
    });
  },

  updateReportStatus: async (id: number, status: ReportStatus) => {
    return prisma.report.update({
      where: { id },
      data: { status },
    });
  },

  countPendingReports: async () => {
    return prisma.report.count({
      where: { status: 'OPEN' },
    });
  },

  createModerationAction: async (data: Prisma.ModerationActionUncheckedCreateInput) => {
    return prisma.moderationAction.create({ data });
  },

  findModeratorActions: async (moderatorId: number, limit: number = 50) => {
    return prisma.moderationAction.findMany({
      where: { moderatorId },
      include: {
        user: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  },

  isModerator: async (userId: number) => {
    const moderator = await prisma.moderator.findUnique({
      where: { userId },
    });

    return moderator !== null && moderator.isActive;
  },

  isAdmin: async (userId: number) => {
    const admin = await prisma.admin.findUnique({
      where: { userId },
    });

    return admin !== null;
  },

  promoteToModerator: async (userId: number) => {
    return prisma.moderator.upsert({
      where: { userId },
      create: { userId, isActive: true },
      update: { isActive: true },
    });
  },

  demoteModerator: async (userId: number) => {
    return prisma.moderator.update({
      where: { userId },
      data: { isActive: false },
    });
  },

  promoteToAdmin: async (userId: number) => {
    return prisma.admin.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
  },
};
