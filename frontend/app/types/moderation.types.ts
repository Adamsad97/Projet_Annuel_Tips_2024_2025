export interface ModerationStats {
  pendingTips: number;
  pendingReports: number;
  totalModerators: number;
  totalActions: number;
}

// Tip en attente renvoyé par GET /moderation/tips/pending
export interface PendingTip {
  id: number;
  title: string;
  content: string | null;
  createdAt: string;
  user: {
    id: number;
    firstname: string | null;
    lastname: string | null;
    username: string;
    avatarProfile: string | null;
  };
  categories: Array<{
    category: {
      id: number;
      name: string;
    };
  }>;
}

// Identité publique (pas d'email) renvoyée dans les données de modération
export interface ModerationMember {
  id: number;
  username: string;
  firstname: string | null;
  lastname: string | null;
  avatarProfile: string | null;
}

// Signalement ouvert renvoyé par GET /moderation/reports, avec le contenu visé
export interface Report {
  id: number;
  reason: string;
  createdAt: string;
  tipId: number | null;
  commentId: number | null;
  status: 'OPEN' | 'REVIEWED' | 'RESOLVED' | 'REJECTED';
  user: ModerationMember;
  tip: { id: number; title: string; content: string | null; user: ModerationMember } | null;
  comment: { id: number; content: string; tipId: number; user: ModerationMember } | null;
}

export type ReportAction = 'APPROVE' | 'REJECT';

// Action du modérateur connecté, renvoyée par GET /moderation/history
export interface ModeratorHistoryEntry {
  id: number;
  actionType: string;
  reason: string | null;
  metadata: { tipId?: number } | null;
  overturnedAt: string | null;
  createdAt: string;
  user: {
    id: number;
    username: string;
    firstname: string | null;
    lastname: string | null;
    avatarProfile: string | null;
  };
  appeal: { status: 'OPEN' | 'ACCEPTED' | 'REJECTED' } | null;
}
