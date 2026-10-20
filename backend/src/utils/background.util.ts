import { logService } from '../modules/logs/log.service';

// Tâches lancées après la réponse HTTP (recalculs, écriture de logs...).
// Elles sont suivies pour pouvoir attendre leur fin (arrêt propre, fin des tests)
// et leurs erreurs sont envoyées dans les logs centralisés au lieu d'être perdues.
const pending = new Set<Promise<void>>();

export function runInBackground(label: string, task: () => Promise<unknown>): void {
  const promise: Promise<void> = Promise.resolve()
    .then(task)
    .then(() => undefined)
    .catch((error) =>
      logService.recordServerError(error, { context: { kind: 'background', label } }),
    )
    .finally(() => {
      pending.delete(promise);
    });
  pending.add(promise);
}

// Attend la fin de toutes les tâches en cours (y compris celles lancées entre-temps)
export async function flushBackgroundTasks(): Promise<void> {
  while (pending.size > 0) {
    await Promise.allSettled([...pending]);
  }
}
