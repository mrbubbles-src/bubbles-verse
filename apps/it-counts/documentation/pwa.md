# PWA

## Manifest

The app manifest lives at [`../app/manifest.json`](../app/manifest.json).

Current behavior:

- standalone display mode
- `start_url: "/"`
- maskable 192x192 and 512x512 icons
- dark Catppuccin-aligned theme/background colors

## Service worker

The custom worker lives at [`../public/sw.js`](../public/sw.js).

Design goals:

- cache stable public assets
- do not pin stale `/_next/*` build assets
- do not serve stale HTML cache-first
- keep offline fallback behavior for navigations when possible

## Registration

Registration happens in [`../components/shared/service-worker-registration.tsx`](../components/shared/service-worker-registration.tsx).

Behavior:

- production: register `/sw.js`
- non-production: unregister old It Counts workers and delete `it-counts-*` caches

That cleanup is intentional. It keeps local design and UI changes visible after a normal reload.

## Cached assets

The worker precaches explicit stable assets such as:

- manifest
- icons
- logo files

It does not cache the Next build output under `/_next/*`.
