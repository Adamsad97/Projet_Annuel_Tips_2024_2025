import { SocketService } from '../../../websocket/socket.service';
import { Server as HttpServer } from 'http';
import type { Server as SocketIOServer } from 'socket.io';

describe('SocketService', () => {
  let socketService: SocketService;
  let mockHttpServer: HttpServer;
  let mockIO: jest.Mocked<SocketIOServer>;

  beforeEach(() => {
    socketService = new SocketService();
    mockHttpServer = {} as HttpServer;
    mockIO = {
      emit: jest.fn(),
      on: jest.fn(),
    } as unknown as jest.Mocked<SocketIOServer>;
  });

  describe('emitTipApproved', () => {
    it('emet tip:approved avec data correcte', () => {
      (socketService as unknown as { io: SocketIOServer }).io = mockIO;

      const tipData = {
        tipId: 123,
        title: 'Test Tip',
        content: 'Test content',
        author: { id: 1, username: 'testuser' },
        category: { id: 2, name: 'Tech' },
        createdAt: new Date(),
      };

      socketService.emitTipApproved(tipData);

      expect(mockIO.emit).toHaveBeenCalledWith('tip:approved', tipData);
      expect(mockIO.emit).toHaveBeenCalledTimes(1);
    });

    it('log erreur si io non initialise', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const tipData = {
        tipId: 123,
        title: 'Test Tip',
        content: 'Test content',
        author: { id: 1, username: 'testuser' },
        category: { id: 2, name: 'Tech' },
        createdAt: new Date(),
      };

      socketService.emitTipApproved(tipData);

      expect(consoleSpy).toHaveBeenCalledWith('[WebSocket] Server not initialized');
      consoleSpy.mockRestore();
    });
  });

  describe('emitTipRejected', () => {
    it('emet tip:rejected avec tipid', () => {
      (socketService as unknown as { io: SocketIOServer }).io = mockIO;

      socketService.emitTipRejected(456);

      expect(mockIO.emit).toHaveBeenCalledWith('tip:rejected', { tipId: 456 });
      expect(mockIO.emit).toHaveBeenCalledTimes(1);
    });

    it('log erreur si io non initialise', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      socketService.emitTipRejected(456);

      expect(consoleSpy).toHaveBeenCalledWith('[WebSocket] Server not initialized');
      consoleSpy.mockRestore();
    });
  });

  describe('getIO', () => {
    it('retourne null si non initialise', () => {
      expect(socketService.getIO()).toBeNull();
    });

    it('retourne instance io si initialise', () => {
      (socketService as unknown as { io: SocketIOServer }).io = mockIO;
      expect(socketService.getIO()).toBe(mockIO);
    });
  });
});
