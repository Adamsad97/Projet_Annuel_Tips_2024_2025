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

import { PrismaClient } from '@prisma/client';
import { userRepository } from '../../../modules/user/user.repository';

const prisma = new PrismaClient() as jest.Mocked<PrismaClient>;

describe('userRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findByEmail', () => {
    it('should find user by email with relations', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        password: 'hashedpassword',
        moderator: null,
        admin: null,
      };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await userRepository.findByEmail('test@example.com');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        include: {
          moderator: true,
          admin: true,
        },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await userRepository.findByEmail('notfound@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should find user by id with relations', async () => {
      const mockUser = {
        id: 42,
        email: 'user@example.com',
        username: 'user42',
        password: 'hashedpassword',
        moderator: { id: 1, userId: 42, isActive: true },
        admin: null,
      };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await userRepository.findById(42);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 42 },
        include: {
          moderator: true,
          admin: true,
        },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await userRepository.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create user with all fields', async () => {
      const mockCreatedUser = {
        id: 10,
        email: 'newuser@example.com',
        username: 'newuser',
        firstname: 'John',
        lastname: 'Doe',
        password: 'hashedpassword',
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
      (prisma.user.create as jest.Mock).mockResolvedValue(mockCreatedUser);

      const result = await userRepository.create(
        'newuser@example.com',
        'hashedpassword',
        'newuser',
        'John',
        'Doe',
      );

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          username: 'newuser',
          email: 'newuser@example.com',
          password: 'hashedpassword',
          firstname: 'John',
          lastname: 'Doe',
        },
      });
      expect(result).toEqual(mockCreatedUser);
    });

    it('should create user with username as firstname when firstname is empty', async () => {
      const mockCreatedUser = {
        id: 11,
        email: 'test@example.com',
        username: 'testuser',
        firstname: 'testuser',
        lastname: undefined,
        password: 'hashedpassword',
      };
      (prisma.user.create as jest.Mock).mockResolvedValue(mockCreatedUser);

      await userRepository.create('test@example.com', 'hashedpassword', 'testuser', '', '');

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          username: 'testuser',
          email: 'test@example.com',
          password: 'hashedpassword',
          firstname: 'testuser',
          lastname: undefined,
        },
      });
    });

    it('should create user without optional fields', async () => {
      const mockCreatedUser = {
        id: 12,
        email: 'minimal@example.com',
        username: 'minimal',
        firstname: 'minimal',
        lastname: undefined,
        password: 'hashedpassword',
      };
      (prisma.user.create as jest.Mock).mockResolvedValue(mockCreatedUser);

      await userRepository.create('minimal@example.com', 'hashedpassword', 'minimal');

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          username: 'minimal',
          email: 'minimal@example.com',
          password: 'hashedpassword',
          firstname: 'minimal',
          lastname: undefined,
        },
      });
    });
  });
});
