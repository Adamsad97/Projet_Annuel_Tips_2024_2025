import { io, type Socket } from 'socket.io-client';
import { storage } from '~/utils/storage';

interface TipApprovedEvent {
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

interface TipRejectedEvent {
  tipId: number;
}

interface BadgeUnlockedEvent {
  badgeId: number;
  badge: {
    id: number;
    name: string;
    description: string;
    icon: string;
    xpReward: number;
  };
  userId: number;
}

export const useWebSocket = () => {
  const socket = ref<Socket | null>(null);
  const connected = ref(false);
  const error = ref<string | null>(null);

  const connect = () => {
    const config = useRuntimeConfig();
    const backendUrl = (config.public.backendUrl as string) || 'http://localhost:3001';
    const token = storage.getAccessToken();

    console.log('[WebSocket] Connecting to:', backendUrl);
    console.log('[WebSocket] Auth token:', token ? 'Present' : 'Missing');

    socket.value = io(backendUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      auth: {
        token: token,
      },
    });

    socket.value.on('connect', () => {
      connected.value = true;
      error.value = null;
      console.log('[WebSocket] Connected successfully');
      console.log('[WebSocket] Socket ID:', socket.value?.id);
    });

    socket.value.on('disconnect', () => {
      connected.value = false;
      console.log('[WebSocket] Disconnected');
    });

    socket.value.on('connect_error', (err) => {
      error.value = err.message;
      console.error('[WebSocket] Connection error:', err.message);
    });
  };

  const disconnect = () => {
    if (socket.value) {
      socket.value.disconnect();
      socket.value = null;
      connected.value = false;
    }
  };

  const onTipApproved = (callback: (tip: TipApprovedEvent) => void) => {
    if (!socket.value) {
      console.warn('[WebSocket] Socket not initialized');
      return;
    }

    socket.value.on('tip:approved', (data: TipApprovedEvent) => {
      console.log('[WebSocket] Tip approved:', data.tipId);
      callback(data);
    });
  };

  const onTipRejected = (callback: (data: TipRejectedEvent) => void) => {
    if (!socket.value) {
      console.warn('[WebSocket] Socket not initialized');
      return;
    }

    socket.value.on('tip:rejected', (data: TipRejectedEvent) => {
      console.log('[WebSocket] Tip rejected:', data.tipId);
      callback(data);
    });
  };

  const onBadgeUnlocked = (callback: (data: BadgeUnlockedEvent) => void) => {
    if (!socket.value) {
      console.warn('[WebSocket] Socket not initialized - cannot listen for badge events');
      return;
    }

    console.log('[WebSocket] Listening for badge:unlocked events');

    socket.value.on('badge:unlocked', (data: BadgeUnlockedEvent) => {
      console.log('[WebSocket] Badge unlocked event received!');
      console.log('[WebSocket] Badge data:', {
        badgeId: data.badgeId,
        badgeName: data.badge.name,
        userId: data.userId,
        xpReward: data.badge.xpReward,
      });
      callback(data);
    });
  };

  const off = (event: string) => {
    if (socket.value) {
      socket.value.off(event);
    }
  };

  onUnmounted(() => {
    disconnect();
  });

  return {
    socket,
    connected,
    error,
    connect,
    disconnect,
    onTipApproved,
    onTipRejected,
    onBadgeUnlocked,
    off,
  };
};
