# Dashboard

`dashboard` is the new shared dashboard app inside the Bubbles Verse monorepo.
At the moment it is intentionally still a scaffold: the app shell, workspace
wiring, and shared package integration are in place so feature work can start on
a clean base.

## Stack

- Next.js 16 App Router
- React 19
- Tailwind CSS 4
- Shared workspace packages from `@bubbles/*`

## Current scope

- `/login` starts the owner-only GitHub OAuth flow through Supabase.
- `/` now renders the first protected dashboard home inside the shared sidebar shell.
- The shared shell already uses `BubblesSidebar`, the shared app header, theme toggle, and footer.
- Placeholder protected routes exist for `/account`, `/vault`, `/vault/categories`, `/vault/entries`, and `/vault/entries/new`.
- `/account` now lets Owners manage the private dashboard allowlist, including `dashboard_access` and `user_role`.
- Shared fonts, globals, theme provider, and toast host are wired in.
- The app is configured to consume shared source packages from the monorepo.

## Run locally

From the monorepo root:

```bash
bun install
bunx turbo dev --filter=dashboard
```

From the app folder:

```bash
cd apps/dashboard
bun run dev
```

The checked-in `dev` script binds to `http://dashboard.mrbubbles.test:3004`.

## Quality checks

```bash
cd apps/dashboard
bun run test:run
bun run lint
bun run typecheck
bun run build
```

## Shared packages

- `@bubbles/ui` - shared globals, fonts, shadcn-style primitives, utilities
- `@bubbles/theme` - shared theme provider and theming behavior
- `@bubbles/footer` - shared footer package available for app-shell use
- `@bubbles/eslint-config` - shared lint configuration
- `@bubbles/typescript-config` - shared TypeScript baseline

## Environment

```env
NEXT_PUBLIC_APP_URL=http://dashboard.mrbubbles.test:3004
NEXT_PUBLIC_AUTH_COOKIE_DOMAIN=.mrbubbles.test
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
DATABASE_URL=...
```

`NEXT_PUBLIC_AUTH_COOKIE_DOMAIN` is optional. When it is omitted, the dashboard
derives a shared parent domain from `NEXT_PUBLIC_APP_URL`, which works for
hosts like `dashboard.mrbubbles.test` and `dashboard.mrbubbles-src.dev`.

If you change `NEXT_PUBLIC_*` values while `next dev` is already running,
restart the dashboard dev server so the browser bundle picks up the new values.

The dashboard UI no longer depends on `GITHUB_OWNER_ALLOWLIST` for secure route
checks. Access now comes from the private Supabase table
`private.dashboard_github_allowlist`, which should also back your Supabase auth
hooks.

## Auth flow

- `proxy.ts` handles the fast, optimistic redirect between `/login` and the protected dashboard routes.
- GitHub OAuth returns to `/auth/callback`, where the PKCE auth code is exchanged for the dashboard session cookie before redirecting to `/`.
- `requireDashboardSession()` remains the authoritative secure check and logs out stale or unauthorized sessions on the server.
- `requireOwnerSession()` builds on top of that DB-backed session check and protects owner-only routes like `/account`.
- the server-side identity fallback still accepts the GitHub username from `user_metadata` when Supabase does not populate `identities`
- The login page keeps Supabase auth errors neutral and does not expose that access is controlled by an internal allowlist.
- A one-time success toast is only shown after a real GitHub OAuth round-trip, not when an already valid session is redirected away from `/login`.

## Account access management

- `/account` is Owner-only and reads from `private.dashboard_github_allowlist`.
- Every row stores the exact GitHub username + verified email pair that Supabase should allow.
- The same row also feeds the custom JWT claims hook for `dashboard_access` and `user_role`.
- Identity fields are immutable in the first UI slice. If a GitHub username or email changes, remove the row and create a new one.
- The dashboard protects the final active Owner row from being disabled or deleted in the UI.
