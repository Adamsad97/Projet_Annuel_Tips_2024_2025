// Tips publiés à ajouter au sitemap, lus dans l'API comme un visiteur (seuls les tips publiés)
const PAGE_SIZE = 100;
const MAX_PAGES = 50;

interface PublishedTip {
  id: number;
  updatedAt: string;
}

export default defineEventHandler(async () => {
  const config = useRuntimeConfig();
  // Production : backend interne (relais SSR) ; développement : URL absolue de l'API
  const proxyTarget = process.env.NUXT_API_PROXY_TARGET;
  const apiBase = proxyTarget
    ? `${proxyTarget.replace(/\/$/, '')}/api`
    : (config.public.apiBaseUrl as string);

  const tips: PublishedTip[] = [];
  try {
    for (let page = 0; page < MAX_PAGES; page++) {
      const response = await $fetch<{ data: PublishedTip[] }>(`${apiBase}/tips`, {
        query: { take: PAGE_SIZE, skip: page * PAGE_SIZE },
      });
      tips.push(...response.data);
      if (response.data.length < PAGE_SIZE) break;
    }
  } catch {
    // API indisponible : le sitemap garde les pages statiques
  }

  return tips.map((tip) => ({ loc: `/tips/${tip.id}`, lastmod: new Date(tip.updatedAt) }));
});
