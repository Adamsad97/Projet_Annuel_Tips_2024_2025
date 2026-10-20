import type { Response, NextFunction, Router } from 'express';
import express from 'express';
import { commentService } from './comment.service';
import { createCommentSchema, updateCommentSchema } from './comment.validation';
import { validateSchema } from '../../middlewares/validate.middleware';
import { requireAuth } from '../../middlewares/auth.middleware';
import { parseIdParam } from '../../utils/params.util';
import { ROUTES } from '../../config/routes';
import type { RequestWithUser } from '../../types/auth.types';

export class CommentController {
  getTipComments = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const tipId = parseIdParam(req.params.tipId, 'tip id');
      const comments = await commentService.getTipComments(tipId, req.user?.id);
      res.status(200).json({ success: true, data: comments });
    } catch (e) {
      next(e);
    }
  };

  createComment = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const tipId = parseIdParam(req.params.tipId, 'tip id');
      const comment = await commentService.createComment(tipId, req.user!.id, req.body);
      res.status(201).json({ success: true, data: comment });
    } catch (e) {
      next(e);
    }
  };

  updateComment = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const id = parseIdParam(req.params.id, 'comment id');
      const comment = await commentService.updateComment(id, req.user!.id, req.body);
      res.status(200).json({ success: true, data: comment });
    } catch (e) {
      next(e);
    }
  };

  deleteComment = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const id = parseIdParam(req.params.id, 'comment id');
      await commentService.deleteComment(id, req.user!.id);
      res.status(200).json({ success: true, message: 'Comment deleted successfully' });
    } catch (e) {
      next(e);
    }
  };

  build(): Router {
    const router = express.Router();
    router.get(ROUTES.comments.byTip, requireAuth, this.getTipComments);
    router.post(
      ROUTES.comments.byTip,
      requireAuth,
      validateSchema(createCommentSchema),
      this.createComment,
    );
    router.patch(
      ROUTES.comments.detail,
      requireAuth,
      validateSchema(updateCommentSchema),
      this.updateComment,
    );
    router.delete(ROUTES.comments.detail, requireAuth, this.deleteComment);
    return router;
  }
}
