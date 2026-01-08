import { requireAuth, requireModerator, requireAdmin } from '../../middlewares/auth.middleware';
import moderationControllerRoutes from './moderation.controller';

export default moderationControllerRoutes;

export { requireAuth, requireModerator, requireAdmin };
