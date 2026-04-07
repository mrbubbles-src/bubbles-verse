import type { MetadataRoute } from 'next'

/**
 * Web App Manifest for PWA installability.
 * Icons must be placed at `public/icons/icon-192.png` and `public/icons/icon-512.png`.
 * `theme_color` uses a hex approximation of the app's primary dark background (OKLCH → #1e1e2e).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'It Counts',
    short_name: 'It Counts',
    description: 'Track your movement and watch your level grow — one walk at a time.',
    start_url: '/',
    display: 'standalone',
    background_color: '#1e1e2e',
    theme_color: '#1e1e2e',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
