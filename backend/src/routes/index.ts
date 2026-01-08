import express from 'express';
import userRoutes from '../modules/user/user.routes';
import authRoutes from '../modules/auth/auth.routes';
import tipRoutes from '../modules/tips/tip.routes';
import moderationRoutes from '../modules/moderation/moderation.routes';
import { ROUTES } from '../config/routes';
import { requireAuth, requireModerator } from '../middlewares/auth.middleware';

const apiRouter = express.Router();

apiRouter.get(ROUTES.ping, (_req, res) => {
  res.status(200).json({
    message: 'pong',
    timestamp: new Date().toISOString(),
    status: 'healthy',
  });
});

apiRouter.use(ROUTES.users.base, userRoutes);
apiRouter.use(ROUTES.auth.base, authRoutes);
apiRouter.use(ROUTES.tips.base, tipRoutes);

apiRouter.use(ROUTES.moderation.base, requireAuth, requireModerator, moderationRoutes);

export default apiRouter;
