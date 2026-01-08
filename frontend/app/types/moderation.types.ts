import type { Tip } from './tip';
import type { User } from './user';

export interface ModerationStats {
  pendingTips: number;
  pendingReports: number;
  totalModerators: number;
  totalActions: number;
}

export interface PendingTip extends Tip {
  user: User;
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
