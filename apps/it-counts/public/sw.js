/**
 * It Counts — Custom Service Worker
 * Keeps stable public assets available offline without pinning stale HTML or
 * Next.js build artifacts across deploys and reloads.
 */

const CACHE_PREFIX = 'it-counts-'
const STATIC_CACHE_NAME = 'it-counts-static-v2'
const PAGE_CACHE_NAME = 'it-counts-pages-v1'

/**
 * Only explicit, stable public assets are precached.
 * Route HTML and `/_next/*` assets stay network-owned so reloads always see the
 * current app shell and current build graph.
 */
const STATIC_ASSET_PATHS = [
  '/manifest.json',
  '/apple-icon.png',
  '/favicon.ico',
  '/icon1.png',
  '/images/it-counts-logo.png',
  '/images/it-counts-logo.webp',
  '/web-app-manifest-192x192.png',
  '/web-app-manifest-512x512.png',
]

const ACTIVE_CACHE_NAMES = new Set([STATIC_CACHE_NAME, PAGE_CACHE_NAME])

/**
 * Limits SW caching to explicit, version-stable public files.
 *
 * @param {string} pathname Same-origin request pathname.
 * @returns {boolean} True when the asset should be served through the static cache.
 */
function isStaticAssetPath(pathname) {
  return STATIC_ASSET_PATHS.includes(pathname)
}

/**
 * Detects App Router document navigations that should prefer the network.
 *
 * @param {Request} request Incoming fetch request.
 * @returns {boolean} True when the request is a page navigation.
 */
function isNavigationRequest(request) {
  return request.mode === 'navigate'
}

/**
 * Stores successful responses in the provided cache without blocking the caller.
 *
 * @param {string} cacheName Target cache bucket.
 * @param {Request} request Original request.
 * @param {Response} response Successful network response.
 * @returns {Promise<void>} Cache write promise.
 */
async function cacheResponse(cacheName, request, response) {
  if (!response || !response.ok || response.type === 'opaque') {
    return
  }

  const cache = await caches.open(cacheName)
  await cache.put(request, response.clone())
}

/**
 * Keeps navigations fresh while still allowing offline fallback when available.
 *
 * @param {Request} request Navigation request.
 * @returns {Promise<Response>} Network response or cached offline fallback.
 */
async function networkFirstPage(request) {
  try {
    const response = await fetch(request)
    await cacheResponse(PAGE_CACHE_NAME, request, response)
    return response
  } catch {
    const cached = await caches.match(request)
    if (cached) {
      return cached
    }

    return new Response('Offline', {
      status: 503,
      statusText: 'Offline',
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }
}

/**
 * Uses the cache for stable public files and refreshes it on first access.
 *
 * @param {Request} request Static asset request.
 * @returns {Promise<Response>} Cached or freshly fetched asset response.
 */
async function cacheFirstStaticAsset(request) {
  const cached = await caches.match(request)
  if (cached) {
    return cached
  }

  const response = await fetch(request)
  await cacheResponse(STATIC_CACHE_NAME, request, response)
  return response
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSET_PATHS)),
  )
  // Activate immediately without waiting for existing tabs to close
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  // Remove stale caches from previous SW versions
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && !ACTIVE_CACHE_NAMES.has(key))
          .map((key) => caches.delete(key)),
      ),
    ),
  )
  // Take control of uncontrolled clients immediately
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  // Only intercept same-origin GET requests
  if (event.request.method !== 'GET') return
  if (!event.request.url.startsWith(self.location.origin)) return

  const url = new URL(event.request.url)

  if (url.pathname.startsWith('/_next/')) {
    return
  }

  if (isNavigationRequest(event.request)) {
    event.respondWith(networkFirstPage(event.request))
    return
  }

  if (isStaticAssetPath(url.pathname)) {
    event.respondWith(cacheFirstStaticAsset(event.request))
  }
})
