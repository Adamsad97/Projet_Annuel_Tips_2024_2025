import type { Response, NextFunction, Router } from 'express';
import express from 'express';
import { notificationService } from './notification.service';
import { requireAuth } from '../../middlewares/auth.middleware';
import { parseIdParam } from '../../utils/params.util';
import { ROUTES } from '../../config/routes';
import type { RequestWithUser } from '../../types/auth.types';

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

  build(): Router {
    const router = express.Router();
    router.get(ROUTES.notifications.list, requireAuth, this.list);
    router.post(ROUTES.notifications.readAll, requireAuth, this.markAllRead);
    router.patch(ROUTES.notifications.read, requireAuth, this.markRead);
    return router;
  }
}
