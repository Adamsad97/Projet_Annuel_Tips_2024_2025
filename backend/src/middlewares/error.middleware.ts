import type { Request, Response, NextFunction } from 'express';
import type { AppErrorDetails } from '../utils/appError.util';
import { AppError } from '../utils/appError.util';
import { env } from '../config/env';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { logService } from '../modules/logs/log.service';
import { runInBackground } from '../utils/background.util';
import type { RequestWithUser } from '../types/auth.types';

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
  } else if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
    // Enregistrement visé introuvable (ex: lever le ban d'un compte supprimé)
    statusCode = 404;
    message = 'resource not found';
  } else if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
    // Valeur déjà utilisée sur un champ unique (ex: nom de grade en double)
    statusCode = 409;
    message = 'resource already exists';
  } else if (err instanceof ZodError) {
    // Paramètres de requête invalides (ex: ?take=abc) : erreur du client, pas du serveur
    statusCode = 400;
    message = 'Validation error';
    details = err.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message }));
  } else {
    if (!isProduction) {
      message = err.message || message;
    }
  }

  // Erreurs serveur (bug, base indisponible...) : enregistrées pour l'admin, avec le vrai message
  if (statusCode >= 500) {
    const userId = (req as RequestWithUser).user?.id;
    runInBackground('error-log', () =>
      logService.recordServerError(err, {
        method: req.method,
        path: req.originalUrl,
        statusCode,
        userId,
      }),
    );
  }

  if (!isTest) {
    const log = `[${req.method}] ${req.originalUrl} → ${statusCode}: ${message}`;
    console.error(log);
    if ((!isProduction || !isTest) && err.stack) {
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
