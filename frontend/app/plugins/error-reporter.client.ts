import { API_ROUTES } from '~/config/api';
import { storage } from '~/utils/storage';

// Remonte les erreurs JavaScript du navigateur dans les logs centralisés (onglet Logs de l'admin).
// Limité par session et dédoublonné pour ne pas inonder l'API en cas d'erreur en boucle.
const MAX_REPORTS_PER_SESSION = 10;

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig();
  const reported = new Set<string>();

  const report = (error: unknown, context: Record<string, unknown> = {}) => {
    const err = error instanceof Error ? error : new Error(String(error));
    const key = `${err.message}|${window.location.pathname}`;
    if (reported.has(key) || reported.size >= MAX_REPORTS_PER_SESSION) return;
    reported.add(key);

    const token = storage.getAccessToken();
    $fetch(API_ROUTES.PLATFORM.CLIENT_LOGS, {
      baseURL: config.public.apiBaseUrl,
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: {
        message: err.message.slice(0, 1000),
        stack: err.stack?.slice(0, 8000),
        path: window.location.pathname + window.location.search,
        context,
      },
    }).catch(() => {
      // le signalement ne doit jamais provoquer une nouvelle erreur
    });
  };

  // Erreurs des composants Vue (le handler existant de Nuxt est conservé)
  const previousHandler = nuxtApp.vueApp.config.errorHandler;
  nuxtApp.vueApp.config.errorHandler = (error, instance, info) => {
    report(error, { kind: 'vue', info });
    previousHandler?.(error, instance, info);
  };

  window.addEventListener('error', (event) =>
    report(event.error ?? event.message, { kind: 'window' }),
  );
  window.addEventListener('unhandledrejection', (event) =>
    report(event.reason, { kind: 'unhandledrejection' }),
  );
});
