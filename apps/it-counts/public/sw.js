/**
 * It Counts — Custom Service Worker
 * Cache-First strategy for the app shell and static assets.
 * localStorage data is untouched — the SW never owns persisted activity data.
 */

const CACHE_NAME = 'it-counts-v1'

/**
 * App shell resources cached on install.
 * Next.js serves JS/CSS chunks at _next/static; the manifest and icons are in public.
 */
const PRECACHE_URLS = [
  '/',
  '/history',
  '/manifest.json',
  '/web-app-manifest-192x192.png',
  '/web-app-manifest-512x512.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)),
  )
  // Activate immediately without waiting for existing tabs to close
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  // Remove stale caches from previous SW versions
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))),
    ),
  )
  // Take control of uncontrolled clients immediately
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  // Only intercept same-origin GET requests
  if (event.request.method !== 'GET') return
  if (!event.request.url.startsWith(self.location.origin)) return

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached

      // Not in cache — fetch from network and cache the response
      return fetch(event.request).then((response) => {
        // Only cache valid responses; skip opaque/error responses
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response
        }

        const toCache = response.clone()
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, toCache))
        return response
      })
    }),
  )
})
