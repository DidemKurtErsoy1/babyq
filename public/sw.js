// public/sw.js
// Conservative offline support for the PWA.
//
// Principles:
// - Never touch /api, non-GET, or cross-origin requests — they pass straight
//   through, so answers/auth are always live and never served stale.
// - Navigations: network-first, falling back to cache only when offline, so an
//   online user always gets fresh content (important for a health app).
// - Hashed static assets (/_next/static/*): cache-first, since they're
//   immutable by content hash.

const VERSION = 'babyq-v2';
const OFFLINE_URL = '/';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION).then((cache) => cache.addAll([OFFLINE_URL, '/manifest.json']))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle same-origin GET requests; leave everything else (API, auth,
  // POST, cross-origin analytics/AI) completely untouched.
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  // Immutable hashed assets → cache-first.
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            const copy = res.clone();
            caches.open(VERSION).then((c) => c.put(req, copy));
            return res;
          })
      )
    );
    return;
  }

  // Page navigations → network-first with offline cache fallback.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((hit) => hit || caches.match(OFFLINE_URL)))
    );
  }
});
