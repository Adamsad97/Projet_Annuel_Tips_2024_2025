import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: {
    success: false,
    status: 429,
    message: 'trop de tentatives, reessayez dans 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    status: 429,
    message: 'trop de requetes, reessayez plus tard',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
