import { createServer } from 'http';
import app from './app';
import { env } from './config/env';
import { socketService } from './websocket/socket.service';

const PORT = env.PORT;
const HOST = env.HOST;

const httpServer = createServer(app);

socketService.initialize(httpServer);

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running at http://${HOST}:${PORT}`);
  console.log(`🔌 WebSocket ready for real-time updates`);
});
