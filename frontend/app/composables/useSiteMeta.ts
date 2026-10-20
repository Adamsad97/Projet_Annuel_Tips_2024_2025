export const useSiteMeta = () => {
  const config = useRuntimeConfig();
  const route = useRoute();

  const siteTitle = 'AideFlash';
  const siteDescription =
    "La plateforme d'entraide pour partager et trouver des astuces du quotidien : bricolage, cuisine, informatique… Progressez et gagnez de l'XP !";
  const siteUrl = (config.public.siteUrl as string).replace(/\/$/, '');
  // Adresse canonique de la page courante (sans paramètres)
  const pageUrl = computed(() => `${siteUrl}${route.path}`);

  useHead({
    htmlAttrs: { lang: 'fr' },
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      { rel: 'canonical', href: pageUrl },
    ],
    titleTemplate: (titleChunk?: string) =>
      titleChunk ? `${titleChunk} - ${siteTitle}` : siteTitle,
  });

  useSeoMeta({
    description: siteDescription,
    ogTitle: siteTitle,
    ogDescription: siteDescription,
    ogUrl: pageUrl,
    ogSiteName: siteTitle,
    twitterCard: 'summary',
    twitterTitle: siteTitle,
    twitterDescription: siteDescription,
  });
};
