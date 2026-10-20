export type TipKind = 'TIP' | 'QUESTION';

export interface TipFormData {
  kind: TipKind;
  title: string;
  description: string;
  content: string;
  tags: string[];
  difficulty: number;
  address?: string;
  lat?: number;
  lng?: number;
  images: File[];
  documents: File[];
}

// Forme d'un tip renvoyé par l'API (GET /tips, GET /tips/:id)
export interface ApiTip {
  id: number;
  kind: TipKind;
  title: string;
  content: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  images: string[];
  createdAt: string;
  updatedAt: string;
  userId: number;
  user?: {
    id: number;
    firstname: string | null;
    lastname: string | null;
    email?: string;
    avatarProfile: string | null;
  };
  categories?: Array<{ category: { id: number; name: string } }>;
  comments?: Array<{
    id: number;
    content: string;
    createdAt: string;
    user: {
      id: number;
      firstname: string | null;
      lastname: string | null;
      avatarProfile: string | null;
    };
  }>;
  _count?: { comments: number; votes: number; views: number };
  votes?: VoteSummary;
  // Visiteur non connecté : contenu tronqué, sans images ni commentaires
  isPreview?: boolean;
  // Présent sur GET /tips/trending
  trending?: { score: number; upvotes: number; downvotes: number; comments: number; views: number };
}

export interface Category {
  id: number;
  name: string;
  description: string | null;
  tipsCount: number;
  isFollowed: boolean;
}

export type VoteValue = 1 | -1 | 0;

export interface VoteSummary {
  upvotes: number;
  downvotes: number;
  score: number;
  userVote: VoteValue;
}

// Commentaire renvoyé par GET /tips/:id/comments (réponses imbriquées sur un niveau)
export interface ApiComment {
  id: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  parentId: number | null;
  user: {
    id: number;
    username: string;
    firstname: string | null;
    lastname: string | null;
    avatarProfile: string | null;
  };
  score: number;
  userVote: VoteValue;
  replies: ApiComment[];
}

export interface GradePerks {
  tipsPerDay: number;
  maxContentLength: number;
  maxImages: number;
  canAddLocation: boolean;
}

// Avantages débloqués par le grade (GET /users/me/perks)
export interface UserPerks {
  xp: number;
  isStaff: boolean;
  grade: { name: string; rank: number } | null;
  perks: GradePerks;
  publishedToday: number;
  remainingToday: number;
  canPublishTip: boolean;
  minXpToPublishTip: number;
  nextGrade: { name: string; xpRequired: number; xpMissing: number; perks: GradePerks } | null;
  enforced: boolean;
}
