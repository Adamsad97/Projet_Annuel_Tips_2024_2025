import type { Response, NextFunction } from 'express';
import { AppError } from '../utils/appError.util';
import { verifyAccessTokenOrThrow } from '../utils/jwt.util';
import type { RequestWithUser } from '../types/auth.types';

export function requireAuth(req: RequestWithUser, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next(new AppError('missing authorization header', 401));
  }

  const parts = authHeader.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return next(new AppError('invalid authorization format', 401));
  }

  const token = parts[1];

  if (!token) {
    return next(new AppError('token not provided', 401));
  }

  try {
    req.user = verifyAccessTokenOrThrow(token);
    return next();
  } catch (err) {
    return next(err);
  }
}
