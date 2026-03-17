/**
 * Pass-through Service Worker — no caching, pure network.
 * Registered only so the PWA manifest is recognized by Chrome,
 * but it never serves stale content.
 */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (e) => e.respondWith(fetch(e.request)));
