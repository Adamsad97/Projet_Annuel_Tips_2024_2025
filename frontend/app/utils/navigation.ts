export interface NavigationLink {
  to: string;
  text: string;
  icon: string;
  requiresAuth?: boolean;
  requiresRole?: 'MODERATOR' | 'ADMIN';
}

export const mainLinks: NavigationLink[] = [
  { to: '/', text: 'Accueil', icon: 'tabler:home' },
  { to: '/map', text: 'Carte', icon: 'tabler:map-pin' },
  { to: '/tips', text: 'Tips', icon: 'tabler:bulb' },
  { to: '/ranking', text: 'Classement', icon: 'tabler:trophy' },
];

export const userLinks: NavigationLink[] = [
  { to: '/my-tips', text: 'Mes Tips', icon: 'tabler:notebook', requiresAuth: true },
];

export const moderatorLinks: NavigationLink[] = [
  { to: '/moderation', text: 'Modération', icon: 'tabler:shield-check', requiresAuth: true, requiresRole: 'MODERATOR' },
];

export const secondaryLinks: NavigationLink[] = [
  { to: '/about', text: 'À propos', icon: 'tabler:info-circle' },
  { to: '/contact', text: 'Contact', icon: 'tabler:mail' },
];

export default [...mainLinks, ...secondaryLinks];
