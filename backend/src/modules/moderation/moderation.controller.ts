import { Router, type Request, type Response, type NextFunction } from 'express';
import { moderationService } from './moderation.service';
import {
  resolveReportSchema,
  promoteUserSchema,
  demoteUserSchema,
  rejectTipSchema,
  updateTipStatusSchema,
} from './moderation.validation';
import { validateSchema } from '../../middlewares/validate.middleware';
import type { RequestWithUser } from '../../types/auth.types';

export class ModerationController {
  private router: Router;

  constructor() {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get('/reports', this.getPendingReports);
    this.router.post(
      '/reports/:id/resolve',
      validateSchema(resolveReportSchema),
      this.resolveReport,
    );

    this.router.get('/tips/pending', this.getPendingTips);
    this.router.post('/tips/:id/approve', this.approveTip);
    this.router.post('/tips/:id/reject', validateSchema(rejectTipSchema), this.rejectTip);

    this.router.get('/stats', this.getModerationStats);
    this.router.get('/history', this.getModeratorHistory);

    this.router.post('/users/promote', validateSchema(promoteUserSchema), this.promoteUser);
    this.router.post('/users/demote', validateSchema(demoteUserSchema), this.demoteModerator);
  }

  private getPendingReports = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const skip = parseInt(req.query.skip as string) || 0;
      const take = parseInt(req.query.take as string) || 20;

      const result = await moderationService.getPendingReports(skip, take);

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  };

  private resolveReport = async (
    req: RequestWithUser,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const reportId = parseInt(req.params.id || '0', 10);
      if (isNaN(reportId) || reportId === 0) {
        res.status(400).json({ success: false, message: 'Invalid report ID' });
        return;
      }

      const { action, reason } = req.body;

      const result = await moderationService.resolveReport(reportId, req.user.id, action, reason);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  private getPendingTips = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const skip = parseInt(req.query.skip as string) || 0;
      const take = parseInt(req.query.take as string) || 20;

      const result = await moderationService.getPendingTips(skip, take);

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  };

  private approveTip = async (
    req: RequestWithUser,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const tipId = parseInt(req.params.id || '0', 10);
      if (isNaN(tipId) || tipId === 0) {
        res.status(400).json({ success: false, message: 'Invalid tip ID' });
        return;
      }

      const tip = await moderationService.approveTip(tipId, req.user.id);

      res.status(200).json({
        success: true,
        data: tip,
      });
    } catch (error) {
      next(error);
    }
  };

  private rejectTip = async (
    req: RequestWithUser,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const tipId = parseInt(req.params.id || '0', 10);
      if (isNaN(tipId) || tipId === 0) {
        res.status(400).json({ success: false, message: 'Invalid tip ID' });
        return;
      }

      const { reason } = req.body;

      const tip = await moderationService.rejectTip(
        tipId,
        req.user.id,
        reason || 'No reason provided',
      );

      res.status(200).json({
        success: true,
        data: tip,
      });
    } catch (error) {
      next(error);
    }
  };

  private getModerationStats = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const stats = await moderationService.getModerationStats();

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  };

  private getModeratorHistory = async (
    req: RequestWithUser,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const limit = parseInt(req.query.limit as string) || 50;

      const history = await moderationService.getModeratorHistory(req.user.id, limit);

      res.status(200).json({
        success: true,
        data: history,
      });
    } catch (error) {
      next(error);
    }
  };

  private promoteUser = async (
    req: RequestWithUser,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { userId, role } = req.body;

      const result = await moderationService.promoteUser(userId, req.user.id, role);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  private demoteModerator = async (
    req: RequestWithUser,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { userId, reason } = req.body;

      const result = await moderationService.demoteModerator(userId, req.user.id, reason);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public build(): Router {
    return this.router;
  }
}

export default new ModerationController().build();
