import type { User as PrismaUser } from '@prisma/client';

export type User = PrismaUser;

export type UserPublic = Omit<User, 'password' | 'two_factor_secret' | 'token_version'>;

export type UserCreateDTO = {
  email: string;
  password: string;
  user_name: string;
};

export type UserLoginResponse = {
  user: UserPublic;
  accessToken: string;
  refreshToken: string;
};
