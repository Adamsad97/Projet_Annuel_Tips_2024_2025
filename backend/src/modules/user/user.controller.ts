import type { Request, Response, NextFunction, Router } from 'express';
import express from 'express';
import { userService } from './user.service';
import { validateSchema } from '../../middlewares/validate.middleware';
import { registerSchema, loginSchema } from './user.validation';
import { ROUTES } from '../../config/routes';
import { requireAuth } from '../../middlewares/auth.middleware';
import { authLimiter } from '../../middlewares/rateLimiter.middleware';
import type { RequestWithUser } from '../../types/auth.types';
import type { z } from 'zod';

type RegisterBody = z.infer<typeof registerSchema>;
type LoginBody = z.infer<typeof loginSchema>;

export class UserController {
  register = async (req: Request<unknown, unknown, RegisterBody>, res: Response) => {
    const { email, password, username, firstname, lastname } = req.body;
    const user = await userService.register(email, password, username, firstname, lastname);
    res.status(201).json({ success: true, data: user });
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      const { accessToken, refreshToken, user } = await userService.login(email, password);

      return res.status(200).json({
        success: true,
        data: {
          user,
          accessToken,
          refreshToken,
        },
      });
    } catch (e) {
      next(e);
    }
  };

  getMe = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, status: 401, message: 'unauthorized' });
      }
      const user = await userService.getUserById(req.user.id);
      res.status(200).json({ success: true, data: user });
    } catch (e) {
      next(e);
    }
  };

  build(): Router {
    const router = express.Router();

    router.post(ROUTES.users.register, authLimiter, validateSchema(registerSchema), this.register);

    router.post(ROUTES.users.login, authLimiter, validateSchema(loginSchema), this.login);

    router.get(ROUTES.users.profile, requireAuth, this.getMe);

    return router;
  }
}
