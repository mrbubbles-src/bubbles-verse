'use client'

import { useEffect } from 'react'

/**
 * Registers the custom service worker (`/sw.js`) once on client mount.
 * Renders nothing — purely a side-effect component for SW lifecycle management.
 * Silently skips registration when the Service Worker API is unavailable
 * (e.g. non-HTTPS environments, older browsers).
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.serviceWorker) {
      return
    }

    navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none',
    })
  }, [])

  return null
}
