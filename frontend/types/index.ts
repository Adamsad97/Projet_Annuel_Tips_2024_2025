export interface Grade {
  id: number
  name: string
  xp_required: number
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterDTO {
  username: string
  email: string
  password: string
}

export interface DbUser {
  id: number
  user_name: string
  email: string
  avatar_profile: string
  bio?: string
  address?: string
  trust_index?: number
  is_two_factor_enabled?: boolean
  grade_id: number
  xp: number
}

export interface Author {
  name: string
  xp: number
  avatar: string
  role?: string
}

export interface Tip {
  id: number | string
  title: string
  description: string
  content?: string
  tags: string[]
  difficulty: number
  author: Author
  publishedAgo: string
  views: number
  created_at?: string
  address?: string
  lat?: number
  lng?: number
  images?: string[] // URLs
  documents?: { name: string, url: string }[]
}

export interface User {
  id: number
  name: string
  email?: string
  bio?: string
  address?: string
  xp: number
  tips: number
  votes: number
  role: string
  rank?: number
  avatar: string
}

export interface CurrentUser {
  id: number
  rank: number
  name: string
  xp: number
  avatar: string
  role: string
  trend: string
}

export interface FilterOption {
  k: string
  l: string
  i: string
}

