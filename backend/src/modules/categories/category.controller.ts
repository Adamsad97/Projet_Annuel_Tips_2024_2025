import type { Response, NextFunction, Router } from 'express';
import express from 'express';
import { categoryService } from './category.service';
import { optionalAuth, requireAuth } from '../../middlewares/auth.middleware';
import { parseIdParam } from '../../utils/params.util';
import { ROUTES } from '../../config/routes';
import type { RequestWithUser } from '../../types/auth.types';

export class CategoryController {
  list = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const data = await categoryService.listCategories(req.user?.id);
      res.status(200).json({ success: true, data });
    } catch (e) {
      next(e);
    }
  };

  listFollowed = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const data = await categoryService.listFollowed(req.user!.id);
      res.status(200).json({ success: true, data });
    } catch (e) {
      next(e);
    }
  };

  follow = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      await categoryService.follow(req.user!.id, parseIdParam(req.params.id, 'category id'));
      res.status(200).json({ success: true, message: 'category followed' });
    } catch (e) {
      next(e);
    }
  };

  unfollow = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      await categoryService.unfollow(req.user!.id, parseIdParam(req.params.id, 'category id'));
      res.status(200).json({ success: true, message: 'category unfollowed' });
    } catch (e) {
      next(e);
    }
  };

  build(): Router {
    const router = express.Router();
    router.get(ROUTES.categories.list, optionalAuth, this.list);
    router.get(ROUTES.categories.followed, requireAuth, this.listFollowed);
    router.post(ROUTES.categories.follow, requireAuth, this.follow);
    router.delete(ROUTES.categories.follow, requireAuth, this.unfollow);
    return router;
  }
}
