import type { Response, NextFunction } from 'express';
import { AppError } from '../utils/appError.util';
import { verifyAccessTokenOrThrow } from '../utils/jwt.util';
import type { RequestWithUser } from '../types/auth.types';
import { prisma } from '../db/prisma';

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

export async function requireModerator(
  req: RequestWithUser,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }

  try {
    const moderator = await prisma.moderator.findUnique({
      where: { userId: req.user.id },
    });

    if (!moderator || !moderator.isActive) {
      return next(new AppError('Moderator access required', 403));
    }

    return next();
  } catch (error) {
    return next(error);
  }
}

export async function requireAdmin(
  req: RequestWithUser,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }

  try {
    const admin = await prisma.admin.findUnique({
      where: { userId: req.user.id },
    });

    if (!admin) {
      return next(new AppError('Admin access required', 403));
    }

    return next();
  } catch (error) {
    return next(error);
  }
}
