import webpush from 'web-push';
import { prisma } from '../../db/prisma';
import { env } from '../../config/env';
import { AppError } from '../../utils/appError.util';

export interface PushSubscriptionInput {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export interface PushPayload {
  title: string;
  body?: string | null;
  link?: string | null;
}

// Le service push du navigateur répond 404 ou 410 quand l'abonnement n'existe plus
const EXPIRED_STATUS_CODES = [404, 410];
// Une notification non délivrée sous 24 h (appareil éteint) n'a plus d'intérêt
const PUSH_TTL_SECONDS = 24 * 60 * 60;

let configured = false;

export const pushService = {
  isEnabled(): boolean {
    return Boolean(env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY);
  },

  getPublicKey(): string {
    if (!this.isEnabled()) {
      throw new AppError('push notifications are not configured', 503);
    }
    return env.VAPID_PUBLIC_KEY;
  },

  // Un navigateur n'a qu'un abonnement : s'il change de compte, l'abonnement suit le nouveau membre
  async subscribe(userId: number, subscription: PushSubscriptionInput) {
    const data = {
      userId,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    };
    await prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      create: { endpoint: subscription.endpoint, ...data },
      update: data,
    });
  },

  async unsubscribe(userId: number, endpoint: string): Promise<void> {
    await prisma.pushSubscription.deleteMany({ where: { userId, endpoint } });
  },

  // Envoie la notification à tous les appareils du membre et oublie les abonnements expirés
  async sendToUser(userId: number, payload: PushPayload): Promise<void> {
    if (!this.isEnabled()) return;

    if (!configured) {
      webpush.setVapidDetails(env.VAPID_SUBJECT, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);
      configured = true;
    }

    const subscriptions = await prisma.pushSubscription.findMany({ where: { userId } });
    const message = JSON.stringify({
      title: payload.title,
      body: payload.body ?? '',
      link: payload.link ?? '/',
    });

    await Promise.all(
      subscriptions.map(async (subscription) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: { p256dh: subscription.p256dh, auth: subscription.auth },
            },
            message,
            { TTL: PUSH_TTL_SECONDS },
          );
        } catch (error) {
          const statusCode = (error as { statusCode?: number }).statusCode;
          if (statusCode && EXPIRED_STATUS_CODES.includes(statusCode)) {
            await prisma.pushSubscription.deleteMany({ where: { id: subscription.id } });
            return;
          }
          throw error;
        }
      }),
    );
  },
};
