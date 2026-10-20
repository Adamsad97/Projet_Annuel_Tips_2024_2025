import type { AppNotification } from '~/types';
import { API_ROUTES } from '~/config/api';

// État partagé entre la cloche du header et les pages (via useState)
export function useNotifications() {
  const api = useApi();
  const items = useState<AppNotification[]>('notifications:items', () => []);
  const unreadCount = useState<number>('notifications:unread', () => 0);

  async function fetchNotifications() {
    try {
      const data = await api.get<{ items: AppNotification[]; unreadCount: number }>(
        API_ROUTES.NOTIFICATIONS.LIST,
        { showErrorToast: false },
      );
      items.value = data.items;
      unreadCount.value = data.unreadCount;
    } catch {
      // la cloche reste vide si la requête échoue
    }
  }

  function addNotification(notification: AppNotification) {
    items.value = [notification, ...items.value.filter((n) => n.id !== notification.id)];
    if (!notification.readAt) unreadCount.value += 1;
  }

  async function markRead(notification: AppNotification) {
    if (notification.readAt) return;

    try {
      const updated = await api.patch<AppNotification>(
        API_ROUTES.NOTIFICATIONS.READ(notification.id),
        undefined,
        { showErrorToast: false },
      );
      items.value = items.value.map((n) => (n.id === updated.id ? updated : n));
      unreadCount.value = Math.max(0, unreadCount.value - 1);
    } catch {
      // sans gravité
    }
  }

  async function markAllRead() {
    try {
      await api.post(API_ROUTES.NOTIFICATIONS.READ_ALL);
      const now = new Date().toISOString();
      items.value = items.value.map((n) => ({ ...n, readAt: n.readAt ?? now }));
      unreadCount.value = 0;
    } catch {
      // l'erreur est déjà affichée par useApi
    }
  }

  function reset() {
    items.value = [];
    unreadCount.value = 0;
  }

  return { items, unreadCount, fetchNotifications, addNotification, markRead, markAllRead, reset };
}
