import type { User } from '@prisma/client';
import { comparePassword, hashPassword } from '../../utils/hash.util';
import { AppError } from '../../utils/appError.util';
import { createAccessToken, createRefreshToken } from '../../utils/jwt.util';
import { userRepository } from './user.repository';
import { prisma } from '../../db/prisma';
import { removeUploadedFile } from '../../utils/imageUpload.util';
import type { ChangePasswordInput, UpdateProfileInput } from './user.validation';

// L'indice de confiance reste caché à l'utilisateur (visible uniquement par l'admin)
export type PublicUser = Omit<User, 'password' | 'trustIndex'>;

const RECENT_TIPS_ON_PROFILE = 10;

function toPublicUser<T extends { password: string; trustIndex: number }>(
  user: T,
): Omit<T, 'password' | 'trustIndex'> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, trustIndex, ...publicUser } = user;
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

  async updateProfile(id: number, data: UpdateProfileInput): Promise<PublicUser> {
    const user = await userRepository.update(id, data);
    return toPublicUser(user);
  },

  async changePassword(id: number, data: ChangePasswordInput): Promise<void> {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new AppError('user not found', 404);
    }

    // 400 et non 401 : un 401 déclencherait la déconnexion côté frontend
    if (!comparePassword(data.currentPassword, user.password)) {
      throw new AppError('current password is incorrect', 400);
    }

    await userRepository.update(id, { password: hashPassword(data.newPassword) });
  },

  async updateAvatar(id: number, avatarPath: string): Promise<PublicUser> {
    const user = await userRepository.findById(id);
    if (!user) {
      removeUploadedFile(avatarPath);
      throw new AppError('user not found', 404);
    }

    const updated = await userRepository.update(id, { avatarProfile: avatarPath });
    removeUploadedFile(user.avatarProfile);
    return toPublicUser(updated);
  },

  async removeAvatar(id: number): Promise<PublicUser> {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new AppError('user not found', 404);
    }

    const updated = await userRepository.update(id, { avatarProfile: null });
    removeUploadedFile(user.avatarProfile);
    return toPublicUser(updated);
  },

  // Profil visible par les autres membres : pas d'email ni d'indice de confiance
  async getPublicProfile(id: number) {
    const profile = await userRepository.findPublicProfile(id, RECENT_TIPS_ON_PROFILE);
    if (!profile) {
      throw new AppError('user not found', 404);
    }

    const [publishedTips, upvotesReceived] = await Promise.all([
      prisma.tip.count({ where: { userId: id, status: 'APPROVED' } }),
      prisma.vote.count({ where: { value: 1, tip: { userId: id } } }),
    ]);

    const { moderator, admin, userBadges, tips, _count, ...identity } = profile;

    return {
      ...identity,
      role: admin ? 'ADMIN' : moderator?.isActive ? 'MODERATOR' : 'USER',
      badges: userBadges.map((userBadge) => ({ ...userBadge.badge, earnedAt: userBadge.earnedAt })),
      stats: {
        publishedTips,
        comments: _count.comments,
        upvotesReceived,
      },
      recentTips: tips,
    };
  },
};
