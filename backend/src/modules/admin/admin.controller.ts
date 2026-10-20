import type { Request, Response, NextFunction, Router } from 'express';
import express from 'express';
import { adminService } from './admin.service';
import { appealService } from '../appeals/appeal.service';
import { trustService } from '../trust/trust.service';
import {
  sanctionSchema,
  trustIndexSchema,
  gradeSchema,
  updateGradeSchema,
  badgeUpdateSchema,
  resolveAppealSchema,
  listUsersQuerySchema,
} from './admin.validation';
import { validateSchema } from '../../middlewares/validate.middleware';
import { parseIdParam } from '../../utils/params.util';
import type { RequestWithUser } from '../../types/auth.types';

type Handler = (req: RequestWithUser, res: Response) => Promise<void>;

// Factorise le try/catch : chaque route n'écrit que son appel au service
const handle =
  (handler: Handler) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await handler(req as RequestWithUser, res);
    } catch (e) {
      next(e);
    }
  };

const ok = (res: Response, data: unknown, status = 200) =>
  res.status(status).json({ success: true, data });

const userId = (req: RequestWithUser) => parseIdParam(req.params.id, 'user id');

export class AdminController {
  build(): Router {
    const router = express.Router();

    router.get(
      '/analytics',
      handle(async (_req, res) => {
        ok(res, await adminService.getAnalytics());
      }),
    );

    // Utilisateurs
    router.get(
      '/users',
      handle(async (req, res) => {
        ok(res, await adminService.listUsers(listUsersQuerySchema.parse(req.query)));
      }),
    );
    router.post(
      '/users/:id/ban',
      validateSchema(sanctionSchema),
      handle(async (req, res) => {
        ok(res, await adminService.banUser(userId(req), req.user!.id, req.body), 201);
      }),
    );
    router.delete(
      '/users/:id/ban',
      handle(async (req, res) => {
        ok(res, await adminService.unbanUser(userId(req), req.user!.id));
      }),
    );
    router.post(
      '/users/:id/mute',
      validateSchema(sanctionSchema),
      handle(async (req, res) => {
        ok(res, await adminService.muteUser(userId(req), req.user!.id, req.body), 201);
      }),
    );
    router.delete(
      '/users/:id/mute',
      handle(async (req, res) => {
        ok(res, await adminService.unmuteUser(userId(req), req.user!.id));
      }),
    );
    router.patch(
      '/users/:id/trust-index',
      validateSchema(trustIndexSchema),
      handle(async (req, res) => {
        ok(res, await adminService.setTrustIndex(userId(req), req.user!.id, req.body));
      }),
    );
    router.post(
      '/users/:id/reset',
      handle(async (req, res) => {
        ok(res, await adminService.resetUser(userId(req), req.user!.id));
      }),
    );
    router.delete(
      '/users/:id',
      handle(async (req, res) => {
        await adminService.deleteUser(userId(req), req.user!.id);
        ok(res, { deleted: true });
      }),
    );

    // Indice de confiance
    router.get(
      '/users/:id/trust',
      handle(async (req, res) => {
        ok(res, await trustService.computeBreakdown(userId(req)));
      }),
    );
    router.get(
      '/trust/ranking',
      handle(async (_req, res) => {
        ok(res, await trustService.getRanking());
      }),
    );
    router.get(
      '/trust/watchlist',
      handle(async (_req, res) => {
        ok(res, await trustService.getModeratorWatchlist());
      }),
    );
    router.post(
      '/trust/recompute',
      handle(async (_req, res) => {
        ok(res, await trustService.runCycle());
      }),
    );

    // Contestations
    router.get(
      '/appeals',
      handle(async (req, res) => {
        const status = req.query.status === 'all' ? undefined : 'OPEN';
        ok(res, await appealService.listAppeals(status));
      }),
    );
    router.post(
      '/appeals/:id/resolve',
      validateSchema(resolveAppealSchema),
      handle(async (req, res) => {
        const appealId = parseIdParam(req.params.id, 'appeal id');
        const { decision, response } = req.body;
        ok(res, await appealService.resolveAppeal(appealId, req.user!.id, decision, response));
      }),
    );

    // Grades
    router.get(
      '/grades',
      handle(async (_req, res) => {
        ok(res, await adminService.listGrades());
      }),
    );
    router.post(
      '/grades',
      validateSchema(gradeSchema),
      handle(async (req, res) => {
        ok(res, await adminService.createGrade(req.body), 201);
      }),
    );
    router.patch(
      '/grades/:id',
      validateSchema(updateGradeSchema),
      handle(async (req, res) => {
        ok(res, await adminService.updateGrade(parseIdParam(req.params.id, 'grade id'), req.body));
      }),
    );
    router.delete(
      '/grades/:id',
      handle(async (req, res) => {
        await adminService.deleteGrade(parseIdParam(req.params.id, 'grade id'));
        ok(res, { deleted: true });
      }),
    );

    // Badges
    router.get(
      '/badges',
      handle(async (_req, res) => {
        ok(res, await adminService.listBadges());
      }),
    );
    router.patch(
      '/badges/:id',
      validateSchema(badgeUpdateSchema),
      handle(async (req, res) => {
        ok(res, await adminService.updateBadge(parseIdParam(req.params.id, 'badge id'), req.body));
      }),
    );

    return router;
  }
}
