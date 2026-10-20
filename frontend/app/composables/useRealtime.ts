import { io, type Socket } from 'socket.io-client';
import { storage } from '~/utils/storage';

// Connexion unique partagée par toute l'application (côté client uniquement).
// Authentifiée par le token : le serveur place le socket dans la room privée de l'utilisateur
// pour les messages et notifications.
let socket: Socket | null = null;

function getSocket(): Socket | null {
  if (import.meta.server) return null;

  if (!socket) {
    const config = useRuntimeConfig();
    const backendUrl = (config.public.backendUrl as string) || 'http://localhost:3001';

    socket = io(backendUrl, {
      transports: ['websocket', 'polling'],
      reconnectionDelayMax: 5000,
      // Relu à chaque (re)connexion pour utiliser le token rafraîchi
      auth: (cb) => cb({ token: storage.getAccessToken() }),
    });
  }

  return socket;
}

export function useRealtime() {
  // Abonnement à un événement ; renvoie la fonction de désabonnement
  function on<T>(event: string, handler: (payload: T) => void): () => void {
    const s = getSocket();
    if (!s) return () => {};

    s.on(event, handler);
    return () => s.off(event, handler);
  }

  // À appeler après connexion / déconnexion pour changer d'identité côté serveur
  function reconnect() {
    const s = getSocket();
    if (!s) return;
    s.disconnect();
    s.connect();
  }

  function disconnect() {
    socket?.disconnect();
  }

  return { on, reconnect, disconnect };
}
