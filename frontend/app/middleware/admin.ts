import { ROUTES } from '~/config/routes';

// Réservé aux administrateurs (le backend vérifie aussi le rôle sur chaque route /admin)
export default defineNuxtRouteMiddleware((to) => {
  // La session est stockée dans le navigateur : le rendu serveur ne la connaît pas.
  // La vérification se fait côté client (l'API contrôle de toute façon chaque requête).
  if (import.meta.server) return;

  const authStore = useAuthStore();
  const user = authStore.currentUser;

  if (!authStore.isAuthenticated || !user) {
    return navigateTo({ path: ROUTES.LOGIN, query: { redirect: to.fullPath } });
  }

  if (!user.admin) {
    return navigateTo(ROUTES.HOME);
  }
});
