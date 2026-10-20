export type UserRole = 'USER' | 'MODERATOR' | 'ADMIN';
export type AppealStatus = 'OPEN' | 'ACCEPTED' | 'REJECTED';

export interface Appeal {
  id: number;
  reason: string;
  status: AppealStatus;
  response: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

// Sanction reçue, vue par l'utilisateur concerné (GET /moderation-actions/mine)
export interface MyModerationAction {
  id: number;
  actionType: string;
  reason: string | null;
  createdAt: string;
  overturnedAt: string | null;
  appeal: Appeal | null;
  canAppeal: boolean;
}

export interface AdminAppeal extends Appeal {
  user: { id: number; username: string; firstname: string | null; lastname: string | null };
  resolvedBy: { id: number; username: string } | null;
  action: {
    id: number;
    actionType: string;
    reason: string | null;
    createdAt: string;
    // null = action automatique du système
    moderator: { id: number; username: string } | null;
  };
}

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  firstname: string | null;
  lastname: string | null;
  avatarProfile: string | null;
  xp: number;
  trustIndex: number;
  grade: { id: number; name: string } | null;
  createdAt: string;
  lastLoginAt: string | null;
  bannedUntil: string | null;
  banReason: string | null;
  mutedUntil: string | null;
  role: UserRole;
  isBanned: boolean;
  isMuted: boolean;
  _count: { tips: number; comments: number };
}

export interface AdminAnalytics {
  users: { total: number; newLast30Days: number; activeLast30Days: number };
  tips: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
    perDay: Array<{ date: string; count: number }>;
  };
  popularCategories: Array<{ id: number; name: string; tips: number }>;
  moderation: {
    openReports: number;
    openAppeals: number;
    pendingTips: number;
    bannedUsers: number;
  };
  topContributors: Array<{ id: number; username: string; xp: number; tips: number }>;
}

export interface AdminGrade {
  id: number;
  name: string;
  xpRequired: number;
  _count: { users: number };
}

export interface AdminBadge {
  id: number;
  code: string;
  name: string;
  description: string | null;
  icon: string;
  xpReward: number;
  _count: { userBadges: number };
}

// Libellés des types d'actions de modération
export const ACTION_LABELS: Record<string, string> = {
  WARN: 'Avertissement',
  DOWNGRADE: 'Rétrogradation',
  BAN: 'Bannissement',
  MUTE: 'Interdiction de publier',
  REJECT_TIP: 'Tip refusé',
  RESOLVE_REPORT_REJECT: 'Contenu retiré après signalement',
  AUTO_PROMOTE: 'Promotion automatique en modérateur',
  AUTO_DEMOTE: 'Retrait automatique du rôle de modérateur',
  APPROVE_TIP: 'Tip validé',
  UNBAN: 'Bannissement levé',
  UNMUTE: 'Interdiction de publier levée',
  RESET: 'Compte réinitialisé',
  PROMOTE_TO_MODERATOR: 'Nommé modérateur',
  DEMOTE_MODERATOR: 'Retiré de la modération',
};

// Indice de confiance (visible uniquement par les admins)
export interface TrustFactor {
  key: string;
  label: string;
  value: number;
  points: number;
}

export interface TrustBreakdown {
  userId: number;
  computed: number;
  adjustment: number;
  trustIndex: number;
  factors: TrustFactor[];
}

export interface TrustRankingEntry {
  id: number;
  username: string;
  trustIndex: number;
  xp: number;
}

export interface ModeratorWatchEntry {
  id: number;
  username: string;
  trustIndex: number;
  recentActions: number;
  reasons: string[];
}

export interface TrustCycleSummary {
  usersUpdated: number;
  promoted: number[];
  demoted: number[];
  watchlist: number[];
}

export interface ErrorLogEntry {
  id: number;
  source: 'server' | 'client';
  message: string;
  stack: string | null;
  method: string | null;
  path: string | null;
  statusCode: number | null;
  userId: number | null;
  context: Record<string, unknown> | null;
  createdAt: string;
}

// Fonctionnalité expérimentale vue par l'admin (avec la taille réelle du groupe exposé)
export interface AdminFeatureFlag {
  key: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number;
  updatedAt: string;
  exposedUsers: number;
  totalUsers: number;
}
