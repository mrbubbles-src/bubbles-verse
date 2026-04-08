'use client'

import { useEffect } from 'react'

const SERVICE_WORKER_URL = '/sw.js'
const CACHE_PREFIX = 'it-counts-'

/**
 * Collects every possible worker script URL attached to a registration.
 *
 * @param {ServiceWorkerRegistration} registration Registration being inspected.
 * @returns {string[]} Known script URLs for active, waiting, or installing workers.
 */
function getRegistrationScriptUrls(
  registration: ServiceWorkerRegistration,
): string[] {
  return [
    registration.active?.scriptURL,
    registration.waiting?.scriptURL,
    registration.installing?.scriptURL,
  ].filter((scriptUrl): scriptUrl is string => Boolean(scriptUrl))
}

/**
 * Matches only the custom It Counts worker so other registrations remain intact.
 *
 * @param {ServiceWorkerRegistration} registration Registration being inspected.
 * @returns {boolean} True when the registration points at `/sw.js`.
 */
function isItCountsServiceWorker(
  registration: ServiceWorkerRegistration,
): boolean {
  return getRegistrationScriptUrls(registration).some((scriptUrl) => {
    const url = new URL(scriptUrl)
    return url.pathname === SERVICE_WORKER_URL
  })
}

/**
 * Removes stale It Counts caches that could survive across local dev reloads.
 *
 * @returns {Promise<void>} Cleanup promise.
 */
async function clearItCountsCaches(): Promise<void> {
  if (!('caches' in globalThis)) {
    return
  }

  const keys = await caches.keys()
  await Promise.all(
    keys
      .filter((key) => key.startsWith(CACHE_PREFIX))
      .map((key) => caches.delete(key)),
  )
}

/**
 * Unregisters only the It Counts service worker registrations for the current origin.
 *
 * @returns {Promise<void>} Cleanup promise.
 */
async function unregisterItCountsServiceWorkers(): Promise<void> {
  if (
    typeof navigator === 'undefined' ||
    !navigator.serviceWorker ||
    typeof navigator.serviceWorker.getRegistrations !== 'function'
  ) {
    return
  }

  const registrations = await navigator.serviceWorker.getRegistrations()
  await Promise.all(
    registrations
      .filter(isItCountsServiceWorker)
      .map((registration) => registration.unregister()),
  )
}

/**
 * Registers the custom service worker in production and prunes stale worker
 * state in non-production environments.
 * Renders nothing — purely a side-effect component for SW lifecycle management.
 * Silently skips work when the Service Worker API is unavailable
 * (e.g. non-HTTPS environments, older browsers).
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.serviceWorker) {
      return
    }

    if (process.env.NODE_ENV !== 'production') {
      void unregisterItCountsServiceWorkers()
      void clearItCountsCaches()
      return
    }

    navigator.serviceWorker.register(SERVICE_WORKER_URL, {
      scope: '/',
      updateViaCache: 'none',
    })
  }, [])

  return null
}
