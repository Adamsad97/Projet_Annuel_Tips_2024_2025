import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import type { JwtUserPayload } from '../types/auth.types';
import { AppError } from './appError.util';

const ACCESS_EXPIRES_IN = '15m';
const REFRESH_EXPIRES_IN = '7d';
const TWO_FACTOR_EXPIRES_IN = '5m';

// Clé distincte : un jeton 2FA (mot de passe validé, code pas encore saisi)
// ne doit jamais être accepté comme token d'accès
const twoFactorSecret = () => `${env.JWT_SECRET}:two-factor`;

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
      throw new AppError('access token expired', 401);
    }
    throw new AppError(error?.message || 'invalid access token', 401);
  }
}

export function verifyRefreshTokenOrThrow(token: string): JwtUserPayload {
  try {
    return jwt.verify(token, env.REFRESH_SECRET) as JwtUserPayload;
  } catch (e: unknown) {
    const error = e as Error & { name?: string };
    if (error.name === 'TokenExpiredError') {
      throw new AppError('refresh token expired', 401);
    }
    throw new AppError(error?.message || 'invalid refresh token', 401);
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

export function createTwoFactorToken(userId: number): string {
  return jwt.sign({ id: userId, purpose: 'two-factor' }, twoFactorSecret(), {
    ...baseOptions,
    expiresIn: TWO_FACTOR_EXPIRES_IN,
  });
}

export function verifyTwoFactorTokenOrThrow(token: string): number {
  try {
    const payload = jwt.verify(token, twoFactorSecret()) as { id: number; purpose?: string };
    if (payload.purpose !== 'two-factor') {
      throw new Error('invalid two-factor token');
    }
    return payload.id;
  } catch {
    throw new AppError('two-factor session expired, please log in again', 401);
  }
}
