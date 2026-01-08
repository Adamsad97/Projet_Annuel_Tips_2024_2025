export enum XpAction {
  TIP_CREATED = 'TIP_CREATED',
  TIP_APPROVED = 'TIP_APPROVED',
  TIP_UPVOTED = 'TIP_UPVOTED',
  TIP_DOWNVOTED = 'TIP_DOWNVOTED',
  COMMENT_CREATED = 'COMMENT_CREATED',
  COMMENT_UPVOTED = 'COMMENT_UPVOTED',
  DAILY_LOGIN = 'DAILY_LOGIN',
  BADGE_EARNED = 'BADGE_EARNED',
}

export const XP_REWARDS: Record<XpAction, number> = {
  [XpAction.TIP_CREATED]: 10,
  [XpAction.TIP_APPROVED]: 20,
  [XpAction.TIP_UPVOTED]: 2,
  [XpAction.TIP_DOWNVOTED]: -1,
  [XpAction.COMMENT_CREATED]: 5,
  [XpAction.COMMENT_UPVOTED]: 1,
  [XpAction.DAILY_LOGIN]: 1,
  [XpAction.BADGE_EARNED]: 0, // Dynamic based on badge
};

export interface XpGainedEvent {
  userId: number;
  action: XpAction;
  amount: number;
  newTotal: number;
}

export interface LevelUpEvent {
  userId: number;
  oldGrade: string | null;
  newGrade: string;
  newGradeId: number;
}
