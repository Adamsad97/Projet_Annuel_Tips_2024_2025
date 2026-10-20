import { ROUTES } from '~/config/routes';

export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return;

  const authStore = useAuthStore();

  // Déjà connecté : retour à la page demandée (lien interne uniquement) ou à l'accueil
  if (authStore.isAuthenticated) {
    const redirect = to.query.redirect;
    const target =
      typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//')
        ? redirect
        : ROUTES.HOME;
    return navigateTo(target);
  }
});
