import type { Response, NextFunction, Router } from 'express';
import express from 'express';
import { appealService } from './appeal.service';
import { createAppealSchema } from './appeal.validation';
import { validateSchema } from '../../middlewares/validate.middleware';
import { requireAuth } from '../../middlewares/auth.middleware';
import { parseIdParam } from '../../utils/params.util';
import { ROUTES } from '../../config/routes';
import type { RequestWithUser } from '../../types/auth.types';

export class AppealController {
  listMyActions = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const data = await appealService.listMyActions(req.user!.id);
      res.status(200).json({ success: true, data });
    } catch (e) {
      next(e);
    }
  };

  createAppeal = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const actionId = parseIdParam(req.params.id, 'action id');
      const data = await appealService.createAppeal(actionId, req.user!.id, req.body.reason);
      res.status(201).json({ success: true, data });
    } catch (e) {
      next(e);
    }
  };

  build(): Router {
    const router = express.Router();
    router.get(ROUTES.appeals.mine, requireAuth, this.listMyActions);
    router.post(
      ROUTES.appeals.create,
      requireAuth,
      validateSchema(createAppealSchema),
      this.createAppeal,
    );
    return router;
  }
}
