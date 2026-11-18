// Service worker des notifications push : affiche les notifications envoyées par l'API,
// même quand aucun onglet de l'application n'est ouvert.

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : '' };
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Onglet au premier plan : la notification s'affiche déjà dans l'application
      if (clients.some((client) => client.focused)) return undefined;

      return self.registration.showNotification(data.title || 'TipsTop', {
        body: data.body || '',
        icon: '/Logo.svg',
        badge: '/Logo.svg',
        data: { link: data.link || '/' },
      });
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.link || '/', self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Réutilise un onglet déjà ouvert sur le site plutôt que d'en ouvrir un nouveau
      const client = clients.find((c) => c.url.startsWith(self.location.origin));
      if (client) {
        return client.focus().then(() => client.navigate(url));
      }
      return self.clients.openWindow(url);
    }),
  );
});
