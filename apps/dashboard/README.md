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
- The shared shell navigation now follows the redesign playbook: `Profil`
  lives in the sidebar footer menu, `Account` is now `Zugangsverwaltung`, and
  Vault entry drafts can appear as temporary child links below `Einträge`.
- The desktop shell now uses the full available content width instead of a
  fixed centered max-width rail, while shared `@bubbles/ui` controls render at
  a larger default text scale.
- The main dashboard screens now also raise their own local headings, table
  text, metadata, and preview widths so the desktop UI actually feels larger
  in day-to-day use instead of shrinking back through page-level overrides.
- Protected routes exist for `/profile`, `/account`, `/vault`, `/vault/categories`, `/vault/entries`, and `/vault/entries/new`.
- `/profile` now gives every legit dashboard user a dedicated author-profile screen for display data, slug, avatar, bio, and the first fixed social links.
- `/account` now lets Owners manage the private dashboard allowlist, including `dashboard_access` and `user_role`.
- `/vault` now acts as the real landing page for the Coding Vault area with editorial stats, recent activity, and direct shortcuts into authoring.
- `/vault/categories` now ships the first real editorial CRUD screen for the Coding Vault category tree.
- `/vault/entries` now shows the first real editorial list, `/vault/entries/new` creates entries through `@bubbles/markdown-editor`, and `/vault/entries/[id]` edits existing entries in the same flow.
- The row-level icon actions in the Vault tables now use extra-large desktop
  touch targets so edit, preview, expand, and delete affordances read clearly.
- `/vault/preview/new` and `/vault/preview/[id]` now open the current draft or
  saved entry as a fullscreen preview in a separate tab without being treated
  like another editor route in the sidebar.
- The protected dashboard route group now ships matching loading, error, and
  not-found surfaces so route transitions and missing pages stay on-brand
  instead of falling back to generic Next.js states.
- Shared fonts, globals, theme provider, and toast host are wired in.
- Redirect-based success/error toasts for `/account`, `/profile`,
  `/vault/categories`, and `/vault/entries` now run through one shared
  dashboard bridge in the `(dashboard)` layout instead of per-page wrappers.
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

## Row Level Security

- All dashboard tables in `public` now have RLS enabled, plus the private
  `dashboard_github_allowlist` table as defense in depth.
- Internal dashboard reads are tied to the custom JWT claim
  `dashboard_access = true`.
- Public read access is intentionally available without login for:
  - active `app_modules`
  - published `content_items`
  - the matching `vault_entries` and `content_item_tags`
  - `vault_categories` for public taxonomy reads across apps
  - author `profiles` and `profile_social_links` for profiles that already
    own published content
- Owner-only data like the private allowlist is additionally protected by
  `user_role = owner`.
- Profile self-service stays scoped to the signed-in `auth.uid()`, while Vault
  structure management is limited to `owner` and `editor`.
- The RLS helper functions live in the `private` schema so the policies do not
  depend on user-editable `user_metadata`.

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
- Shared role/summary/form helpers for this area now live in
  `lib/account/dashboard-access.shared.ts`, while DB reads stay in the
  server-only `lib/account/dashboard-access.ts` module so client components do
  not bundle the Postgres driver.
- Dashboard management dialogs now reuse shared `@bubbles/ui` shells for form
  and staged destructive flows instead of repeating modal wiring per feature.
- Identity fields are immutable in the first UI slice. If a GitHub username or email changes, remove the row and create a new one.
- The dashboard protects the final active Owner row from being disabled or deleted in the UI.

## Profile

- `/profile` is available to every dashboard user with `dashboard_access = true`.
- The page manages the shared `profiles` row tied to the current Supabase auth user.
- First save also bootstraps a missing profile row, so older accounts do not need manual prep before using the editor.
- Social links currently stay intentionally fixed to `website`, `github`, `linkedin`, and `twitter` so the first public profile use cases remain simple.
- Access role and GitHub identity still come from Auth plus the private allowlist, not from editable profile form fields.
- Public apps can read author rows and social links without login once that
  profile owns at least one published content item.

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
- The `/account` and `/vault/entries` management lists now build on the shared
  `@bubbles/ui/components/management-table` shell, which itself wraps the
  shadcn CLI-installed `table` primitive from `@bubbles/ui/shadcn/table`.
- The entry list keeps horizontal table scrolling as a fallback through tablet
  widths and only suppresses the scrollbar rail again on larger desktop
  layouts where the table already fits comfortably.
- Table and tree actions now prefer the shared tooltip component over browser
  default `title` tooltips, so icon actions and disabled owner controls stay
  consistent with the rest of the dashboard.
- The list footer now uses the shared `@bubbles/ui/components/pagination`
  shell, including the shared page-size selector and compact chip logic.
- Row actions in the entry and category tables now use larger icon buttons so
  fast editorial actions are easier to hit and scan.
- `/vault/entries/new` uses `@bubbles/markdown-editor` for shared authoring, metadata, draft handling, preview, and image uploads.
- `/vault/entries/[id]` reuses the same editor in edit mode, including current category, tags, metadata, and saved editor content.
- The dashboard route group now owns its own loading, error, and not-found
  surfaces, while the app root also provides a small global 404 page for
  unmatched URLs outside the authenticated shell.
- The editor routes keep the shared package editor but now use a much flatter
  dashboard header with inline category selection plus a dedicated `Vorschau`
  action that opens the independent `/vault/preview/...` fullscreen preview
  route in a new tab.
- When temporary draft links exist, the sidebar now shows them inside a
  separate `Entwürfe` collapsible below `Einträge` instead of overloading the
  main `Einträge` item itself.
- Temporary sidebar draft items can still be dismissed through the trailing
  action, but now require the shared two-step destructive confirmation dialog
  before local draft state is removed.
- The sidebar only surfaces one temporary create draft plus one temporary edit
  draft at a time, keeping `Einträge` compact even if stale local draft keys
  still exist in the browser.
- The Vault entry wrapper now scopes edit drafts per entry ID, so switching
  between two edit screens does not restore another entry's stale local draft.
- New entry saves go through `/api/vault/entries`, which bootstraps the shared `vault` app module and the current author's `profiles` row on first save.
- Entry updates go through `/api/vault/entries/[id]` and keep the original author while updating the latest editor, category, tags, and serialized content.
- Entry duplicates go through `/api/vault/entries/[id]/duplicate` and reuse content, tags, and category while always creating a new draft copy with a free slug.
- Entry deletes also go through `/api/vault/entries/[id]` and remove the shared `content_items` row, letting the existing schema cascades clean up `vault_entries` and `content_item_tags`.
- Editor image uploads go through `/api/editor-image-upload` and use the shared Cloudinary helper from `@bubbles/markdown-editor`.
- Published Vault content, tags, taxonomy, and author data are now readable
  for unauthenticated apps through RLS, while drafts stay dashboard-only.
