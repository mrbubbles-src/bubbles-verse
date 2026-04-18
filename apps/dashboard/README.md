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
- `/` now renders a live protected dashboard home with current identity context, Vault stats, profile readiness, and recent editorial activity.
- The shared shell already uses `BubblesSidebar`, the shared app header, theme toggle, and footer.
- Protected routes exist for `/profile`, `/account`, `/vault`, `/vault/categories`, `/vault/entries`, and `/vault/entries/new`.
- `/profile` now gives every legit dashboard user a dedicated author-profile screen for display data, slug, avatar, bio, and the first fixed social links.
- `/account` now lets Owners manage the private dashboard allowlist, including `dashboard_access` and `user_role`.
- `/vault` now acts as the real landing page for the Coding Vault area with editorial stats, recent activity, and direct shortcuts into authoring.
- `/vault/categories` now ships the first real editorial CRUD screen for the Coding Vault category tree.
- `/vault/entries` now shows the first real editorial list, `/vault/entries/new` creates entries through `@bubbles/markdown-editor`, and `/vault/entries/[id]` edits existing entries in the same flow.
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

`bun run typecheck` now runs `next typegen` first so Next's generated route
types stay in sync before plain `tsc` validation runs.

The Drizzle/Postgres client is cached process-wide so local Next.js HMR does
not open fresh Supabase connections on every reload. That keeps simple
allowlist checks from timing out during `next dev`.

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

## Profile

- `/profile` is available to every dashboard user with `dashboard_access = true`.
- The page manages the shared `profiles` row tied to the current Supabase auth user.
- First save also bootstraps a missing profile row, so older accounts do not need manual prep before using the editor.
- Social links currently stay intentionally fixed to `website`, `github`, `linkedin`, and `twitter` so the first public profile use cases remain simple.
- Access role and GitHub identity still come from Auth plus the private allowlist, not from editable profile form fields.

## Dashboard home

- `/` reads live server data instead of hardcoded mock content.
- The home combines current identity info, role-aware quick actions, compact Vault stats, profile completeness, and recent editorial work.
- Quick actions adapt to the current role, so Owners also get direct access to `/account`, while editorial roles stay focused on content work.

## Vault categories

- `/vault/categories` is available for `owner` and `editor` roles.
- The page manages `vault_categories` directly against Supabase Postgres via Drizzle.
- V1 enforces a strict two-level tree: top-level categories plus one child layer.
- Categories with children cannot be moved below another parent.
- Categories that still have child categories or linked Vault entries cannot be deleted.

## Vault entries

- `/vault` gives owners and editors one compact overview with entry counts, category counts, recent edits, and direct links into the main Vault workflows.
- `/vault/entries` is available for `owner` and `editor` roles and now supports URL-based filters for title search, status, and category.
- `/vault/entries/new` uses `@bubbles/markdown-editor` for shared authoring, metadata, draft handling, preview, and image uploads.
- `/vault/entries/[id]` reuses the same editor in edit mode, including current category, tags, metadata, and saved editor content.
- `/vault/entries/[id]` can also duplicate the current entry into a fresh draft and jump straight into the new edit screen.
- `/vault/entries/[id]` can now also remove an entry directly from the edit view, including the linked Vault row and tags.
- New entry saves go through `/api/vault/entries`, which bootstraps the shared `vault` app module and the current author's `profiles` row on first save.
- Entry updates go through `/api/vault/entries/[id]` and keep the original author while updating the latest editor, category, tags, and serialized content.
- Entry duplicates go through `/api/vault/entries/[id]/duplicate` and reuse content, tags, and category while always creating a new draft copy with a free slug.
- Entry deletes also go through `/api/vault/entries/[id]` and remove the shared `content_items` row, letting the existing schema cascades clean up `vault_entries` and `content_item_tags`.
- Editor image uploads go through `/api/editor-image-upload` and use the shared Cloudinary helper from `@bubbles/markdown-editor`.
