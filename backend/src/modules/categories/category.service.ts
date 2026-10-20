import { prisma } from '../../db/prisma';
import { AppError } from '../../utils/appError.util';
import { notificationService } from '../notifications/notification.service';

export class CategoryService {
  // Catégories avec leur nombre de tips publiés ; isFollowed si un utilisateur est connecté
  async listCategories(userId?: number) {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { tips: { where: { tip: { status: 'APPROVED' } } } } },
        followers: userId ? { where: { userId }, select: { userId: true } } : false,
      },
    });

    return categories.map(({ _count, followers, ...category }) => ({
      ...category,
      tipsCount: _count.tips,
      isFollowed: !!followers?.length,
    }));
  }

  async listFollowed(userId: number) {
    const follows = await prisma.categoryFollow.findMany({
      where: { userId },
      include: { category: true },
      orderBy: { createdAt: 'asc' },
    });
    return follows.map((follow) => follow.category);
  }

  async follow(userId: number, categoryId: number): Promise<void> {
    await this.findCategoryOrThrow(categoryId);
    await prisma.categoryFollow.upsert({
      where: { userId_categoryId: { userId, categoryId } },
      update: {},
      create: { userId, categoryId },
    });
  }

  async unfollow(userId: number, categoryId: number): Promise<void> {
    await prisma.categoryFollow.deleteMany({ where: { userId, categoryId } });
  }

  // Appelé à la publication d'un tip : prévient (en temps réel) les abonnés de ses catégories
  // et les abonnés de son auteur
  async notifyFollowersOfNewTip(tip: {
    id: number;
    title: string;
    userId: number;
    categories: Array<{ category: { id: number; name: string } }>;
  }): Promise<number> {
    const categoryIds = tip.categories.map((c) => c.category.id);

    const [follows, authorFollowers, author] = await Promise.all([
      categoryIds.length > 0
        ? prisma.categoryFollow.findMany({
            where: { categoryId: { in: categoryIds }, userId: { not: tip.userId } },
            include: { category: { select: { name: true } } },
          })
        : Promise.resolve([]),
      prisma.userSubscription.findMany({
        where: { followedId: tip.userId },
        select: { followerId: true },
      }),
      prisma.user.findUnique({ where: { id: tip.userId }, select: { username: true } }),
    ]);

    // Un abonné à plusieurs catégories (ou à l'auteur) ne reçoit qu'une notification
    const titleByUser = new Map<number, string>();
    for (const { followerId } of authorFollowers) {
      titleByUser.set(followerId, `Nouveau tip de ${author?.username ?? 'un membre suivi'}`);
    }
    for (const follow of follows) {
      if (!titleByUser.has(follow.userId)) {
        titleByUser.set(follow.userId, `Nouveau tip dans ${follow.category.name}`);
      }
    }

    for (const [userId, title] of titleByUser) {
      await notificationService.notify(userId, {
        type: 'NEW_TIP',
        title,
        body: tip.title,
        link: `/tips/${tip.id}`,
      });
    }

    return titleByUser.size;
  }

  private async findCategoryOrThrow(id: number) {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw new AppError('category not found', 404);
    }
    return category;
  }
}

export const categoryService = new CategoryService();
