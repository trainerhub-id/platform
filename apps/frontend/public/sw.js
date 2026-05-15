// Novu Push Notification Service Worker
self.addEventListener('push', (event) => {
  if (!event.data) {
    console.log('Push event but no data');
    return;
  }

  try {
    const data = event.data.json();
    console.log('[Service Worker] Push notification received:', data);

    const options = {
      body: data.body || data.content || 'You have a new notification',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: data.id || 'notification',
      data: data,
      requireInteraction: false,
      actions: data.actions || []
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'TrainerHub', options)
    );
  } catch (error) {
    console.error('[Service Worker] Error parsing push notification:', error);
  }
});

self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click:', event);
  event.notification.close();

  // Open or focus the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window/tab open
      for (let client of clientList) {
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, open a new window
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('[Service Worker] Push subscription changed');
  // Handle subscription refresh
  event.waitUntil(
    self.registration.pushManager.subscribe(event.oldSubscription.options)
      .then((subscription) => {
        console.log('[Service Worker] Subscription refreshed:', subscription);
      })
  );
});

console.log('[Service Worker] Loaded and ready');
