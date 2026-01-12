import type { Request, Response, NextFunction } from 'express';
import { AuthController } from '../../../modules/auth/auth.controller';
import {
  verifyRefreshTokenOrThrow,
  createAccessToken,
  createRefreshToken,
} from '../../../utils/jwt.util';
import { AppError } from '../../../utils/appError.util';
import { userRepository } from '../../../modules/user/user.repository';
import { createMockRequest, createMockResponse } from '../../../types/test.types';
import type { RequestWithUser } from '../../../types/auth.types';

// mock dependencies
jest.mock('../../../utils/jwt.util');
jest.mock('../../../modules/user/user.repository');

const mockVerifyRefreshToken = verifyRefreshTokenOrThrow as jest.MockedFunction<
  typeof verifyRefreshTokenOrThrow
>;
const mockCreateAccessToken = createAccessToken as jest.MockedFunction<typeof createAccessToken>;
const mockCreateRefreshToken = createRefreshToken as jest.MockedFunction<typeof createRefreshToken>;
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
    it('erreur si pas de refresh token dans body ou headers', async () => {
      req = createMockRequest({ body: {}, headers: {} }) as Request;

      await authController.refresh(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      const error = (next as jest.Mock).mock.calls[0][0];
      expect(error.message).toBe('refresh token required');
      expect(error.statusCode).toBe(401);
    });

    it('accepte le refresh token depuis le body', async () => {
      const mockPayload = { id: 1, email: 'test@test.com' };
      const mockUser = {
        id: 1,
        email: 'test@test.com',
        password: 'hash',
        username: 'test',
        firstname: 'test',
        lastname: null,
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
      mockCreateRefreshToken.mockReturnValue('new-refresh-token');

      await authController.refresh(req, res, next);

      expect(mockVerifyRefreshToken).toHaveBeenCalledWith('valid-refresh-token');
      expect(mockUserRepository.findById).toHaveBeenCalledWith(1);
      expect(mockCreateAccessToken).toHaveBeenCalledWith({
        id: 1,
        email: 'test@test.com',
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('accepte le refresh token depuis authorization header', async () => {
      const mockPayload = { id: 2, email: 'user@test.com' };
      const mockUser = {
        id: 2,
        email: 'user@test.com',
        password: 'hash',
        username: 'user',
        firstname: 'user',
        lastname: null,
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
        headers: { authorization: 'Bearer header-refresh-token' },
      }) as Request;

      mockVerifyRefreshToken.mockReturnValue(mockPayload);
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockCreateAccessToken.mockReturnValue('new-access-token-2');
      mockCreateRefreshToken.mockReturnValue('new-refresh-token-2');

      await authController.refresh(req, res, next);

      expect(mockVerifyRefreshToken).toHaveBeenCalledWith('header-refresh-token');
      expect(mockUserRepository.findById).toHaveBeenCalledWith(2);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          accessToken: 'new-access-token-2',
          refreshToken: 'new-refresh-token-2',
        },
      });
    });

    it('erreur si user introuvable', async () => {
      const mockPayload = { id: 999, email: 'notfound@test.com' };

      req = createMockRequest({
        body: { refreshToken: 'valid-token' },
      }) as Request;

      mockVerifyRefreshToken.mockReturnValue(mockPayload);
      mockUserRepository.findById.mockResolvedValue(null);

      await authController.refresh(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      const error = (next as jest.Mock).mock.calls[0][0];
      expect(error.message).toBe('invalid refresh token');
      expect(error.statusCode).toBe(401);
    });

    it('gere les erreurs de verification token', async () => {
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

    it('gere les erreurs database', async () => {
      const mockPayload = { id: 1, email: 'test@test.com' };
      const dbError = new Error('Database connection failed');

      req = createMockRequest({
        body: { refreshToken: 'valid-token' },
      }) as Request;

      mockVerifyRefreshToken.mockReturnValue(mockPayload);
      mockUserRepository.findById.mockRejectedValue(dbError);

      await authController.refresh(req, res, next);

      expect(next).toHaveBeenCalledWith(dbError);
    });
  });

  describe('logout', () => {
    it('retourne success quand user est authentifie', async () => {
      req = createMockRequest() as RequestWithUser;
      (req as RequestWithUser).user = { id: 1, email: 'test@test.com' };

      await authController.logout(req as RequestWithUser, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { message: 'logged out successfully' },
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('retourne success meme sans user', async () => {
      req = createMockRequest() as RequestWithUser;

      await authController.logout(req as RequestWithUser, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { message: 'logged out successfully' },
      });
    });
  });

  describe('build', () => {
    it('retourne un router avec les routes', () => {
      const router = authController.build();

      expect(router).toBeDefined();
      expect(typeof router).toBe('function');
    });
  });
});
