import { ROUTES } from '~/config/routes';

export default defineNuxtRouteMiddleware((to) => {
  // La session est stockée dans le navigateur : le rendu serveur ne la connaît pas.
  // La vérification se fait côté client (l'API contrôle de toute façon chaque requête).
  if (import.meta.server) return;

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
