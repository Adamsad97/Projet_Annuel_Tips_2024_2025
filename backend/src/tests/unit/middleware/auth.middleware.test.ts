import { requireAuth } from '../../../middlewares/auth.middleware';
import type { RequestWithUser } from '../../../types/auth.types';
import { AppError } from '../../../utils/appError.util';
import { verifyAccessTokenOrThrow } from '../../../utils/jwt.util';
import { createMockResponse } from '../../../types/test.types';
import type { Response } from 'express';

// Mock du module jwt.util
jest.mock('../../../utils/jwt.util', () => ({
  verifyAccessTokenOrThrow: jest.fn(),
}));

const mockVerifyToken = verifyAccessTokenOrThrow as jest.MockedFunction<
  typeof verifyAccessTokenOrThrow
>;

describe('requireAuth middleware', () => {
  let req: Partial<RequestWithUser>;
  let res: Response;
  let next: jest.Mock;

  beforeEach(() => {
    req = {
      headers: {},
    };
    res = createMockResponse() as unknown as Response;
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('calls next with AppError if authorization header is missing', () => {
    requireAuth(req as RequestWithUser, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(401);
    expect(err.message).toBe('Missing authorization header');
  });

  it('calls next with AppError if authorization format is invalid (no Bearer)', () => {
    req.headers = { authorization: 'InvalidToken' };

    requireAuth(req as RequestWithUser, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(401);
    expect(err.message).toContain('Invalid authorization format');
  });

  it('calls next with AppError if token is empty after Bearer', () => {
    req.headers = { authorization: 'Bearer ' };

    requireAuth(req as RequestWithUser, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(401);
    expect(err.message).toBe('Token not provided');
  });

  it('sets req.user and calls next() on valid token', () => {
    const mockUser = { id: 123, email: 'test@example.com', tokenVersion: 0 };
    mockVerifyToken.mockReturnValue(mockUser);

    req.headers = { authorization: 'Bearer valid-token' };

    requireAuth(req as RequestWithUser, res, next);

    expect(verifyAccessTokenOrThrow).toHaveBeenCalledWith('valid-token');
    expect(req.user).toEqual(mockUser);
    expect(next).toHaveBeenCalledWith();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('forwards error from verifyAccessTokenOrThrow to next', () => {
    const tokenError = new AppError('Invalid token', 401);
    mockVerifyToken.mockImplementation(() => {
      throw tokenError;
    });

    req.headers = { authorization: 'Bearer invalid-token' };

    requireAuth(req as RequestWithUser, res, next);

    expect(verifyAccessTokenOrThrow).toHaveBeenCalledWith('invalid-token');
    expect(next).toHaveBeenCalledWith(tokenError);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('handles expired token error', () => {
    const expiredError = new AppError('Access token expired', 401);
    mockVerifyToken.mockImplementation(() => {
      throw expiredError;
    });

    req.headers = { authorization: 'Bearer expired-token' };

    requireAuth(req as RequestWithUser, res, next);

    expect(next).toHaveBeenCalledWith(expiredError);
    const err = next.mock.calls[0][0];
    expect(err.message).toBe('Access token expired');
    expect(err.statusCode).toBe(401);
  });
});
