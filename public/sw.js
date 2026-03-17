/**
 * KILL SWITCH Service Worker
 * 
 * This SW's only job is to unregister itself and clear ALL caches.
 * This permanently fixes the "blank black screen" issue caused by a
 * previous rogue service worker serving stale content.
 */
self.addEventListener('install', (event) => {
  // Force this new SW to become active immediately, bypassing the waiting phase
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    // Step 1: Delete every cache stored by any previous SW version
    caches.keys()
      .then((cacheNames) => Promise.all(cacheNames.map((name) => caches.delete(name))))
      .then(() => {
        console.log('[SW] All caches cleared successfully.');
        // Step 2: Take control of all open tabs immediately
        return self.clients.claim();
      })
      .then(() => {
        // Step 3: Unregister THIS service worker so it never runs again
        return self.registration.unregister();
      })
      .then(() => {
        console.log('[SW] Service Worker unregistered. App will now load fresh from the network.');
      })
  );
});

// Let all fetches go directly to the network — no caching at all
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
