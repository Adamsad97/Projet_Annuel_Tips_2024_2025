import express from 'express';
import userRoutes from '../modules/user/user.routes';
import authRoutes from '../modules/auth/auth.routes';
import tipRoutes from '../modules/tips/tip.routes';
import { ROUTES } from '../config/routes';

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

export default apiRouter;
