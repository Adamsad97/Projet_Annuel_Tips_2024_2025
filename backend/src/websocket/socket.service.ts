import type { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import type { Socket } from 'socket.io';
import { verifyAccessTokenOrThrow } from '../utils/jwt.util';

// Room privée d'un utilisateur : seuls ses sockets authentifiés la rejoignent
export const userRoom = (userId: number): string => `user:${userId}`;

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

    // Le token est optionnel : sans token, le client reçoit seulement les événements publics
    this.io.use((socket, next) => {
      const token = socket.handshake.auth?.token;
      if (typeof token === 'string' && token.length > 0) {
        try {
          socket.data.userId = verifyAccessTokenOrThrow(token).id;
        } catch {
          socket.data.userId = undefined;
        }
      }
      next();
    });

    this.io.on('connection', (socket: Socket) => {
      console.log(`[WebSocket] Client connected: ${socket.id}`);

      if (socket.data.userId) {
        socket.join(userRoom(socket.data.userId));
      }

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

  // Événement privé (message, notification…) envoyé à tous les onglets d'un utilisateur
  emitToUser(userId: number, event: string, payload: unknown): void {
    this.io?.to(userRoom(userId)).emit(event, payload);
  }

  getIO(): SocketIOServer | null {
    return this.io;
  }
}

export const socketService = new SocketService();
