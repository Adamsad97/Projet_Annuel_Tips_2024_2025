import { ROUTES } from '~/config/routes';

// Réservé aux administrateurs (le backend vérifie aussi le rôle sur chaque route /admin)
export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore();
  const user = authStore.currentUser;

  if (!authStore.isAuthenticated || !user) {
    return navigateTo({ path: ROUTES.LOGIN, query: { redirect: to.fullPath } });
  }

  if (!user.admin) {
    return navigateTo(ROUTES.HOME);
  }
});
