import type { Prisma } from '@prisma/client';
import { prisma } from '../../db/prisma';

const MAX_MESSAGE_LENGTH = 1000;
const MAX_STACK_LENGTH = 8000;
const DEFAULT_RETENTION_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

export type LogSource = 'server' | 'client';

export interface LogEntry {
  source: LogSource;
  message: string;
  stack?: string | null;
  method?: string;
  path?: string;
  statusCode?: number;
  userId?: number;
  context?: Prisma.InputJsonValue;
}

export class LogService {
  // Enregistre une erreur sans jamais faire échouer l'appelant (la base peut être indisponible)
  async record(entry: LogEntry): Promise<void> {
    try {
      await prisma.errorLog.create({
        data: {
          ...entry,
          message: entry.message.slice(0, MAX_MESSAGE_LENGTH),
          stack: entry.stack?.slice(0, MAX_STACK_LENGTH) ?? null,
        },
      });
    } catch (error) {
      console.error('[logs] impossible d’enregistrer l’erreur :', error);
    }
  }

  // Erreur serveur inattendue (exception, promesse rejetée, tâche de fond)
  recordServerError(error: unknown, extra: Omit<LogEntry, 'source' | 'message' | 'stack'> = {}) {
    const err = error instanceof Error ? error : new Error(String(error));
    return this.record({ source: 'server', message: err.message, stack: err.stack, ...extra });
  }

  async list(query: { source?: LogSource; q?: string; skip: number; take: number }) {
    const where: Prisma.ErrorLogWhereInput = {
      ...(query.source ? { source: query.source } : {}),
      ...(query.q
        ? {
            OR: [
              { message: { contains: query.q, mode: 'insensitive' } },
              { path: { contains: query.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const since = new Date(Date.now() - DAY_MS);
    const [items, total, last24h] = await Promise.all([
      prisma.errorLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.take,
      }),
      prisma.errorLog.count({ where }),
      prisma.errorLog.count({ where: { createdAt: { gte: since } } }),
    ]);

    return { items, total, last24h };
  }

  // Supprime les erreurs plus anciennes que `olderThanDays` (0 = tout)
  async purge(olderThanDays = DEFAULT_RETENTION_DAYS): Promise<number> {
    const { count } = await prisma.errorLog.deleteMany({
      where:
        olderThanDays > 0
          ? { createdAt: { lt: new Date(Date.now() - olderThanDays * DAY_MS) } }
          : {},
    });
    return count;
  }
}

export const logService = new LogService();
