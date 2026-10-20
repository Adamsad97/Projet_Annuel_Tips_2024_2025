import type { Request, Response, NextFunction, Router } from 'express';
import express from 'express';
import { twoFactorService } from './twoFactor.service';
import {
  enableTwoFactorSchema,
  disableTwoFactorSchema,
  loginTwoFactorSchema,
} from './twoFactor.validation';
import { validateSchema } from '../../middlewares/validate.middleware';
import { requireAuth } from '../../middlewares/auth.middleware';
import { authLimiter } from '../../middlewares/rateLimiter.middleware';
import { ROUTES } from '../../config/routes';
import type { RequestWithUser } from '../../types/auth.types';

export class TwoFactorController {
  setup = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const data = await twoFactorService.setup(req.user!.id);
      res.status(200).json({ success: true, data });
    } catch (e) {
      next(e);
    }
  };

  enable = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const data = await twoFactorService.enable(req.user!.id, req.body);
      res.status(200).json({ success: true, data });
    } catch (e) {
      next(e);
    }
  };

  disable = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      await twoFactorService.disable(req.user!.id, req.body);
      res.status(200).json({ success: true, message: 'two-factor authentication disabled' });
    } catch (e) {
      next(e);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await twoFactorService.login(req.body);
      res.status(200).json({ success: true, data });
    } catch (e) {
      next(e);
    }
  };

  build(): Router {
    const router = express.Router();
    router.post(ROUTES.twoFactor.setup, requireAuth, authLimiter, this.setup);
    router.post(
      ROUTES.twoFactor.enable,
      requireAuth,
      authLimiter,
      validateSchema(enableTwoFactorSchema),
      this.enable,
    );
    router.post(
      ROUTES.twoFactor.disable,
      requireAuth,
      authLimiter,
      validateSchema(disableTwoFactorSchema),
      this.disable,
    );
    router.post(
      ROUTES.twoFactor.login,
      authLimiter,
      validateSchema(loginTwoFactorSchema),
      this.login,
    );
    return router;
  }
}
