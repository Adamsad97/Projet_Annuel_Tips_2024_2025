import type { User } from '@prisma/client';
import { comparePassword, hashPassword } from '../../utils/hash.util';
import { AppError } from '../../utils/appError.util';
import { createAccessToken, createRefreshToken } from '../../utils/jwt.util';
import { userRepository } from './user.repository';

/**
 * Type pour un utilisateur sans données sensibles
 */
export type PublicUser = Omit<User, 'password'>;

/**
 * Convertit un User Prisma en PublicUser (enlève les champs sensibles)
 */
function toPublicUser(user: User): PublicUser {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...publicUser } = user;
  return publicUser;
}

export const userService = {
  /**
   * Register a new user
   */
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
      throw new AppError('Email already in use', 409);
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

  /**
   * authenticate user and returns JWT tokens
   */
  async login(email: string, password: string) {
    const normalizedEmail = email.toLowerCase().trim();

    const user = await userRepository.findByEmail(normalizedEmail);
    if (!user || !comparePassword(password, user.password)) {
      throw new AppError('Invalid credentials', 401);
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

  /**
   * get user by id
   */
  async getUserById(id: number): Promise<PublicUser> {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    return toPublicUser(user);
  },
};
