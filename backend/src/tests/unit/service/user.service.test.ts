// Mocks must be defined before importing the module that constructs PrismaClient
jest.mock('@prisma/client', () => {
  const mUser = {
    findUnique: jest.fn(),
    create: jest.fn(),
  };
  class PrismaClient {
    user = mUser;
    $disconnect = jest.fn();
  }
  return { PrismaClient, Prisma: { PrismaClientKnownRequestError: class extends Error {} } };
});

jest.mock('../../../utils/hash.util', () => ({
  hashPassword: jest.fn((p: string) => `hashed-${p}`),
  comparePassword: jest.fn((p: string, h: string) => p === 'valid' && h === 'hashed-valid'),
}));

jest.mock('../../../utils/jwt.util', () => ({
  createAccessToken: jest.fn(() => 'access-token'),
  createRefreshToken: jest.fn(() => 'refresh-token'),
}));

import { PrismaClient } from '@prisma/client';
import { userService } from '../../../modules/user/user.service';
import { comparePassword, hashPassword } from '../../../utils/hash.util';
import { createAccessToken, createRefreshToken } from '../../../utils/jwt.util';

const prisma = new PrismaClient() as jest.Mocked<PrismaClient>;

describe('userService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('creates a user when email is not used', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      const created = {
        id: 1,
        email: 'a@x',
        password: 'hashed-pass',
        username: 'u',
        firstname: 'u',
        lastname: null,
        avatarProfile: null,
        bio: null,
        address: null,
        xp: 0,
        trustIndex: 0,
        isTwoFactorEnabled: false,
        gradeId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      (prisma.user.create as jest.Mock).mockResolvedValue(created);

      const res = await userService.register('a@x', 'pass', 'u');
      expect(res).toMatchObject({ id: 1, email: 'a@x', username: 'u' });
      expect(res).not.toHaveProperty('password');
      expect(hashPassword).toHaveBeenCalledWith('pass');
    });

    test('throws AppError when email already exists', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 2, email: 'a@x' });
      await expect(userService.register('a@x', 'pass', 'u')).rejects.toMatchObject({
        statusCode: 409,
      });
    });
  });

  describe('login', () => {
    test('throws when user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(userService.login('no@one', 'whatever')).rejects.toMatchObject({
        statusCode: 401,
      });
    });

    test('throws when password is invalid', async () => {
      const user = {
        id: 3,
        email: 'bob@x',
        password: 'hashed-secret',
        username: 'bob',
        firstname: 'Bob',
        lastname: null,
        xp: 0,
      };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(user);
      (comparePassword as jest.Mock).mockReturnValueOnce(false);
      await expect(userService.login('bob@x', 'wrong')).rejects.toMatchObject({ statusCode: 401 });
    });

    it('returns token and user when credentials are valid', async () => {
      const user = {
        id: 4,
        email: 'jane@x',
        password: 'hashed-valid',
        username: 'jane',
        firstname: 'Jane',
        lastname: null,
        avatarProfile: null,
        bio: null,
        address: null,
        xp: 0,
        trustIndex: 0,
        isTwoFactorEnabled: false,
        gradeId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(user);
      (comparePassword as jest.Mock).mockReturnValueOnce(true);

      const res = await userService.login('jane@x', 'valid');
      expect(comparePassword).toHaveBeenCalledWith('valid', user.password);
      expect(createAccessToken).toHaveBeenCalledWith({
        id: 4,
        email: 'jane@x',
      });
      expect(createRefreshToken).toHaveBeenCalledWith({
        id: 4,
        email: 'jane@x',
      });
      expect(res).toHaveProperty('accessToken', 'access-token');
      expect(res).toHaveProperty('refreshToken', 'refresh-token');
      expect(res.user).toMatchObject({ id: 4, email: 'jane@x', username: 'jane' });
      expect(res.user).not.toHaveProperty('password');
    });
  });
});
