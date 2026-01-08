import { ROUTES } from '~/config/routes';

export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore();
  const user = authStore.currentUser;

  if (import.meta.dev) {
    console.log('[middleware/moderator]', {
      path: to.fullPath,
      authenticated: authStore.isAuthenticated,
      user: user?.email,
    });
  }

  if (!authStore.isAuthenticated || !user) {
    return navigateTo({ path: ROUTES.LOGIN, query: { redirect: to.fullPath } });
  }

  // TODO: Add moderator check once User type includes moderator info
  console.warn('[middleware/moderator] Moderator check not yet implemented');
});
