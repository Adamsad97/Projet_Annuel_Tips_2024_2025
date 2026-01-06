import type { User as PrismaUser } from '@prisma/client';

// user from prisma
export type User = PrismaUser;

// user for public
export type UserPublic = Omit<User, 'password' | 'two_factor_secret' | 'token_version'>;

// user creation data request
export type UserCreateDTO = {
  email: string;
  password: string;
  user_name: string;
};

// response for login
export type UserLoginResponse = {
  user: UserPublic;
  accessToken: string;
  refreshToken: string;
};
