import type { Request, Response, NextFunction } from 'express';
import { AuthController } from '../../../modules/auth/auth.controller';
import { verifyRefreshTokenOrThrow, createAccessToken } from '../../../utils/jwt.util';
import { AppError } from '../../../utils/appError.util';
import { userRepository } from '../../../modules/user/user.repository';
import { createMockRequest, createMockResponse } from '../../../types/test.types';
import type { RequestWithUser } from '../../../types/auth.types';

// Mock dependencies
jest.mock('../../../utils/jwt.util');
jest.mock('../../../modules/user/user.repository');

const mockVerifyRefreshToken = verifyRefreshTokenOrThrow as jest.MockedFunction<
  typeof verifyRefreshTokenOrThrow
>;
const mockCreateAccessToken = createAccessToken as jest.MockedFunction<typeof createAccessToken>;
const mockUserRepository = userRepository as jest.Mocked<typeof userRepository>;

describe('AuthController', () => {
  let authController: AuthController;
  let req: Request | RequestWithUser;
  let res: Response;
  let next: NextFunction;

  beforeEach(() => {
    authController = new AuthController();
    res = createMockResponse() as unknown as Response;
    next = jest.fn() as NextFunction;
    jest.clearAllMocks();
  });

  describe('refresh', () => {
    it('should throw error when no refresh token is provided in body or headers', async () => {
      req = createMockRequest({ body: {}, headers: {} }) as Request;

      await authController.refresh(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      const error = (next as jest.Mock).mock.calls[0][0];
      expect(error.message).toBe('Refresh token required');
      expect(error.statusCode).toBe(401);
    });

    it('should accept refresh token from request body', async () => {
      const mockPayload = { id: 1, email: 'test@test.com', tokenVersion: 0 };
      const mockUser = {
        id_user: 1,
        email: 'test@test.com',
        token_version: 0,
        password: 'hash',
        user_name: 'test',
        avatar_profile: null,
        bio: null,
        address: null,
        trust_index: 0,
        is_two_factor_enabled: false,
        two_factor_secret: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      req = createMockRequest({
        body: { refreshToken: 'valid-refresh-token' },
        headers: {},
      }) as Request;

      mockVerifyRefreshToken.mockReturnValue(mockPayload);
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockCreateAccessToken.mockReturnValue('new-access-token');

      await authController.refresh(req, res, next);

      expect(mockVerifyRefreshToken).toHaveBeenCalledWith('valid-refresh-token');
      expect(mockUserRepository.findById).toHaveBeenCalledWith(1);
      expect(mockCreateAccessToken).toHaveBeenCalledWith({
        id: 1,
        email: 'test@test.com',
        tokenVersion: 0,
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { accessToken: 'new-access-token' },
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should accept refresh token from x-refresh-token header', async () => {
      const mockPayload = { id: 2, email: 'user@test.com', tokenVersion: 1 };
      const mockUser = {
        id_user: 2,
        email: 'user@test.com',
        token_version: 1,
        password: 'hash',
        user_name: 'user',
        avatar_profile: null,
        bio: null,
        address: null,
        trust_index: 0,
        is_two_factor_enabled: false,
        two_factor_secret: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      req = createMockRequest({
        body: {},
        headers: { 'x-refresh-token': 'header-refresh-token' },
      }) as Request;

      mockVerifyRefreshToken.mockReturnValue(mockPayload);
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockCreateAccessToken.mockReturnValue('new-access-token-2');

      await authController.refresh(req, res, next);

      expect(mockVerifyRefreshToken).toHaveBeenCalledWith('header-refresh-token');
      expect(mockUserRepository.findById).toHaveBeenCalledWith(2);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { accessToken: 'new-access-token-2' },
      });
    });

    it('should throw error when user is not found', async () => {
      const mockPayload = { id: 999, email: 'notfound@test.com', tokenVersion: 0 };

      req = createMockRequest({
        body: { refreshToken: 'valid-token' },
      }) as Request;

      mockVerifyRefreshToken.mockReturnValue(mockPayload);
      mockUserRepository.findById.mockResolvedValue(null);

      await authController.refresh(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      const error = (next as jest.Mock).mock.calls[0][0];
      expect(error.message).toBe('Invalid refresh token');
      expect(error.statusCode).toBe(401);
    });

    it('should throw error when token version does not match', async () => {
      const mockPayload = { id: 1, email: 'test@test.com', tokenVersion: 0 };
      const mockUser = {
        id_user: 1,
        email: 'test@test.com',
        token_version: 5, // Different token version
        password: 'hash',
        user_name: 'test',
        avatar_profile: null,
        bio: null,
        address: null,
        trust_index: 0,
        is_two_factor_enabled: false,
        two_factor_secret: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      req = createMockRequest({
        body: { refreshToken: 'old-token' },
      }) as Request;

      mockVerifyRefreshToken.mockReturnValue(mockPayload);
      mockUserRepository.findById.mockResolvedValue(mockUser);

      await authController.refresh(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      const error = (next as jest.Mock).mock.calls[0][0];
      expect(error.message).toBe('Invalid refresh token');
      expect(error.statusCode).toBe(401);
    });

    it('should handle token verification errors', async () => {
      const tokenError = new AppError('Token expired', 401);
      req = createMockRequest({
        body: { refreshToken: 'expired-token' },
      }) as Request;

      mockVerifyRefreshToken.mockImplementation(() => {
        throw tokenError;
      });

      await authController.refresh(req, res, next);

      expect(next).toHaveBeenCalledWith(tokenError);
    });

    it('should handle database errors', async () => {
      const mockPayload = { id: 1, email: 'test@test.com', tokenVersion: 0 };
      const dbError = new Error('Database connection failed');

      req = createMockRequest({
        body: { refreshToken: 'valid-token' },
      }) as Request;

      mockVerifyRefreshToken.mockReturnValue(mockPayload);
      mockUserRepository.findById.mockRejectedValue(dbError);

      await authController.refresh(req, res, next);

      expect(next).toHaveBeenCalledWith(dbError);
    });

    it('should handle payload with undefined tokenVersion', async () => {
      const mockPayload = { id: 1, email: 'test@test.com' }; // No tokenVersion
      const mockUser = {
        id_user: 1,
        email: 'test@test.com',
        token_version: 0,
        password: 'hash',
        user_name: 'test',
        avatar_profile: null,
        bio: null,
        address: null,
        trust_index: 0,
        is_two_factor_enabled: false,
        two_factor_secret: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      req = createMockRequest({
        body: { refreshToken: 'token-without-version' },
      }) as Request;

      mockVerifyRefreshToken.mockReturnValue(mockPayload);
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockCreateAccessToken.mockReturnValue('new-token');

      await authController.refresh(req, res, next);

      expect(mockCreateAccessToken).toHaveBeenCalledWith({
        id: 1,
        email: 'test@test.com',
        tokenVersion: 0,
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('logout', () => {
    it('should increment token version and return success when user is authenticated', async () => {
      req = createMockRequest() as RequestWithUser;
      (req as RequestWithUser).user = { id: 1, email: 'test@test.com', tokenVersion: 0 };

      mockUserRepository.incrementTokenVersion.mockResolvedValue({
        id_user: 1,
        email: 'test@test.com',
        token_version: 1,
        password: 'hash',
        user_name: 'test',
        avatar_profile: null,
        bio: null,
        address: null,
        trust_index: 0,
        is_two_factor_enabled: false,
        two_factor_secret: null,
        created_at: new Date(),
        updated_at: new Date(),
      });

      await authController.logout(req as RequestWithUser, res, next);

      expect(mockUserRepository.incrementTokenVersion).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { message: 'Logged out successfully' },
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should still return success even when user is not present', async () => {
      req = createMockRequest() as RequestWithUser;
      // Don't set req.user, it will be undefined

      await authController.logout(req as RequestWithUser, res, next);

      expect(mockUserRepository.incrementTokenVersion).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { message: 'Logged out successfully' },
      });
    });

    it('should handle database errors during token version increment', async () => {
      req = createMockRequest() as RequestWithUser;
      (req as RequestWithUser).user = { id: 1, email: 'test@test.com', tokenVersion: 0 };

      const dbError = new Error('Failed to update token version');
      mockUserRepository.incrementTokenVersion.mockRejectedValue(dbError);

      await authController.logout(req as RequestWithUser, res, next);

      expect(next).toHaveBeenCalledWith(dbError);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('build', () => {
    it('should return a router with the correct routes', () => {
      const router = authController.build();

      expect(router).toBeDefined();
      expect(typeof router).toBe('function'); // Express routers are functions
    });
  });
});
