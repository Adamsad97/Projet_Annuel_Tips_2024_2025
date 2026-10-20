import { createServer } from 'http';
import app from './app';
import { env } from './config/env';
import { socketService } from './websocket/socket.service';
import { startTrustScheduler } from './modules/trust/trust.scheduler';
import { logService } from './modules/logs/log.service';

const PORT = env.PORT;
const HOST = env.HOST;

// Erreurs hors requête : enregistrées dans les logs centralisés
process.on('unhandledRejection', (reason) => {
  console.error('[process] unhandled rejection:', reason);
  void logService.recordServerError(reason, { context: { kind: 'unhandledRejection' } });
});
process.on('uncaughtException', async (error) => {
  console.error('[process] uncaught exception:', error);
  await logService.recordServerError(error, { context: { kind: 'uncaughtException' } });
  process.exit(1);
});

const httpServer = createServer(app);

socketService.initialize(httpServer);

if (env.NODE_ENV !== 'test') {
  startTrustScheduler();
}

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running at http://${HOST}:${PORT}`);
  console.log(`🔌 WebSocket ready for real-time updates`);
});
