import type { Tip } from './user';
import type { CurrentUser } from './user';

export interface ModerationStats {
  pendingTips: number;
  pendingReports: number;
  totalModerators: number;
  totalActions: number;
}

export interface PendingTip extends Tip {
  user: CurrentUser;
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
