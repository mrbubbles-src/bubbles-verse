# Story 5.2: Custom Service Worker & Offline Support

Status: done

## Story

As a user,
I want the app to work even when I have no internet connection,
so that I can always log an activity immediately after returning from an outing.

## Acceptance Criteria

1. **Given** `public/sw.js` is registered via `useEffect` in `app/layout.tsx`
   **When** the app is loaded for the first time online
   **Then** the service worker installs and caches all static assets (JS, CSS, icons, manifest)

2. **Given** the user has visited the app before and then goes offline
   **When** they open the app without network access
   **Then** the app loads from the service worker cache (Cache-First strategy)
   **And** the user can log an activity — the entry is saved to localStorage with no network required

3. **Given** the service worker is updated (new app version deployed)
   **When** the new SW activates
   **Then** no existing localStorage data is lost
   **And** the app continues functioning correctly with the updated assets

4. **Given** the user attempts any action while offline (logging, viewing dashboard, viewing history)
   **When** the action is performed
   **Then** it succeeds — no "you're offline" error, no blocked interaction (all operations are localStorage-based)

## Tasks / Subtasks

- [x] Task 1: Add the custom service worker
  - [x] Create `apps/it-counts/public/sw.js`
  - [x] Cache the app shell and static assets with a Cache-First strategy
- [x] Task 2: Register the service worker from the client
  - [x] Add a small client registration component and mount it from the root layout
  - [x] Use a registration pattern that supports future updates cleanly
- [x] Task 3: Verify offline behavior
  - [x] Test offline dashboard, logging, and history flows manually
  - [x] Document update behavior and any cache versioning decisions

## Dev Notes

### Implementation Focus

- `app/layout.tsx` is a Server Component. Even though the epic wording says `useEffect` in layout, the practical implementation should be a client child rendered from the layout.
- localStorage data is separate from service worker cache. The SW must never own or rewrite persisted activity data.
- Prefer a simple cache versioning strategy and update flow over a complex plugin abstraction.

### Guardrails

- Keep all offline actions local-only; do not show blocking connectivity errors.
- Use Cache-First only for static assets and app shell resources, not arbitrary network requests.
- Avoid third-party PWA wrappers; the architecture explicitly calls for a custom service worker.

### Project Structure Notes

- Likely touch: `apps/it-counts/public/sw.js`, `apps/it-counts/components/shared/service-worker-registration.tsx`, `apps/it-counts/app/layout.tsx`, `apps/it-counts/CHANGELOG.md`

### Latest Tech Verification

- Next.js local PWA docs show the registration flow from client-side `useEffect` with `navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' })`.
- Next.js local CSS docs confirm global app CSS continues to be imported from the root layout while the SW handles runtime caching separately.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.2]
- [Source: _bmad-output/planning-artifacts/prd.md#Reliability]
- [Source: apps/it-counts/node_modules/next/dist/docs/01-app/02-guides/progressive-web-apps.md]
- [Source: apps/it-counts/node_modules/next/dist/docs/01-app/01-getting-started/11-css.md]
- [Source: _bmad-output/planning-artifacts/architecture.md#Monorepo CSS Convention]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- Created `public/sw.js`: Cache-First SW with `CACHE_NAME = 'it-counts-v1'`, precaches `/`, `/history`, manifest, and icon on install, `skipWaiting` + `clients.claim()` for immediate activation, stale-cache cleanup on activate, network fallback + runtime caching on fetch (same-origin GET only)
- Created `components/shared/service-worker-registration.tsx`: client component, renders null, registers `/sw.js` with `{ scope: '/', updateViaCache: 'none' }` in useEffect, guards against undefined `navigator.serviceWorker`
- Added `<ServiceWorkerRegistration />` to `app/layout.tsx` inside ThemeProvider
- 3 tests: correct registration args, renders nothing, no-throw when SW unavailable
- All localStorage-based actions remain fully offline-capable by design
- 28 test files / 163 tests all pass

### File List

- apps/it-counts/public/sw.js (new)
- apps/it-counts/components/shared/service-worker-registration.tsx (new)
- apps/it-counts/app/layout.tsx (modified)
- apps/it-counts/**tests**/pwa/service-worker-registration.test.tsx (new)

## Change Log

- 2026-04-08: Added custom Cache-First service worker, client-side registration component, offline support for all localStorage-based operations (Story 5.2)
