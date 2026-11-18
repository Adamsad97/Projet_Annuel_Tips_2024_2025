import type { Response, NextFunction, Router } from 'express';
import express from 'express';
import { notificationService } from './notification.service';
import { requireAuth } from '../../middlewares/auth.middleware';
import { parseIdParam } from '../../utils/params.util';
import { ROUTES } from '../../config/routes';
import type { RequestWithUser } from '../../types/auth.types';
import { validateSchema } from '../../middlewares/validate.middleware';
import { AppError } from '../../utils/appError.util';
import { pushService } from './push.service';
import { pushSubscriptionSchema, pushUnsubscribeSchema } from './notification.validation';

export class NotificationController {
  list = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const data = await notificationService.list(req.user!.id);
      res.status(200).json({ success: true, data });
    } catch (e) {
      next(e);
    }
  };

  markRead = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const id = parseIdParam(req.params.id, 'notification id');
      const data = await notificationService.markRead(id, req.user!.id);
      res.status(200).json({ success: true, data });
    } catch (e) {
      next(e);
    }
  };

  markAllRead = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      await notificationService.markAllRead(req.user!.id);
      res.status(200).json({ success: true, message: 'all notifications marked as read' });
    } catch (e) {
      next(e);
    }
  };

  // Clé publique VAPID dont le navigateur a besoin pour s'abonner ; 503 si le push n'est pas configuré
  pushPublicKey = async (_req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      res.status(200).json({ success: true, data: { publicKey: pushService.getPublicKey() } });
    } catch (e) {
      next(e);
    }
  };

  pushSubscribe = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      if (!pushService.isEnabled()) {
        throw new AppError('push notifications are not configured', 503);
      }
      await pushService.subscribe(req.user!.id, req.body);
      res.status(201).json({ success: true, message: 'push subscription saved' });
    } catch (e) {
      next(e);
    }
  };

  pushUnsubscribe = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      await pushService.unsubscribe(req.user!.id, req.body.endpoint);
      res.status(200).json({ success: true, message: 'push subscription removed' });
    } catch (e) {
      next(e);
    }
  };

  build(): Router {
    const router = express.Router();
    router.get(ROUTES.notifications.pushPublicKey, this.pushPublicKey);
    router.post(
      ROUTES.notifications.pushSubscriptions,
      requireAuth,
      validateSchema(pushSubscriptionSchema),
      this.pushSubscribe,
    );
    router.delete(
      ROUTES.notifications.pushSubscriptions,
      requireAuth,
      validateSchema(pushUnsubscribeSchema),
      this.pushUnsubscribe,
    );
    router.get(ROUTES.notifications.list, requireAuth, this.list);
    router.post(ROUTES.notifications.readAll, requireAuth, this.markAllRead);
    router.patch(ROUTES.notifications.read, requireAuth, this.markRead);
    return router;
  }
}
