import { API_ROUTES } from '~/config/api';

// unsupported : navigateur sans push (ou page non sécurisée)
// unavailable : l'API n'a pas de clés VAPID configurées
// denied      : notifications bloquées dans le navigateur
export type PushStatus = 'unsupported' | 'unavailable' | 'denied' | 'disabled' | 'enabled';

const SERVICE_WORKER_URL = '/sw.js';

// La clé VAPID est en base64 « url-safe » ; le navigateur attend des octets
function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

function isSupported(): boolean {
  return (
    import.meta.client &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export function usePushNotifications() {
  const api = useApi();
  const status = useState<PushStatus>('push-status', () => 'disabled');
  const busy = ref(false);

  async function getRegistration() {
    return (
      (await navigator.serviceWorker.getRegistration(SERVICE_WORKER_URL)) ??
      navigator.serviceWorker.register(SERVICE_WORKER_URL)
    );
  }

  async function getPublicKey(): Promise<string | null> {
    try {
      const { publicKey } = await api.get<{ publicKey: string }>(
        API_ROUTES.NOTIFICATIONS.PUSH_PUBLIC_KEY,
        { skipAuth: true, showErrorToast: false },
      );
      return publicKey;
    } catch {
      return null;
    }
  }

  async function saveSubscription(subscription: PushSubscription) {
    await api.post(API_ROUTES.NOTIFICATIONS.PUSH_SUBSCRIPTIONS, subscription.toJSON(), {
      showErrorToast: false,
    });
  }

  // Lit l'état réel du navigateur ; si l'abonnement existe, le renvoie à l'API
  // (il a pu être supprimé côté serveur après expiration)
  async function refresh(): Promise<void> {
    if (!isSupported()) {
      status.value = 'unsupported';
      return;
    }
    if (Notification.permission === 'denied') {
      status.value = 'denied';
      return;
    }

    const registration = await navigator.serviceWorker.getRegistration(SERVICE_WORKER_URL);
    const subscription = await registration?.pushManager.getSubscription();
    if (!subscription) {
      status.value = (await getPublicKey()) ? 'disabled' : 'unavailable';
      return;
    }

    status.value = 'enabled';
    await saveSubscription(subscription).catch(() => undefined);
  }

  async function enable(): Promise<boolean> {
    if (!isSupported() || busy.value) return false;
    busy.value = true;
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        status.value = permission === 'denied' ? 'denied' : 'disabled';
        return false;
      }

      const publicKey = await getPublicKey();
      if (!publicKey) {
        status.value = 'unavailable';
        return false;
      }

      const registration = await getRegistration();
      await navigator.serviceWorker.ready;
      const subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        }));

      await saveSubscription(subscription);
      status.value = 'enabled';
      return true;
    } finally {
      busy.value = false;
    }
  }

  // Appelé aussi à la déconnexion : un autre membre sur ce navigateur ne doit rien recevoir
  async function disable(): Promise<void> {
    if (!isSupported()) return;
    busy.value = true;
    try {
      const registration = await navigator.serviceWorker.getRegistration(SERVICE_WORKER_URL);
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        await api
          .delete(API_ROUTES.NOTIFICATIONS.PUSH_SUBSCRIPTIONS, {
            body: { endpoint: subscription.endpoint },
            showErrorToast: false,
          })
          .catch(() => undefined);
        await subscription.unsubscribe();
      }
      if (status.value === 'enabled') status.value = 'disabled';
    } finally {
      busy.value = false;
    }
  }

  return { status, busy, refresh, enable, disable };
}
