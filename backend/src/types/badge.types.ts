export enum BadgeCode {
  FIRST_TIP = 'FIRST_TIP',
  TIP_MASTER = 'TIP_MASTER',
  TIP_LEGEND = 'TIP_LEGEND',
  HELPFUL = 'HELPFUL',
  SUPER_HELPFUL = 'SUPER_HELPFUL',
  SOCIAL = 'SOCIAL',
  INFLUENCER = 'INFLUENCER',
  COMMENTATOR = 'COMMENTATOR',
  EARLY_BIRD = 'EARLY_BIRD',
}

export interface BadgeCondition {
  check: (userStats: UserBadgeStats) => boolean;
  xpReward: number;
}

export interface UserBadgeStats {
  tipsCount: number;
  tipsUpvotes: number;
  commentsCount: number;
  followersCount: number;
  createdAt: Date;
}

export type BadgeConditions = Record<BadgeCode, BadgeCondition>;
