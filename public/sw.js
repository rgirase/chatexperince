/**
 * Minimal Production-Ready Service Worker
 * 
 * - Caches app shell on install for offline support
 * - Uses network-first strategy so updates always come through
 * - Required for Android PWA standalone mode ("Add to Home Screen")
 */
const CACHE_NAME = 'aura-app-v1';
const PRECACHE_URLS = ['/', '/index.html'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
});

self.addEventListener('activate', (event) => {
  // Remove old caches from previous versions
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Network-first: always try network, fall back to cache
  // This ensures users always get the latest code
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful GET responses for the app shell
        if (response.ok && event.request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
