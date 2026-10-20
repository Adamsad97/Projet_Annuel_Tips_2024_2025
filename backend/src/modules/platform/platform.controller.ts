import type { Response, NextFunction, Router } from 'express';
import express from 'express';
import { z } from 'zod';
import { featureService } from '../features/feature.service';
import { logService } from '../logs/log.service';
import { platformService } from './platform.service';
import { XP_REWARDS } from '../../types/xp.types';
import { validateSchema } from '../../middlewares/validate.middleware';
import { optionalAuth } from '../../middlewares/auth.middleware';
import { strictLimiter } from '../../middlewares/rateLimiter.middleware';
import { ROUTES } from '../../config/routes';
import type { RequestWithUser } from '../../types/auth.types';

// Erreur JavaScript remontée par le navigateur
const clientErrorSchema = z.object({
  message: z.string().trim().min(1).max(1000),
  stack: z.string().max(8000).optional(),
  path: z.string().max(500).optional(),
  context: z.record(z.string(), z.unknown()).optional(),
});

// Message du formulaire de contact
export const contactMessageSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(200),
  message: z.string().trim().min(10).max(5000),
});

// Routes publiques de la plateforme : fonctionnalités actives, statistiques, grades,
// formulaire de contact et remontée d'erreurs du frontend
export class PlatformController {
  getFeatures = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const data = await featureService.getFeaturesFor(req.user?.id);
      res.status(200).json({ success: true, data });
    } catch (e) {
      next(e);
    }
  };

  getStats = async (_req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      res.status(200).json({ success: true, data: await platformService.getStats() });
    } catch (e) {
      next(e);
    }
  };

  getGrades = async (_req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      res.status(200).json({ success: true, data: await platformService.listGrades() });
    } catch (e) {
      next(e);
    }
  };

  // Barème d'XP réellement appliqué (affiché sur le profil)
  getXpRules = (_req: RequestWithUser, res: Response) => {
    res.status(200).json({ success: true, data: XP_REWARDS });
  };

  sendContactMessage = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const data = req.body as z.infer<typeof contactMessageSchema>;
      await platformService.createContactMessage(data, req.user?.id);
      res.status(201).json({ success: true });
    } catch (e) {
      next(e);
    }
  };

  reportClientError = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const { message, stack, path, context } = req.body as z.infer<typeof clientErrorSchema>;
      await logService.record({
        source: 'client',
        message,
        stack,
        path,
        userId: req.user?.id,
        context: { ...context, userAgent: req.headers['user-agent'] ?? null } as object,
      });
      res.status(201).json({ success: true });
    } catch (e) {
      next(e);
    }
  };

  build(): Router {
    const router = express.Router();
    router.get(ROUTES.platform.features, optionalAuth, this.getFeatures);
    router.get(ROUTES.platform.stats, this.getStats);
    router.get(ROUTES.platform.grades, this.getGrades);
    router.get(ROUTES.platform.xpRules, this.getXpRules);
    router.post(
      ROUTES.platform.contact,
      strictLimiter,
      optionalAuth,
      validateSchema(contactMessageSchema),
      this.sendContactMessage,
    );
    router.post(
      ROUTES.platform.clientLogs,
      strictLimiter,
      optionalAuth,
      validateSchema(clientErrorSchema),
      this.reportClientError,
    );
    return router;
  }
}
