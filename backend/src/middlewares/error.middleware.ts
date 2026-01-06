import type { Request, Response, NextFunction } from 'express';
import type { AppErrorDetails } from '../utils/appError.util';
import { AppError } from '../utils/appError.util';
import { env } from '../config/env';

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const isProduction = env.NODE_ENV === 'production';
  const isTest = env.NODE_ENV === 'test';

  let statusCode = 500;
  let message = 'internal server error';
  let details: AppErrorDetails | undefined = undefined;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;
  } else {
    if (!isProduction) {
      message = err.message || message;
    }
  }

  if (!isTest) {
    const log = `[${req.method}] ${req.originalUrl} → ${statusCode}: ${message}`;
    console.error(log);
    if (!isProduction && err.stack) {
      console.error(err.stack);
    }
  }

  res.status(statusCode).json({
    success: false,
    status: statusCode,
    message,
    ...(details && { details }),
  });
}
