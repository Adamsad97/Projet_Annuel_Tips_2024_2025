import express from 'express';
import userRoutes from '../modules/user/user.routes';
import authRoutes from '../modules/auth/auth.routes';
import tipRoutes from '../modules/tips/tip.routes';
import twoFactorRoutes from '../modules/two-factor/twoFactor.routes';
import uploadRoutes from '../modules/uploads/upload.routes';
import commentRoutes from '../modules/comments/comment.routes';
import voteRoutes from '../modules/votes/vote.routes';
import reportRoutes from '../modules/reports/report.routes';
import messagingRoutes from '../modules/messaging/messaging.routes';
import notificationRoutes from '../modules/notifications/notification.routes';
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
apiRouter.use(ROUTES.users.base, twoFactorRoutes);
apiRouter.use(ROUTES.auth.base, authRoutes);
apiRouter.use(ROUTES.tips.base, tipRoutes);
apiRouter.use(ROUTES.uploads.base, uploadRoutes);
apiRouter.use(commentRoutes);
apiRouter.use(voteRoutes);
apiRouter.use(reportRoutes);
apiRouter.use(messagingRoutes);
apiRouter.use(notificationRoutes);

apiRouter.use(ROUTES.moderation.base, requireAuth, requireModerator, moderationRoutes);

export default apiRouter;
