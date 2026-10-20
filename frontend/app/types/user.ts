export interface Author {
  id?: number;
  name: string;
  xp: number;
  avatar: string;
  role?: string;
}

export interface Tip {
  id: number | string;
  title: string;
  description: string;
  content?: string;
  tags: string[];
  difficulty: number;
  author: Author;
  publishedAgo: string;
  views: number;
  created_at?: string;
  address?: string;
  lat?: number;
  lng?: number;
  images?: string[];
  documents?: { name: string; url: string }[];
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface RankingUser {
  id: number;
  name: string;
  email?: string;
  bio?: string;
  address?: string;
  xp: number;
  tips: number;
  votes: number;
  role: string;
  rank?: number;
  avatar: string;
}

export interface CurrentUser {
  id: number;
  rank: number;
  name: string;
  xp: number;
  avatar: string;
  role: string;
  trend: string;
}

export interface FilterOption {
  k: string;
  l: string;
  i: string;
}

// Profil public renvoyé par GET /users/:id (pas d'email ni d'indice de confiance)
export interface PublicProfile {
  id: number;
  username: string;
  firstname: string | null;
  lastname: string | null;
  avatarProfile: string | null;
  bio: string | null;
  address: string | null;
  xp: number;
  createdAt: string;
  grade: { id: number; name: string; xpRequired: number } | null;
  role: 'USER' | 'MODERATOR' | 'ADMIN';
  badges: Array<{
    id: number;
    code: string;
    name: string;
    description: string | null;
    icon: string;
    earnedAt: string;
  }>;
  stats: { publishedTips: number; comments: number; upvotesReceived: number };
  recentTips: import('./tip').ApiTip[];
}
