import type { Prisma } from '@prisma/client';
import { prisma } from '../../db/prisma';

export const userRepository = {
  findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: {
        moderator: true,
        admin: true,
      },
    });
  },

  findById(id: number) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        moderator: true,
        admin: true,
      },
    });
  },

  async create(
    email: string,
    passwordHash: string,
    username: string,
    firstname?: string,
    lastname?: string,
  ) {
    return prisma.user.create({
      data: {
        username,
        email,
        password: passwordHash,
        firstname: firstname && firstname.length > 0 ? firstname : username,
        lastname: lastname && lastname.length > 0 ? lastname : undefined,
      },
    });
  },

  update(id: number, data: Prisma.UserUpdateInput) {
    return prisma.user.update({
      where: { id },
      data,
      include: {
        moderator: true,
        admin: true,
      },
    });
  },

  findPublicProfile(id: number, recentTipsCount: number) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        firstname: true,
        lastname: true,
        avatarProfile: true,
        bio: true,
        address: true,
        xp: true,
        createdAt: true,
        grade: true,
        moderator: { select: { isActive: true } },
        admin: { select: { userId: true } },
        userBadges: {
          include: { badge: true },
          orderBy: { earnedAt: 'desc' },
        },
        tips: {
          where: { status: 'APPROVED' },
          include: {
            categories: { include: { category: true } },
            _count: { select: { comments: true, votes: true, views: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: recentTipsCount,
        },
        _count: { select: { comments: true } },
      },
    });
  },
};
