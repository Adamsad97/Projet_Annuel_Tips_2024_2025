export const ROUTES = {
  HOME: '/',
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  TIPS: '/tips',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  RANKING: '/ranking',
  MAP: '/map',

  TIP_DETAIL: (id: number | string) => `/tips/${id}`,
  TIP_EDIT: (id: number | string) => `/tips/${id}/edit`,
  TIP_CREATE: '/tips/create',
  USER_PROFILE: (id: number | string) => `/users/${id}`,
} as const;

export const EXTERNAL_ROUTES = {
  GITHUB: 'https://github.com/Froggys974/projet-annuel-4IWJ-tips',
  DOCS: 'https://nuxt.com',
} as const;
