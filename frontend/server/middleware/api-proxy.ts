import { proxyRequest } from 'h3';

// En production, le navigateur appelle l'API en relatif (/api, routé par nginx vers le backend).
// Le rendu serveur (SSR) fait les mêmes appels relatifs : ce middleware les relaie vers le backend
// interne. Inactif si NUXT_API_PROXY_TARGET n'est pas défini (développement : URL absolue).
const LOCAL_API_PREFIXES = ['/api/_', '/api/sitemap-urls'];

export default defineEventHandler((event) => {
  const target = process.env.NUXT_API_PROXY_TARGET;
  const path = event.path;

  if (!target || !path.startsWith('/api/')) return;
  // Routes servies par Nuxt lui-même (icônes, sitemap)
  if (LOCAL_API_PREFIXES.some((prefix) => path.startsWith(prefix))) return;

  return proxyRequest(event, `${target.replace(/\/$/, '')}${path}`);
});
