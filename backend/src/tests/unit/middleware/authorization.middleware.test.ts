import { requireModerator, requireAdmin } from '../../../middlewares/auth.middleware';
import type { RequestWithUser } from '../../../types/auth.types';
import { AppError } from '../../../utils/appError.util';
import { createMockResponse } from '../../../types/test.types';
import type { Response } from 'express';
import { prisma } from '../../../db/prisma';

jest.mock('../../../db/prisma', () => ({
  prisma: {
    moderator: {
      findUnique: jest.fn(),
    },
    admin: {
      findUnique: jest.fn(),
    },
  },
}));

describe('Authorization Middlewares', () => {
  let req: Partial<RequestWithUser>;
  let res: Response;
  let next: jest.Mock;

  beforeEach(() => {
    req = {};
    res = createMockResponse() as unknown as Response;
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('requireModerator', () => {
    it('should call next with error if user is not authenticated', async () => {
      await requireModerator(req as RequestWithUser, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      const error = (next as jest.Mock).mock.calls[0][0];
      expect(error.message).toBe('Authentication required');
      expect(error.statusCode).toBe(401);
    });

    it('should call next with error if user is not a moderator', async () => {
      req.user = { id: 1, email: 'user@test.com' };
      (prisma.moderator.findUnique as jest.Mock).mockResolvedValue(null);

      await requireModerator(req as RequestWithUser, res, next);

      expect(prisma.moderator.findUnique).toHaveBeenCalledWith({
        where: { userId: 1 },
      });
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      const error = (next as jest.Mock).mock.calls[0][0];
      expect(error.message).toBe('Moderator access required');
      expect(error.statusCode).toBe(403);
    });

    it('should call next with error if moderator is not active', async () => {
      req.user = { id: 2, email: 'mod@test.com' };
      (prisma.moderator.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        userId: 2,
        isActive: false,
      });

      await requireModerator(req as RequestWithUser, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      const error = (next as jest.Mock).mock.calls[0][0];
      expect(error.message).toBe('Moderator access required');
      expect(error.statusCode).toBe(403);
    });

    it('should call next() if user is an active moderator', async () => {
      req.user = { id: 3, email: 'activemod@test.com' };
      (prisma.moderator.findUnique as jest.Mock).mockResolvedValue({
        id: 2,
        userId: 3,
        isActive: true,
      });

      await requireModerator(req as RequestWithUser, res, next);

      expect(prisma.moderator.findUnique).toHaveBeenCalledWith({
        where: { userId: 3 },
      });
      expect(next).toHaveBeenCalledWith();
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should handle database errors', async () => {
      req.user = { id: 4, email: 'test@test.com' };
      const dbError = new Error('Database connection failed');
      (prisma.moderator.findUnique as jest.Mock).mockRejectedValue(dbError);

      await requireModerator(req as RequestWithUser, res, next);

      expect(next).toHaveBeenCalledWith(dbError);
    });
  });

  describe('requireAdmin', () => {
    it('should call next with error if user is not authenticated', async () => {
      await requireAdmin(req as RequestWithUser, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      const error = (next as jest.Mock).mock.calls[0][0];
      expect(error.message).toBe('Authentication required');
      expect(error.statusCode).toBe(401);
    });

    it('should call next with error if user is not an admin', async () => {
      req.user = { id: 1, email: 'user@test.com' };
      (prisma.admin.findUnique as jest.Mock).mockResolvedValue(null);

      await requireAdmin(req as RequestWithUser, res, next);

      expect(prisma.admin.findUnique).toHaveBeenCalledWith({
        where: { userId: 1 },
      });
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      const error = (next as jest.Mock).mock.calls[0][0];
      expect(error.message).toBe('Admin access required');
      expect(error.statusCode).toBe(403);
    });

    it('should call next() if user is an admin', async () => {
      req.user = { id: 5, email: 'admin@test.com' };
      (prisma.admin.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        userId: 5,
      });

      await requireAdmin(req as RequestWithUser, res, next);

      expect(prisma.admin.findUnique).toHaveBeenCalledWith({
        where: { userId: 5 },
      });
      expect(next).toHaveBeenCalledWith();
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should handle database errors', async () => {
      req.user = { id: 6, email: 'test@test.com' };
      const dbError = new Error('Database connection failed');
      (prisma.admin.findUnique as jest.Mock).mockRejectedValue(dbError);

      await requireAdmin(req as RequestWithUser, res, next);

      expect(next).toHaveBeenCalledWith(dbError);
    });
  });
});
