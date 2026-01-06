export interface User {
  id: number;
  firstname?: string | null;
  lastname?: string | null;
  email: string;
  phone?: string | null;
  avatarProfile?: string | null;
  bio?: string | null;
  address?: string | null;
  trustIndex: number;
  isTwoFactorEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  gradeId?: number | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  username: string;
  firstname?: string;
  lastname?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}
