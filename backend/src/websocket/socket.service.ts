import type { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import type { Socket } from 'socket.io';

export interface TipApprovedEvent {
  tipId: number;
  title: string;
  content: string;
  author: {
    id: number;
    username: string;
  };
  category: {
    id: number;
    name: string;
  };
  createdAt: Date;
}

export class SocketService {
  private io: SocketIOServer | null = null;

  initialize(httpServer: HttpServer): void {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    this.io.on('connection', (socket: Socket) => {
      console.log(`[WebSocket] Client connected: ${socket.id}`);

      socket.on('disconnect', () => {
        console.log(`[WebSocket] Client disconnected: ${socket.id}`);
      });
    });

    console.log('[WebSocket] Server initialized');
  }

  emitTipApproved(tipData: TipApprovedEvent): void {
    if (!this.io) {
      console.error('[WebSocket] Server not initialized');
      return;
    }

    this.io.emit('tip:approved', tipData);
    console.log(`[WebSocket] Tip approved event emitted for tip #${tipData.tipId}`);
  }

  emitTipRejected(tipId: number): void {
    if (!this.io) {
      console.error('[WebSocket] Server not initialized');
      return;
    }

    this.io.emit('tip:rejected', { tipId });
    console.log(`[WebSocket] Tip rejected event emitted for tip #${tipId}`);
  }

  getIO(): SocketIOServer | null {
    return this.io;
  }
}

export const socketService = new SocketService();
