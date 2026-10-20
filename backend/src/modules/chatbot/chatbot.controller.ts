import type { Response, NextFunction, Router } from 'express';
import express from 'express';
import { chatbotService } from './chatbot.service';
import { featureService } from '../features/feature.service';
import { askSchema } from './chatbot.validation';
import { validateSchema } from '../../middlewares/validate.middleware';
import { requireAuth } from '../../middlewares/auth.middleware';
import { strictLimiter } from '../../middlewares/rateLimiter.middleware';
import { ROUTES } from '../../config/routes';
import type { RequestWithUser } from '../../types/auth.types';

export class ChatbotController {
  getConfig = async (_req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      await featureService.assertEnabled('chatbot', _req.user?.id);
      const { greeting } = await chatbotService.getConfig();
      res.status(200).json({ success: true, data: { greeting } });
    } catch (e) {
      next(e);
    }
  };

  ask = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      await featureService.assertEnabled('chatbot', req.user!.id);
      const data = await chatbotService.ask(req.body.question, req.user!.id);
      res.status(200).json({ success: true, data });
    } catch (e) {
      next(e);
    }
  };

  build(): Router {
    const router = express.Router();
    router.get(ROUTES.chatbot.config, requireAuth, this.getConfig);
    router.post(
      ROUTES.chatbot.ask,
      requireAuth,
      strictLimiter,
      validateSchema(askSchema),
      this.ask,
    );
    return router;
  }
}
