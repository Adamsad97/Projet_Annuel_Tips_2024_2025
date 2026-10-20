import type { Request, Response, NextFunction, Router } from 'express';
import express from 'express';
import { adminService } from './admin.service';
import { appealService } from '../appeals/appeal.service';
import { trustService } from '../trust/trust.service';
import { chatbotService } from '../chatbot/chatbot.service';
import { logService } from '../logs/log.service';
import { featureService } from '../features/feature.service';
import { adService } from '../sponsoring/ad.service';
import { challengeService } from '../sponsoring/challenge.service';
import {
  adCampaignSchema,
  updateAdCampaignSchema,
  challengeSchema,
  updateChallengeSchema,
} from '../sponsoring/sponsoring.validation';
import { imageUpload, toUploadPath } from '../../utils/imageUpload.util';
import {
  chatbotConfigSchema,
  chatbotResponseSchema,
  updateChatbotResponseSchema,
} from '../chatbot/chatbot.validation';
import {
  sanctionSchema,
  trustIndexSchema,
  gradeSchema,
  updateGradeSchema,
  badgeUpdateSchema,
  resolveAppealSchema,
  listUsersQuerySchema,
  listLogsQuerySchema,
  purgeLogsQuerySchema,
  featureUpdateSchema,
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

    // Chatbot : réglages, réponses types et questions posées
    router.get(
      '/chatbot/config',
      handle(async (_req, res) => {
        ok(res, await chatbotService.getConfig());
      }),
    );
    router.patch(
      '/chatbot/config',
      validateSchema(chatbotConfigSchema),
      handle(async (req, res) => {
        ok(res, await chatbotService.updateConfig(req.body));
      }),
    );
    router.get(
      '/chatbot/responses',
      handle(async (_req, res) => {
        ok(res, await chatbotService.listResponses());
      }),
    );
    router.post(
      '/chatbot/responses',
      validateSchema(chatbotResponseSchema),
      handle(async (req, res) => {
        ok(res, await chatbotService.createResponse(req.body), 201);
      }),
    );
    router.patch(
      '/chatbot/responses/:id',
      validateSchema(updateChatbotResponseSchema),
      handle(async (req, res) => {
        const id = parseIdParam(req.params.id, 'response id');
        ok(res, await chatbotService.updateResponse(id, req.body));
      }),
    );
    router.delete(
      '/chatbot/responses/:id',
      handle(async (req, res) => {
        await chatbotService.deleteResponse(parseIdParam(req.params.id, 'response id'));
        ok(res, { deleted: true });
      }),
    );
    router.get(
      '/chatbot/queries',
      handle(async (req, res) => {
        ok(res, await chatbotService.listQueries(req.query.unanswered === 'true'));
      }),
    );

    // Logs d'erreurs centralisés
    router.get(
      '/logs',
      handle(async (req, res) => {
        ok(res, await logService.list(listLogsQuerySchema.parse(req.query)));
      }),
    );
    router.delete(
      '/logs',
      handle(async (req, res) => {
        const { olderThanDays } = purgeLogsQuerySchema.parse(req.query);
        ok(res, { deleted: await logService.purge(olderThanDays) });
      }),
    );

    // Fonctionnalités expérimentales (tests A/B)
    router.get(
      '/features',
      handle(async (_req, res) => {
        ok(res, await featureService.listForAdmin());
      }),
    );
    router.patch(
      '/features/:key',
      validateSchema(featureUpdateSchema),
      handle(async (req, res) => {
        ok(res, await featureService.update(String(req.params.key), req.body));
      }),
    );

    // Publicité : tips sponsorisés
    router.get(
      '/ads',
      handle(async (_req, res) => {
        ok(res, await adService.list());
      }),
    );
    router.post(
      '/ads/image',
      imageUpload('ads', 'image', 1),
      handle(async (req, res) => {
        const [file] = req.files as Express.Multer.File[];
        ok(res, { imageUrl: toUploadPath('ads', file!.filename) }, 201);
      }),
    );
    router.post(
      '/ads',
      validateSchema(adCampaignSchema),
      handle(async (req, res) => {
        ok(res, await adService.create(req.body), 201);
      }),
    );
    router.patch(
      '/ads/:id',
      validateSchema(updateAdCampaignSchema),
      handle(async (req, res) => {
        ok(res, await adService.update(parseIdParam(req.params.id, 'campaign id'), req.body));
      }),
    );
    router.delete(
      '/ads/:id',
      handle(async (req, res) => {
        await adService.remove(parseIdParam(req.params.id, 'campaign id'));
        ok(res, { deleted: true });
      }),
    );
    router.get(
      '/ads/:id/stats',
      handle(async (req, res) => {
        ok(res, await adService.getStats(parseIdParam(req.params.id, 'campaign id')));
      }),
    );
    router.get(
      '/ads/:id/stats.csv',
      handle(async (req, res) => {
        const { filename, content } = await adService.getStatsCsv(
          parseIdParam(req.params.id, 'campaign id'),
        );
        res
          .status(200)
          .type('text/csv; charset=utf-8')
          .attachment(filename)
          // BOM : accents corrects à l'ouverture dans Excel
          .send(`\uFEFF${content}`);
      }),
    );

    // Défis sponsorisés
    router.get(
      '/challenges',
      handle(async (_req, res) => {
        ok(res, await challengeService.list());
      }),
    );
    router.post(
      '/challenges',
      validateSchema(challengeSchema),
      handle(async (req, res) => {
        ok(res, await challengeService.create(req.body), 201);
      }),
    );
    router.patch(
      '/challenges/:id',
      validateSchema(updateChallengeSchema),
      handle(async (req, res) => {
        ok(
          res,
          await challengeService.update(parseIdParam(req.params.id, 'challenge id'), req.body),
        );
      }),
    );
    router.delete(
      '/challenges/:id',
      handle(async (req, res) => {
        await challengeService.remove(parseIdParam(req.params.id, 'challenge id'));
        ok(res, { deleted: true });
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
