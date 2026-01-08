import { ROUTES } from '~/config/routes';

export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore();
  const user = authStore.currentUser;

  if (import.meta.dev) {
    console.log('[middleware/moderator]', {
      path: to.fullPath,
      authenticated: authStore.isAuthenticated,
      user: user?.email,
      isModerator: user?.moderator?.isActive,
      isAdmin: !!user?.admin,
    });
  }

  if (!authStore.isAuthenticated || !user) {
    return navigateTo({ path: ROUTES.LOGIN, query: { redirect: to.fullPath } });
  }

  const isModerator = user.moderator?.isActive || !!user.admin;

  if (!isModerator) {
    console.warn('[middleware/moderator] Access denied - user is not a moderator');
    return navigateTo({ path: ROUTES.HOME });
  }
});
