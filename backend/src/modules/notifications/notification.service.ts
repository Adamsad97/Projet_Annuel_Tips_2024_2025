import type { Notification, NotificationType } from '@prisma/client';
import { prisma } from '../../db/prisma';
import { AppError } from '../../utils/appError.util';
import { socketService } from '../../websocket/socket.service';

const NOTIFICATIONS_LIMIT = 50;

interface CreateNotificationInput {
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
}

export class NotificationService {
  // Enregistre la notification et la pousse en temps réel à l'utilisateur connecté
  async notify(userId: number, data: CreateNotificationInput): Promise<Notification> {
    const notification = await prisma.notification.create({ data: { ...data, userId } });
    socketService.emitToUser(userId, 'notification:new', notification);
    return notification;
  }

  async list(userId: number) {
    const [items, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: NOTIFICATIONS_LIMIT,
      }),
      prisma.notification.count({ where: { userId, readAt: null } }),
    ]);

    return { items, unreadCount };
  }

  async markRead(id: number, userId: number): Promise<Notification> {
    const notification = await prisma.notification.findUnique({ where: { id } });

    if (!notification || notification.userId !== userId) {
      throw new AppError('notification not found', 404);
    }

    if (notification.readAt) {
      return notification;
    }

    return prisma.notification.update({ where: { id }, data: { readAt: new Date() } });
  }

  async markAllRead(userId: number): Promise<void> {
    await prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  // Marque comme lues les notifications pointant vers une page (ex: conversation ouverte)
  async markReadByLink(userId: number, link: string): Promise<void> {
    await prisma.notification.updateMany({
      where: { userId, link, readAt: null },
      data: { readAt: new Date() },
    });
  }
}

export const notificationService = new NotificationService();
