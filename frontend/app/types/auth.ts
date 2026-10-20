export interface User {
  id: number;
  username: string;
  firstname?: string | null;
  lastname?: string | null;
  email: string;
  phone?: string | null;
  avatarProfile?: string | null;
  bio?: string | null;
  address?: string | null;
  isTwoFactorEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  gradeId?: number | null;
  xp?: number;
  moderator?: { isActive: boolean } | null;
  admin?: { userId: number } | null;
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

// Réponse du login quand la 2FA est active : le code doit être envoyé à POST /users/login/2fa
export interface TwoFactorChallenge {
  twoFactorRequired: true;
  twoFactorToken: string;
}

export type LoginResult = 'success' | 'two-factor' | 'error';

export interface TwoFactorSetup {
  secret: string;
  otpauthUrl: string;
  qrCode: string;
}
