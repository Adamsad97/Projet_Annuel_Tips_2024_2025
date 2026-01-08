import rateLimit from 'express-rate-limit';
import type { Request, Response } from 'express';

const getClientIp = (req: Request): string => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded && typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }

  const realIp = req.headers['x-real-ip'];
  if (realIp && typeof realIp === 'string') {
    return realIp;
  }

  return req.ip || req.socket.remoteAddress || 'unknown';
};

const rateLimitHandler = (req: Request, res: Response) => {
  const clientIp = getClientIp(req);
  console.warn(`Rate limit atteinte pour l'IP: ${clientIp} sur ${req.path}`);

  res.status(429).json({
    success: false,
    status: 429,
    message: 'Trop de requêtes depuis votre adresse IP. Veuillez réessayer plus tard.',
    retryAfter: res.getHeader('Retry-After'),
  });
};

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50, // 50 tentatives de connexion par IP toutes les 15 minutes
  keyGenerator: getClientIp,
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
});

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500, // 500 requêtes API par IP toutes les 15 minutes
  keyGenerator: getClientIp,
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
});

export const strictLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requêtes par IP par minute
  keyGenerator: getClientIp,
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
});
