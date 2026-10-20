import { ROUTES } from '~/config/routes';

export default defineNuxtRouteMiddleware((to) => {
  // La session est stockée dans le navigateur : le rendu serveur ne la connaît pas.
  // La vérification se fait côté client (l'API contrôle de toute façon chaque requête).
  if (import.meta.server) return;

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
