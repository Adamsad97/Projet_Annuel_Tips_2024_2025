export const useSiteMeta = () => {
  const siteTitle = 'AideFlash'
  const siteDescription = "La communauté d'entraide pour développeurs. Partagez vos tips, progressez et gagnez de l'XP !"
  const siteUrl = 'https://aideflash.fr'
  const siteImage = 'https://aideflash.fr/og-image-default.jpg'

  useHead({
    htmlAttrs: { lang: 'fr' },
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      { rel: 'canonical', href: siteUrl }
    ],
    titleTemplate: (titleChunk?: string) => titleChunk ? `${titleChunk} - ${siteTitle}` : siteTitle
  })

  useSeoMeta({
    description: siteDescription,
    ogTitle: siteTitle,
    ogDescription: siteDescription,
    ogImage: siteImage,
    ogUrl: siteUrl,
    twitterCard: 'summary_large_image',
    twitterTitle: siteTitle,
    twitterDescription: siteDescription,
    twitterImage: siteImage,
  })
}
