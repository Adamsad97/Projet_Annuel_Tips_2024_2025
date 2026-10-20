import type { Request, Response, NextFunction, Router } from 'express';
import express from 'express';
import { userService } from './user.service';
import { validateSchema } from '../../middlewares/validate.middleware';
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
} from './user.validation';
import { ROUTES } from '../../config/routes';
import { requireAuth } from '../../middlewares/auth.middleware';
import { authLimiter } from '../../middlewares/rateLimiter.middleware';
import type { RequestWithUser } from '../../types/auth.types';
import type { z } from 'zod';
import { xpService } from '../xp/xp.service';
import { badgeService } from '../badges/badge.service';
import { tipService } from '../tips/tip.service';
import { gamificationService } from '../gamification/gamification.service';
import { imageUpload, toUploadPath } from '../../utils/imageUpload.util';
import { parseIdParam } from '../../utils/params.util';

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
      const result = await userService.login(email, password);

      return res.status(200).json({ success: true, data: result });
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

  getMyProgress = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, status: 401, message: 'unauthorized' });
      }
      const progress = await xpService.getUserProgress(req.user.id);
      res.status(200).json({ success: true, data: progress });
    } catch (e) {
      next(e);
    }
  };

  getMyBadges = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, status: 401, message: 'unauthorized' });
      }
      const badges = await badgeService.getAllBadgesWithStatus(req.user.id);
      res.status(200).json({ success: true, data: badges });
    } catch (e) {
      next(e);
    }
  };

  getLeaderboard = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const skip = parseInt(req.query.skip as string) || 0;
      const take = parseInt(req.query.take as string) || 10;

      const leaderboard = await xpService.getLeaderboard(take, skip);
      res.status(200).json({ success: true, data: leaderboard });
    } catch (e) {
      next(e);
    }
  };

  getMyTips = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, status: 401, message: 'unauthorized' });
      }
      const skip = parseInt(req.query.skip as string) || 0;
      const take = parseInt(req.query.take as string) || 50;

      const tips = await tipService.getTipsByUserId(req.user.id, { skip, take });
      res.status(200).json({ success: true, data: tips });
    } catch (e) {
      next(e);
    }
  };

  updateProfile = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const user = await userService.updateProfile(req.user!.id, req.body);
      res.status(200).json({ success: true, data: user });
    } catch (e) {
      next(e);
    }
  };

  changePassword = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      await userService.changePassword(req.user!.id, req.body);
      res.status(200).json({ success: true, message: 'password updated' });
    } catch (e) {
      next(e);
    }
  };

  uploadAvatar = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const [file] = req.files as Express.Multer.File[];
      const user = await userService.updateAvatar(
        req.user!.id,
        toUploadPath('avatars', file!.filename),
      );
      res.status(200).json({ success: true, data: user });
    } catch (e) {
      next(e);
    }
  };

  removeAvatar = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const user = await userService.removeAvatar(req.user!.id);
      res.status(200).json({ success: true, data: user });
    } catch (e) {
      next(e);
    }
  };

  getPublicProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseIdParam(req.params.id as string | undefined, 'user id');
      const profile = await userService.getPublicProfile(id);
      res.status(200).json({ success: true, data: profile });
    } catch (e) {
      next(e);
    }
  };

  getMyPerks = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const perks = await gamificationService.getPerks(req.user!.id);
      res.status(200).json({ success: true, data: perks });
    } catch (e) {
      next(e);
    }
  };

  build(): Router {
    const router = express.Router();

    router.post(ROUTES.users.register, authLimiter, validateSchema(registerSchema), this.register);

    router.post(ROUTES.users.login, authLimiter, validateSchema(loginSchema), this.login);

    router.get(ROUTES.users.profile, requireAuth, this.getMe);

    router.get(ROUTES.users.progress, requireAuth, this.getMyProgress);
    router.get(ROUTES.users.badges, requireAuth, this.getMyBadges);
    router.get(ROUTES.users.perks, requireAuth, this.getMyPerks);
    router.get(ROUTES.users.tips, requireAuth, this.getMyTips);
    router.get(ROUTES.users.leaderboard, this.getLeaderboard);

    router.patch(
      ROUTES.users.profile,
      requireAuth,
      validateSchema(updateProfileSchema),
      this.updateProfile,
    );
    router.patch(
      ROUTES.users.password,
      requireAuth,
      validateSchema(changePasswordSchema),
      this.changePassword,
    );
    router.post(
      ROUTES.users.avatar,
      requireAuth,
      imageUpload('avatars', 'avatar', 1),
      this.uploadAvatar,
    );
    router.delete(ROUTES.users.avatar, requireAuth, this.removeAvatar);

    // En dernier : /:id ne doit pas masquer les routes ci-dessus
    router.get(ROUTES.users.publicProfile, requireAuth, this.getPublicProfile);

    return router;
  }
}
