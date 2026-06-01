// Minimal service worker for PWA install criteria.
const CACHE = 'afribit-sats-v1'
self.addEventListener('install', (e) => {
  self.skipWaiting()
})
self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim())
})
self.addEventListener('fetch', (e) => {
  // Network-first for navigation, cache app shell as fallback.
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() => caches.match('/'))
    )
    return
  }
})
