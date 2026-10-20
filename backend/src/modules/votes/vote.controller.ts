import type { Response, NextFunction, Router } from 'express';
import express from 'express';
import { voteService } from './vote.service';
import { voteSchema } from './vote.validation';
import { validateSchema } from '../../middlewares/validate.middleware';
import { requireAuth } from '../../middlewares/auth.middleware';
import { parseIdParam } from '../../utils/params.util';
import { ROUTES } from '../../config/routes';
import type { RequestWithUser } from '../../types/auth.types';

export class VoteController {
  voteOnTip = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const tipId = parseIdParam(req.params.tipId, 'tip id');
      const summary = await voteService.voteOnTip(tipId, req.user!.id, req.body.value);
      res.status(200).json({ success: true, data: summary });
    } catch (e) {
      next(e);
    }
  };

  voteOnComment = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const commentId = parseIdParam(req.params.id, 'comment id');
      const summary = await voteService.voteOnComment(commentId, req.user!.id, req.body.value);
      res.status(200).json({ success: true, data: summary });
    } catch (e) {
      next(e);
    }
  };

  build(): Router {
    const router = express.Router();
    router.post(ROUTES.votes.tip, requireAuth, validateSchema(voteSchema), this.voteOnTip);
    router.post(ROUTES.votes.comment, requireAuth, validateSchema(voteSchema), this.voteOnComment);
    return router;
  }
}
