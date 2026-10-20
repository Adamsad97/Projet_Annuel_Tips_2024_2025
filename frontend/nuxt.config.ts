import tailwindcss from '@tailwindcss/vite';
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  devtools: { enabled: true },

  modules: [
    '@nuxt/eslint',
    '@nuxt/image',
    '@nuxt/icon',
    '@nuxt/ui',
    '@nuxtjs/color-mode',
    '@nuxtjs/robots',
    '@nuxtjs/sitemap',
    '@pinia/nuxt',
  ],

  css: ['./app/assets/css/main.css'],

  vite: {
    plugins: [tailwindcss()],
  },

  imports: {
    dirs: ['config', 'types', 'stores', 'composables', 'utils'],
  },

  runtimeConfig: {
    public: {
      // Dev : URL absolue du backend ; production : /api (même domaine, routé par nginx)
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL,
      // Serveur Socket.io ; vide = même domaine que la page (production derrière nginx)
      backendUrl: process.env.NUXT_PUBLIC_BACKEND_URL || '',
      // Interface d'administration de la base (Adminer), à ne renseigner qu'en développement
      adminerUrl: process.env.NUXT_PUBLIC_ADMINER_URL || '',
      // Adresse publique du site (liens canoniques, sitemap, robots.txt)
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    },
  },

  // Pages réservées aux membres : la session est stockée dans le navigateur, le serveur ne la
  // connaît pas. Elles sont donc rendues côté client uniquement (pas d'écart d'hydratation).
  routeRules: {
    '/profile': { ssr: false },
    '/settings': { ssr: false },
    '/ranking': { ssr: false },
    '/messages': { ssr: false },
    '/my-tips': { ssr: false },
    '/my-moderation': { ssr: false },
    '/moderation': { ssr: false },
    '/admin': { ssr: false },
    '/tips/create': { ssr: false },
    '/tips/edit/**': { ssr: false },
    '/users/**': { ssr: false },
  },

  site: {
    name: 'AideFlash',
    url: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    description:
      'AideFlash : La plateforme communautaire pour partager et découvrir des astuces et conseils pratiques sur divers sujets.',
  },

  colorMode: {
    classSuffix: '',
    preference: 'system',
    fallback: 'light',
  },

  typescript: {
    shim: false,
    tsConfig: {
      compilerOptions: {
        types: ['node'],
      },
    },
  },

  sitemap: {
    strictNuxtContentPaths: true,
    urls: ['/', '/about', '/contact', '/map'],
    sources: ['/api/sitemap-urls'],
    // Pages réservées aux membres ou formulaires : sans intérêt pour les moteurs de recherche
    exclude: [
      '/ranking',
      '/register',
      '/auth/**',
      '/profile',
      '/settings',
      '/messages',
      '/my-tips',
      '/my-moderation',
      '/moderation',
      '/admin',
      '/tips/create',
      '/tips/edit/**',
      '/users/**',
    ],
  },

  // Indexation bloquée hors production ; le sitemap est ajouté automatiquement depuis site.url
  robots: {
    groups: [
      {
        userAgent: ['*'],
        allow: ['/'],
        disallow: [
          '/admin',
          '/moderation',
          '/profile',
          '/settings',
          '/messages',
          '/my-tips',
          '/my-moderation',
          '/api',
        ],
      },
      {
        userAgent: ['GPTBot'],
        disallow: ['/'],
      },
    ],
  },
});
