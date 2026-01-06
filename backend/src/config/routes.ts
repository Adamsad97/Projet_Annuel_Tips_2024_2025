/**
 * routes.ts — Centralise les chemins d’API
 */

export const ROUTES = {
  api: '/api',
  ping: '/ping',
  users: {
    base: '/users',
    register: '/register',
    login: '/login',
    profile: '/profile',
  },
  auth: {
    base: '/auth',
    refresh: '/refresh',
    logout: '/logout',
  },
  tips: {
    base: '/tips',
    list: '/',
    create: '/',
    detail: '/:id',
    update: '/:id',
    delete: '/:id',
  },
};
