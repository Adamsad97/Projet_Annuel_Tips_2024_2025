import type { Response, NextFunction, Router } from 'express';
import express from 'express';
import { reportService } from './report.service';
import { createReportSchema } from './report.validation';
import { validateSchema } from '../../middlewares/validate.middleware';
import { requireAuth } from '../../middlewares/auth.middleware';
import { parseIdParam } from '../../utils/params.util';
import { ROUTES } from '../../config/routes';
import type { RequestWithUser } from '../../types/auth.types';

export class ReportController {
  reportTip = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const tipId = parseIdParam(req.params.tipId, 'tip id');
      const report = await reportService.reportTip(tipId, req.user!.id, req.body.reason);
      res.status(201).json({ success: true, data: report });
    } catch (e) {
      next(e);
    }
  };

  reportComment = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const commentId = parseIdParam(req.params.id, 'comment id');
      const report = await reportService.reportComment(commentId, req.user!.id, req.body.reason);
      res.status(201).json({ success: true, data: report });
    } catch (e) {
      next(e);
    }
  };

  build(): Router {
    const router = express.Router();
    router.post(
      ROUTES.reports.tip,
      requireAuth,
      validateSchema(createReportSchema),
      this.reportTip,
    );
    router.post(
      ROUTES.reports.comment,
      requireAuth,
      validateSchema(createReportSchema),
      this.reportComment,
    );
    return router;
  }
}
