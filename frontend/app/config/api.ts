export const API_ROUTES = {
  PING: '/ping',

  AUTH: {
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
  },

  USERS: {
    REGISTER: '/users/register',
    LOGIN: '/users/login',
    LOGIN_2FA: '/users/login/2fa',
    PROFILE: '/users/profile',
    PASSWORD: '/users/profile/password',
    AVATAR: '/users/profile/avatar',
    PUBLIC_PROFILE: (id: number) => `/users/${id}`,
  },

  TWO_FACTOR: {
    SETUP: '/users/profile/2fa/setup',
    ENABLE: '/users/profile/2fa/enable',
    DISABLE: '/users/profile/2fa/disable',
  },

  TIPS: {
    LIST: '/tips',
    DETAIL: (id: number) => `/tips/${id}`,
    CREATE: '/tips',
    UPDATE: (id: number) => `/tips/${id}`,
    DELETE: (id: number) => `/tips/${id}`,
    CATEGORIES: '/tips/tags/all',
  },

  COMMENTS: {
    BY_TIP: (tipId: number) => `/tips/${tipId}/comments`,
    DETAIL: (id: number) => `/comments/${id}`,
  },

  VOTES: {
    TIP: (tipId: number) => `/tips/${tipId}/votes`,
    COMMENT: (id: number) => `/comments/${id}/votes`,
  },

  REPORTS: {
    TIP: (tipId: number) => `/tips/${tipId}/reports`,
    COMMENT: (id: number) => `/comments/${id}/reports`,
  },

  MESSAGING: {
    CONVERSATIONS: '/conversations',
    CONVERSATION: (id: number) => `/conversations/${id}`,
    CONVERSATION_WITH: (userId: number) => `/conversations/with/${userId}`,
    MESSAGES: '/messages',
    MESSAGE: (id: number) => `/messages/${id}`,
    BLOCKS: '/blocks',
    BLOCK: (userId: number) => `/users/${userId}/block`,
  },

  NOTIFICATIONS: {
    LIST: '/notifications',
    READ_ALL: '/notifications/read-all',
    READ: (id: number) => `/notifications/${id}/read`,
  },

  MODERATION: {
    WARN: (userId: number) => `/moderation/users/${userId}/warn`,
    DOWNGRADE: (userId: number) => `/moderation/users/${userId}/downgrade`,
    USER_ACTIONS: (userId: number) => `/moderation/users/${userId}/actions`,
    PROMOTE: '/moderation/users/promote',
    DEMOTE: '/moderation/users/demote',
  },

  APPEALS: {
    MINE: '/moderation-actions/mine',
    CREATE: (actionId: number) => `/moderation-actions/${actionId}/appeal`,
  },

  ADMIN: {
    ANALYTICS: '/admin/analytics',
    USERS: '/admin/users',
    BAN: (userId: number) => `/admin/users/${userId}/ban`,
    MUTE: (userId: number) => `/admin/users/${userId}/mute`,
    TRUST_INDEX: (userId: number) => `/admin/users/${userId}/trust-index`,
    RESET: (userId: number) => `/admin/users/${userId}/reset`,
    USER: (userId: number) => `/admin/users/${userId}`,
    USER_TRUST: (userId: number) => `/admin/users/${userId}/trust`,
    TRUST_RANKING: '/admin/trust/ranking',
    TRUST_WATCHLIST: '/admin/trust/watchlist',
    TRUST_RECOMPUTE: '/admin/trust/recompute',
    APPEALS: '/admin/appeals',
    RESOLVE_APPEAL: (appealId: number) => `/admin/appeals/${appealId}/resolve`,
    GRADES: '/admin/grades',
    GRADE: (gradeId: number) => `/admin/grades/${gradeId}`,
    BADGES: '/admin/badges',
    BADGE: (badgeId: number) => `/admin/badges/${badgeId}`,
  },

  UPLOADS: {
    TIP_IMAGES: '/uploads/tips',
  },
} as const;
