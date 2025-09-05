/* Minimal service worker for Firebase Cloud Messaging (Web Push)
 * Notifications sent with a `notification` payload will be displayed by the browser.
 * This file enables background delivery. Optional click handling below.
 */

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification?.data?.link || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});


