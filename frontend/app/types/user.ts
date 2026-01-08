export interface Author {
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
