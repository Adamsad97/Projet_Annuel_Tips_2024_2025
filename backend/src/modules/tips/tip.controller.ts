import { Router, type Request, type Response, type NextFunction } from 'express';
import { tipService } from './tip.service';
import { createTipSchema, updateTipSchema, getTipsQuerySchema } from './tip.validation';
import { validateSchema } from '../../middlewares/validate.middleware';
import { requireAuth } from '../../middlewares/auth.middleware';
import type { RequestWithUser } from '../../types/auth.types';

class TipController {
  private router: Router;

  constructor() {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get('/', this.getAllTips);
    this.router.get('/:id', this.getTipById);
    this.router.post('/', requireAuth, validateSchema(createTipSchema), this.createTip);
    this.router.patch('/:id', requireAuth, validateSchema(updateTipSchema), this.updateTip);
    this.router.delete('/:id', requireAuth, this.deleteTip);
  }

  private getAllTips = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = getTipsQuerySchema.parse(req.query);
      const query = {
        q: parsed.q ?? undefined,
        skip: parsed.skip ?? undefined,
        take: parsed.take ?? undefined,
      };
      const tips = await tipService.getAllTips(query);

      res.status(200).json(tips);
    } catch (error) {
      next(error);
    }
  };

  private getTipById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const idParam = req.params.id;
      if (!idParam) {
        res.status(400).json({ message: 'Tip ID required' });
        return;
      }

      const id = parseInt(idParam, 10);
      if (isNaN(id)) {
        res.status(400).json({ message: 'Invalid tip ID' });
        return;
      }

      const tip = await tipService.getTipById(id);
      res.status(200).json(tip);
    } catch (error) {
      next(error);
    }
  };

  private createTip = async (
    req: RequestWithUser,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const tip = await tipService.createTip({
        ...req.body,
        userId: req.user.id,
      });

      res.status(201).json(tip);
    } catch (error) {
      next(error);
    }
  };

  private updateTip = async (
    req: RequestWithUser,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const idParam = req.params.id;
      if (!idParam) {
        res.status(400).json({ message: 'Tip ID required' });
        return;
      }

      const id = parseInt(idParam, 10);
      if (isNaN(id)) {
        res.status(400).json({ message: 'Invalid tip ID' });
        return;
      }

      const tip = await tipService.updateTip(id, req.user.id, req.body);
      res.status(200).json(tip);
    } catch (error) {
      next(error);
    }
  };

  private deleteTip = async (
    req: RequestWithUser,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const idParam = req.params.id;
      if (!idParam) {
        res.status(400).json({ message: 'Tip ID required' });
        return;
      }

      const id = parseInt(idParam, 10);
      if (isNaN(id)) {
        res.status(400).json({ message: 'Invalid tip ID' });
        return;
      }

      await tipService.deleteTip(id, req.user.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  public build(): Router {
    return this.router;
  }
}

export default new TipController().build();
