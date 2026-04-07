# Story 5.2: Custom Service Worker & Offline Support

Status: ready-for-dev

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

- [ ] Task 1: Add the custom service worker
  - [ ] Create `apps/it-counts/public/sw.js`
  - [ ] Cache the app shell and static assets with a Cache-First strategy
- [ ] Task 2: Register the service worker from the client
  - [ ] Add a small client registration component and mount it from the root layout
  - [ ] Use a registration pattern that supports future updates cleanly
- [ ] Task 3: Verify offline behavior
  - [ ] Test offline dashboard, logging, and history flows manually
  - [ ] Document update behavior and any cache versioning decisions

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

GPT-5 Codex

### Debug Log References

### Completion Notes List

### File List
