import { ROUTES } from '~/config/routes';

export default defineNuxtRouteMiddleware(() => {
  const authStore = useAuthStore();

  if (authStore.isAuthenticated) {
    return navigateTo(ROUTES.HOME);
  }
});
