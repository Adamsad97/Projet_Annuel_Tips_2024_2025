export interface NavigationLink {
  to: string;
  text: string;
  icon: string;
  requiresAuth?: boolean;
  requiresRole?: 'MODERATOR' | 'ADMIN';
  // Lien masqué quand cette fonctionnalité expérimentale est désactivée
  feature?: string;
}

export const mainLinks: NavigationLink[] = [
  { to: '/', text: 'Accueil', icon: 'tabler:home' },
  { to: '/map', text: 'Carte', icon: 'tabler:map-pin' },
  { to: '/tips', text: 'Tips', icon: 'tabler:bulb' },
  { to: '/trends', text: 'Tendances', icon: 'tabler:flame', feature: 'trends_page' },
  { to: '/ranking', text: 'Classement', icon: 'tabler:trophy' },
];

export const userLinks: NavigationLink[] = [
  { to: '/my-tips', text: 'Mes Tips', icon: 'tabler:notebook', requiresAuth: true },
  { to: '/messages', text: 'Messages', icon: 'tabler:messages', requiresAuth: true },
  { to: '/my-moderation', text: 'Mes sanctions', icon: 'tabler:gavel', requiresAuth: true },
];

export const moderatorLinks: NavigationLink[] = [
  {
    to: '/moderation',
    text: 'Modération',
    icon: 'tabler:shield-check',
    requiresAuth: true,
    requiresRole: 'MODERATOR',
  },
  {
    to: '/admin',
    text: 'Administration',
    icon: 'tabler:settings-cog',
    requiresAuth: true,
    requiresRole: 'ADMIN',
  },
];

export const secondaryLinks: NavigationLink[] = [
  { to: '/about', text: 'À propos', icon: 'tabler:info-circle' },
  { to: '/contact', text: 'Contact', icon: 'tabler:mail' },
];

export default [...mainLinks, ...secondaryLinks];
