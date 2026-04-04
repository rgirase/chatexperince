// NUCLEAR KILL SWITCH SERVICE WORKER v101
// Purpose: Immediately clear all caches and unregister to prevent stale-cache blank screens or refresh loops.

self.addEventListener('install', (event) => {
  console.log('[SW] Nuclear Install - Version 101');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('[SW] Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      console.log('[SW] Caches cleared. Unregistering self...');
      return self.registration.unregister();
    }).then(() => {
      console.log('[SW] Unregistration complete.');
      return self.clients.matchAll();
    }).then((clients) => {
      // Optional: don't reload automatically to avoid refresh loops
      // clients.forEach(client => client.navigate(client.url));
    })
  );
});

// Standard fetch listener to pass-through while the SW is still "active"
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});

