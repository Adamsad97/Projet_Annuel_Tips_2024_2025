import type { Request, Response, NextFunction, Router } from 'express';
import express from 'express';
import {
  verifyRefreshTokenOrThrow,
  createAccessToken,
  createRefreshToken,
} from '../../utils/jwt.util';
import { AppError } from '../../utils/appError.util';
import type { RequestWithUser } from '../../types/auth.types';
import { requireAuth } from '../../middlewares/auth.middleware';
import { authLimiter } from '../../middlewares/rateLimiter.middleware';
import { ROUTES } from '../../config/routes';
import { userRepository } from '../user/user.repository';

export class AuthController {
  refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token =
        (req.body?.refreshToken as string) || (req.headers.authorization?.split(' ')[1] as string);

      if (!token) throw new AppError('refresh token required', 401);

      const payload = verifyRefreshTokenOrThrow(token);

      const user = await userRepository.findById(payload.id);
      if (!user) {
        throw new AppError('invalid refresh token', 401);
      }

      const newPayload = {
        id: payload.id,
        email: payload.email,
      };

      const accessToken = createAccessToken(newPayload);
      const refreshToken = createRefreshToken(newPayload);

      return res.status(200).json({
        success: true,
        data: {
          accessToken,
          refreshToken,
        },
      });
    } catch (e) {
      next(e);
    }
  };

  logout = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      return res.status(200).json({
        success: true,
        data: { message: 'logged out successfully' },
      });
    } catch (e) {
      next(e);
    }
  };

  build(): Router {
    const router = express.Router();
    router.post(ROUTES.auth.refresh, authLimiter, this.refresh);
    router.post(ROUTES.auth.logout, requireAuth, this.logout);
    return router;
  }
}
