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
    email: string;
    avatarProfile: string | null;
  };
  categories: Array<{
    category: {
      id: number;
      name: string;
    };
  }>;
}

export interface Report {
  id: number;
  reason: string;
  createdAt: Date;
  tipId?: number;
  commentId?: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
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
