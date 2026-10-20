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

  if (!user.moderator?.isActive && !user.admin) {
    return navigateTo(ROUTES.HOME);
  }
});
