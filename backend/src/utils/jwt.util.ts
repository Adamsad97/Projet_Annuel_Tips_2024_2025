import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import type { JwtUserPayload } from '../types/auth.types';
import { AppError } from './appError.util';

const ACCESS_EXPIRES_IN = '15m';
const REFRESH_EXPIRES_IN = '7d';

const baseOptions: SignOptions = {
  algorithm: 'HS256',
};

export function createAccessToken(payload: JwtUserPayload, options?: SignOptions): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    ...baseOptions,
    expiresIn: ACCESS_EXPIRES_IN,
    ...options,
  });
}

export function createRefreshToken(payload: JwtUserPayload, options?: SignOptions): string {
  return jwt.sign(payload, env.REFRESH_SECRET, {
    ...baseOptions,
    expiresIn: REFRESH_EXPIRES_IN,
    ...options,
  });
}

export function verifyAccessTokenOrThrow(token: string): JwtUserPayload {
  try {
    return jwt.verify(token, env.JWT_SECRET) as JwtUserPayload;
  } catch (e: unknown) {
    const error = e as Error & { name?: string };
    if (error.name === 'TokenExpiredError') {
      throw new AppError('Access token expired', 401);
    }
    throw new AppError(error?.message || 'Invalid access token', 401);
  }
}

export function verifyRefreshTokenOrThrow(token: string): JwtUserPayload {
  try {
    return jwt.verify(token, env.REFRESH_SECRET) as JwtUserPayload;
  } catch (e: unknown) {
    const error = e as Error & { name?: string };
    if (error.name === 'TokenExpiredError') {
      throw new AppError('Refresh token expired', 401);
    }
    throw new AppError(error?.message || 'Invalid refresh token', 401);
  }
}

export function signToken(payload: Record<string, unknown>, options?: SignOptions): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    ...baseOptions,
    expiresIn: ACCESS_EXPIRES_IN,
    ...options,
  });
}

export function verifyToken(token: string): Record<string, unknown> {
  try {
    return jwt.verify(token, env.JWT_SECRET) as Record<string, unknown>;
  } catch (e: unknown) {
    const error = e as Error;
    throw new AppError(error?.message || 'Invalid token', 401);
  }
}
