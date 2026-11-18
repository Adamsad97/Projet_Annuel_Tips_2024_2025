import { prisma } from '../../db/prisma';
import { runInBackground } from '../../utils/background.util';

const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * MINUTE_MS;

// Au-delà de 30 min sans requête, l'activité suivante ouvre une nouvelle session
const SESSION_GAP_MS = 30 * MINUTE_MS;
// Au plus une écriture par membre et par minute, quel que soit le nombre de requêtes
const WRITE_THROTTLE_MS = MINUTE_MS;
// Historique conservé pour le calcul de l'indice de confiance
export const SESSION_RETENTION_DAYS = 90;

const lastWrite = new Map<number, number>();

// Désactivé en test : une écriture en arrière-plan pourrait viser un compte déjà supprimé
// par le nettoyage de fin de test. Les tests qui en ont besoin le réactivent.
let trackingEnabled = process.env.NODE_ENV !== 'test';

export interface ActivityStats {
  activeDays: number;
  sessions: number;
  avgSessionMinutes: number;
}

export const activityService = {
  // Appelé à chaque requête authentifiée ; n'attend rien et n'échoue jamais
  setTrackingEnabled(enabled: boolean): void {
    trackingEnabled = enabled;
  },

  touch(userId: number): void {
    if (!trackingEnabled) return;
    const now = Date.now();
    if ((lastWrite.get(userId) ?? 0) > now - WRITE_THROTTLE_MS) return;
    lastWrite.set(userId, now);

    runInBackground('activity', () =>
      // Suivi non critique : un échec (compte supprimé entre-temps…) est simplement ignoré
      activityService.record(userId, new Date(now)).catch(() => undefined),
    );
  },

  async record(userId: number, at: Date): Promise<void> {
    const last = await prisma.userSession.findFirst({
      where: { userId },
      orderBy: { lastSeenAt: 'desc' },
    });

    if (last && at.getTime() - last.lastSeenAt.getTime() <= SESSION_GAP_MS) {
      if (at > last.lastSeenAt) {
        await prisma.userSession.update({ where: { id: last.id }, data: { lastSeenAt: at } });
      }
      return;
    }

    await prisma.userSession.create({ data: { userId, startedAt: at, lastSeenAt: at } });
  },

  async getStats(userId: number, periodDays: number): Promise<ActivityStats> {
    const sessions = await prisma.userSession.findMany({
      where: { userId, lastSeenAt: { gte: new Date(Date.now() - periodDays * DAY_MS) } },
      select: { startedAt: true, lastSeenAt: true },
    });

    const days = new Set<string>();
    let totalMs = 0;
    for (const session of sessions) {
      days.add(session.startedAt.toISOString().slice(0, 10));
      days.add(session.lastSeenAt.toISOString().slice(0, 10));
      totalMs += session.lastSeenAt.getTime() - session.startedAt.getTime();
    }

    return {
      activeDays: days.size,
      sessions: sessions.length,
      avgSessionMinutes: sessions.length ? totalMs / sessions.length / MINUTE_MS : 0,
    };
  },

  async prune(): Promise<void> {
    await prisma.userSession.deleteMany({
      where: { lastSeenAt: { lt: new Date(Date.now() - SESSION_RETENTION_DAYS * DAY_MS) } },
    });
    lastWrite.clear();
  },
};
