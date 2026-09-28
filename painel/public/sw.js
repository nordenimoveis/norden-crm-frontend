/*
 * Service Worker do Norden CRM.
 * Responsabilidade única: receber notificações Web Push e abrir o lead certo
 * quando o usuário toca na notificação — funciona com o CRM fechado.
 * Não faz cache de páginas (o painel é uma ferramenta de trabalho, sempre online).
 */

self.addEventListener('install', () => {
  // Assume o controle assim que instala (sem esperar recarregar a aba).
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: 'Norden CRM', body: event.data ? event.data.text() : '' };
  }

  const title = payload.title || 'Norden CRM';
  const options = {
    body: payload.body || '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: payload.tag || 'norden',
    // Notificações novas de leads diferentes não se sobrepõem; a do mesmo lead sim.
    renotify: true,
    // Não silenciosa + vibração: dá o alerta físico mesmo antes de o usuário
    // ajustar o som do canal no Android. O som em si segue o canal do sistema.
    silent: false,
    vibrate: [200, 100, 200],
    data: { url: payload.url || '/kanban' },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || '/kanban';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Se já houver uma aba do CRM aberta, foca e navega nela.
      for (const client of clients) {
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client) {
            client.navigate(target).catch(() => {});
          }
          return;
        }
      }
      // Senão, abre uma nova.
      if (self.clients.openWindow) return self.clients.openWindow(target);
    }),
  );
});
