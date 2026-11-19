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
import { authLimiter, strictLimiter } from '../../middlewares/rateLimiter.middleware';
import { validateSchema } from '../../middlewares/validate.middleware';
import { emailVerificationService } from './emailVerification.service';
import { resendVerificationSchema, verifyEmailSchema } from './auth.validation';
import { ROUTES } from '../../config/routes';
import { userRepository } from '../user/user.repository';
import { isBanned } from '../../utils/accountStatus.util';

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

      // Session fermée (déconnexion ou changement de mot de passe) depuis l'émission du token
      if ((payload.tokenVersion ?? 0) !== user.tokenVersion) {
        throw new AppError('session revoked', 401);
      }

      if (isBanned(user)) {
        throw new AppError('account banned', 403);
      }

      const newPayload = {
        id: user.id,
        email: user.email,
        tokenVersion: user.tokenVersion,
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

  // Révoque tous les refresh tokens de l'utilisateur ; l'access token (15 min) est effacé par le client
  logout = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      await userRepository.update(req.user!.id, { tokenVersion: { increment: 1 } });
      return res.status(200).json({
        success: true,
        data: { message: 'logged out successfully' },
      });
    } catch (e) {
      next(e);
    }
  };

  // Lien reçu par email : active le compte
  verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await emailVerificationService.verify(req.body.token);
      res.status(200).json({ success: true, message: 'email verified' });
    } catch (e) {
      next(e);
    }
  };

  // Même réponse que l'adresse soit inscrite ou non (pas de divulgation des comptes)
  resendVerification = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await emailVerificationService.resend(req.body.email);
      res.status(200).json({
        success: true,
        message: 'if this account exists and is not verified, a new email has been sent',
      });
    } catch (e) {
      next(e);
    }
  };

  build(): Router {
    const router = express.Router();
    router.post(ROUTES.auth.refresh, authLimiter, this.refresh);
    router.post(ROUTES.auth.logout, requireAuth, this.logout);
    router.post(
      ROUTES.auth.verifyEmail,
      authLimiter,
      validateSchema(verifyEmailSchema),
      this.verifyEmail,
    );
    router.post(
      ROUTES.auth.resendVerification,
      strictLimiter,
      validateSchema(resendVerificationSchema),
      this.resendVerification,
    );
    return router;
  }
}
