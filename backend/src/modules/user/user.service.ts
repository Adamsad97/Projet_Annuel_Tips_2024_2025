import type { User } from '@prisma/client';
import { comparePassword, hashPassword } from '../../utils/hash.util';
import { AppError } from '../../utils/appError.util';
import { createAccessToken, createRefreshToken } from '../../utils/jwt.util';
import { userRepository } from './user.repository';

export type PublicUser = Omit<User, 'password'>;

function toPublicUser(user: User): PublicUser {
  const { password, ...publicUser } = user;
  return publicUser;
}

export const userService = {
  async register(
    email: string,
    password: string,
    username: string,
    firstname?: string,
    lastname?: string,
  ): Promise<PublicUser> {
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedUsername = username.trim();

    const existing = await userRepository.findByEmail(normalizedEmail);
    if (existing) {
      throw new AppError('email already in use', 409);
    }

    const hash = hashPassword(password);
    const user = await userRepository.create(
      normalizedEmail,
      hash,
      normalizedUsername,
      firstname,
      lastname,
    );

    return toPublicUser(user);
  },

  async login(email: string, password: string) {
    const normalizedEmail = email.toLowerCase().trim();

    const user = await userRepository.findByEmail(normalizedEmail);
    if (!user || !comparePassword(password, user.password)) {
      throw new AppError('invalid credentials', 401);
    }

    const payload = {
      id: user.id,
      email: user.email,
    };

    return {
      accessToken: createAccessToken(payload),
      refreshToken: createRefreshToken(payload),
      user: toPublicUser(user),
    };
  },

  async getUserById(id: number): Promise<PublicUser> {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new AppError('user not found', 404);
    }
    return toPublicUser(user);
  },
};
