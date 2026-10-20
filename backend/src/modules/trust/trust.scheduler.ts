import { trustService } from './trust.service';
import { TRUST_RULES } from './trust.config';
import { logService } from '../logs/log.service';

const STARTUP_DELAY_MS = 10_000;

// Recalcule les indices de confiance au démarrage puis à intervalle régulier
export function startTrustScheduler(): void {
  const run = async () => {
    try {
      const summary = await trustService.runCycle();
      console.info(
        `[trust] ${summary.usersUpdated} indices recalculés, ` +
          `${summary.promoted.length} promotion(s), ${summary.demoted.length} rétrogradation(s), ` +
          `${summary.watchlist.length} modérateur(s) à surveiller`,
      );
    } catch (error) {
      console.error('[trust] recalcul impossible:', error);
      await logService.recordServerError(error, { context: { kind: 'trustScheduler' } });
    }
  };

  setTimeout(run, STARTUP_DELAY_MS);
  setInterval(run, TRUST_RULES.recomputeIntervalMinutes * 60 * 1000);
}
