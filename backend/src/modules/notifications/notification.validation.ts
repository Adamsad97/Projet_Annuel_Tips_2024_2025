import { z } from 'zod';

const endpoint = z.url('endpoint must be a valid url').max(1000, 'endpoint is too long');

// Format de PushSubscription.toJSON() côté navigateur
export const pushSubscriptionSchema = z.object({
  endpoint,
  keys: z.object({
    p256dh: z.string().min(1, 'p256dh key is required').max(200),
    auth: z.string().min(1, 'auth key is required').max(100),
  }),
});

export const pushUnsubscribeSchema = z.object({ endpoint });
