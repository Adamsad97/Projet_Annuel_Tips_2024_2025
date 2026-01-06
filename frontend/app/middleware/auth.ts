import { ROUTES } from '~/config/routes';

export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore();

  if (import.meta.dev) {
    console.log('[middleware/auth]', {
      path: to.fullPath,
      authenticated: authStore.isAuthenticated,
      user: authStore.currentUser?.email,
    });
  }

  if (!authStore.isAuthenticated) {
    return navigateTo({ path: ROUTES.LOGIN, query: { redirect: to.fullPath } });
  }
});
