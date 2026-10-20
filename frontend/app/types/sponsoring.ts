// Tip sponsorisé tel que servi au public (jamais le ciblage ni le budget)
export interface PublicAd {
  id: number;
  sponsorName: string;
  title: string;
  body: string;
  imageUrl: string | null;
}

export interface ActiveChallenge {
  id: number;
  sponsorName: string;
  title: string;
  description: string;
  xpBonus: number;
  startsAt: string;
  endsAt: string;
  maxRewards: number | null;
  category: { id: number; name: string };
  rewardsGiven: number;
  remainingRewards: number | null;
  completedByMe: boolean;
}

export type AdStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ENDED';
export type AdAudience = 'ALL' | 'MEMBERS' | 'GUESTS';

export interface AdTotals {
  impressions: number;
  clicks: number;
  ctr: number;
}

export interface AdminCampaign {
  id: number;
  name: string;
  sponsorName: string;
  title: string;
  body: string;
  imageUrl: string | null;
  targetUrl: string;
  status: AdStatus;
  audience: AdAudience;
  targetCategoryIds: number[];
  targetGradeIds: number[];
  startsAt: string;
  endsAt: string | null;
  maxImpressions: number | null;
  priority: number;
  totals: AdTotals;
}

export interface AdStats {
  campaign: { id: number; name: string; sponsorName: string };
  totals: AdTotals;
  days: Array<AdTotals & { day: string }>;
}

export interface AdminChallenge {
  id: number;
  sponsorName: string;
  title: string;
  description: string;
  categoryId: number;
  category: { id: number; name: string };
  xpBonus: number;
  startsAt: string;
  endsAt: string;
  maxRewards: number | null;
  isActive: boolean;
  rewardsGiven: number;
}
