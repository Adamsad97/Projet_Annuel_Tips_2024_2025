import type { Response, NextFunction, Router } from 'express';
import express from 'express';
import { z } from 'zod';
import { featureService } from '../features/feature.service';
import { logService } from '../logs/log.service';
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

// Routes publiques de la plateforme : fonctionnalités actives et remontée d'erreurs du frontend
export class PlatformController {
  getFeatures = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const data = await featureService.getFeaturesFor(req.user?.id);
      res.status(200).json({ success: true, data });
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
