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
import appealRoutes from '../modules/appeals/appeal.routes';
import adminRoutes from '../modules/admin/admin.routes';
import categoryRoutes from '../modules/categories/category.routes';
import chatbotRoutes from '../modules/chatbot/chatbot.routes';
import platformRoutes from '../modules/platform/platform.routes';
import sponsoringRoutes from '../modules/sponsoring/sponsoring.routes';
import moderationRoutes from '../modules/moderation/moderation.routes';
import { ROUTES } from '../config/routes';
import { requireAuth, requireModerator, requireAdmin } from '../middlewares/auth.middleware';

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
apiRouter.use(appealRoutes);
apiRouter.use(categoryRoutes);
apiRouter.use(chatbotRoutes);
apiRouter.use(platformRoutes);
apiRouter.use(sponsoringRoutes);

apiRouter.use(ROUTES.moderation.base, requireAuth, requireModerator, moderationRoutes);
apiRouter.use(ROUTES.admin.base, requireAuth, requireAdmin, adminRoutes);

export default apiRouter;
