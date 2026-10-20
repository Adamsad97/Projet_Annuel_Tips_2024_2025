import type { Response, NextFunction, Router } from 'express';
import express from 'express';
import { adService } from './ad.service';
import { challengeService } from './challenge.service';
import { placementQuerySchema } from './sponsoring.validation';
import { featureService } from '../features/feature.service';
import { optionalAuth } from '../../middlewares/auth.middleware';
import { parseIdParam } from '../../utils/params.util';
import { ROUTES } from '../../config/routes';
import type { RequestWithUser } from '../../types/auth.types';

// Routes publiques : emplacement publicitaire, redirection des clics, défis en cours
export class SponsoringController {
  getPlacement = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      // Publicité coupée (flag "ads") : pas d'erreur, simplement rien à afficher
      if (!(await featureService.isEnabled('ads', req.user?.id))) {
        res.status(200).json({ success: true, data: null });
        return;
      }
      const { categoryId, exclude } = placementQuerySchema.parse(req.query);
      const ad = await adService.getPlacement({
        userId: req.user?.id,
        categoryId,
        excludeIds: exclude,
      });
      res.status(200).json({ success: true, data: ad });
    } catch (e) {
      next(e);
    }
  };

  // Lien des cartes sponsorisées : compte le clic puis redirige vers le partenaire
  click = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const targetUrl = await adService.registerClick(parseIdParam(req.params.id, 'campaign id'));
      res.redirect(302, targetUrl);
    } catch (e) {
      next(e);
    }
  };

  listChallenges = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const data = await challengeService.listActive(req.user?.id);
      res.status(200).json({ success: true, data });
    } catch (e) {
      next(e);
    }
  };

  build(): Router {
    const router = express.Router();
    router.get(ROUTES.sponsoring.placement, optionalAuth, this.getPlacement);
    router.get(ROUTES.sponsoring.click, this.click);
    router.get(ROUTES.sponsoring.challenges, optionalAuth, this.listChallenges);
    return router;
  }
}
