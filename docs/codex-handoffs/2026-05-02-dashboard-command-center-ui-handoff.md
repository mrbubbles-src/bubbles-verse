# Dashboard Command Center UI Handoff

Date: 2026-05-02  
Repo: `/Users/mrbubbles/dev/bubbles-verse`  
Branch: `new-app/dashboard`

## Current Goal

Continue polishing the new `apps/dashboard` command-center home UI so it
matches the calm/creative dark dashboard mockup while staying responsive,
usable, and aligned with the shared `@bubbles/ui` tokens and components.

The dashboard is mainly desktop-first in real usage, but every viewport still
must be usable. Mobile-first implementation is fine; desktop is the main
experience and should feel like the polished version.

## What We Already Completed

- Reworked the dashboard home toward the command-center mockup:
  - top command/search bar
  - calm dark gradient background
  - quick action strip
  - `Weiterarbeiten` work row
  - `Letzte Inhalte` recent-content area
  - right-side app/status rail
- Kept colors and typography tied to shared globals instead of mockup-specific
  colors.
- Made dashboard search functional:
  - submitting a query navigates to `/vault/entries?query=...`
  - empty search navigates to `/vault/entries`
- Made `Alle ansehen` links functional:
  - draft/work section links to `/vault/entries?status=draft`
  - recent-content section links to `/vault/entries`
- Added/kept a dashboard TODO doc for future app-aware quick actions.
- Replaced checkbox-like row markers with Hugeicons-based content icons.
- Added type/status/app columns for recent content.
- Added colored status badges:
  - draft uses yellow-ish `chart-3`
  - published uses green-ish `chart-2`
- Iterated responsive row behavior heavily:
  - `Letzte Inhalte` is compact on constrained widths and table-like on wide
    desktop.
  - `Weiterarbeiten` becomes table-like on larger desktop while avoiding
    overflow on tablet/medium widths.
  - Desktop-only duplicate table cells and compact meta rows were made explicit
    via dashboard-specific display classes.
- Quick actions no longer overflow into the aside when the sidebar is open:
  - 4-column layout is delayed to very wide desktop.
  - action labels truncate properly.
- Sidebar polish:
  - `Einträge` icon changed to `Files02Icon`.
  - `Kategorien` icon changed to `TagsIcon`.
  - footer separator before user menu hidden from the dashboard shell.
- Exported additional Hugeicons from `packages/ui/src/lib/hugeicons.ts`.
- Reduced the expensive dashboard-home Vault query:
  - home now requests only 5 recent entries instead of loading the full list.
  - `getVaultEntries()` now applies `limit`/`offset`.
- Added a DB migration for content item sorting/filtering indexes:
  - `apps/dashboard/drizzle/0003_dashboard_home_indexes.sql`
  - `content_items_updated_at_idx`
  - `content_items_status_updated_at_idx`

## Files Touched Or Investigated

### Dashboard UI

- `apps/dashboard/app/dashboard.css`
- `apps/dashboard/components/app-shell.tsx`
- `apps/dashboard/components/home/home-work-area.tsx`
- `apps/dashboard/components/home/quick-actions.tsx`
- `apps/dashboard/components/home/recent-content-list.tsx`
- `apps/dashboard/components/home/module-status-line.tsx`
- `apps/dashboard/__tests__/components/app-shell.test.tsx`
- `apps/dashboard/__tests__/components/home/dashboard-home.test.tsx`
- `apps/dashboard/README.md`
- `apps/dashboard/CHANGELOG.md`
- `apps/dashboard/documentation/dashboard-todo.md`
- `apps/dashboard/documentation/assets/calm-creative-dashboard/dashboard-command-center-dark.png`

### Sidebar And Shared UI

- `apps/dashboard/lib/sidebar.ts`
- `packages/ui/src/lib/hugeicons.ts`
- `packages/ui/src/styles/globals.css`
- `packages/ui/README.md`
- `packages/ui/CHANGELOG.md`

### Dashboard Data / DB Performance

- `apps/dashboard/lib/dashboard/home.ts`
- `apps/dashboard/lib/vault/entries.ts`
- `apps/dashboard/__tests__/lib/vault/entries.test.ts`
- `apps/dashboard/drizzle/db/schema.ts`
- `apps/dashboard/drizzle/0003_dashboard_home_indexes.sql`
- investigated:
  - `apps/dashboard/drizzle/db/index.ts`
  - `apps/dashboard/drizzle/db/schema.ts`
  - `apps/dashboard/lib/account/dashboard-access.ts`
  - `apps/dashboard/lib/auth/session.ts`

### Related Recent Commits

- `ffe7323 feat: enhance dashboard visuals and component consistency`
- `fb9033a feat: enhance markdown rendering and dashboard styles`
- earlier auth/perf context:
  - `3e47aa8 fix: reduce dashboard auth proxy load`
  - `00d9456 feat: implement caching strategy and enhance dashboard performance`

## Commands And Checks Already Run

Run repeatedly during the session:

- `git status --short`
- `git branch --show-current`
- `git log --oneline -5`
- `git show --stat --oneline HEAD`
- `bunx prettier --write ...`
- `bun --filter dashboard lint`
- `bun --filter dashboard typecheck`
- `bun --filter dashboard test:run`
- `bun --filter dashboard build`

Known green state after the latest UI/CSS/data-query changes:

- `prettier`: success
- `lint`: success
- `typecheck`: success
- `test:run`: `33 passed`, `100 tests`
- `build`: success

Browser/dev-server context used:

- Dev server run by user:
  `bun --bun next dev --hostname dashboard.mrbubbles.test --port 3004`
- Browser URL:
  `http://dashboard.mrbubbles.test:3004/`
- Browser Use / Next DevTools browser automation was used where possible.

## Known Errors, Warnings, Or Failing Checks

### Current Repo Checks

- No known failing dashboard checks after the latest completed run.
- Current `git status --short` at handoff time showed only untracked handoff
  docs under `docs/codex-handoffs/`.

### Runtime DB Timeouts Observed

The dashboard dev server has repeatedly logged Postgres statement timeouts:

- allowlist query:
  `private.dashboard_github_allowlist`
  by `(github_username, email)`
- Vault entries query:
  `vault_entries`
  joined to `content_items` and `vault_categories`
  ordered by `content_items.updatedAt desc`

Representative error:

```text
PostgresError: canceling statement due to statement timeout
code: 57014
```

Mitigation already done for the Vault/recent-items side:

- `getDashboardHomeModel()` now requests only `pageSize: 5`.
- `getVaultEntries()` now passes `limit` and `offset` into the query.
- New DB indexes were added in migration `0003_dashboard_home_indexes.sql`.

Important: the migration must be applied to the actual database before those
indexes help runtime performance.

The allowlist timeout is likely separate. Earlier investigation indicated the
allowlist table has a composite primary key and the query should be cheap when
the DB/pool is healthy. Suspected causes are pooler/cold connection/lock/network
rather than a missing app-side filter.

### Browser Warning Seen

The browser/dev output once included:

```text
Encountered a script tag while rendering React component.
Scripts inside React components are never executed when rendering on the client.
```

This was not resolved in this UI pass. It may be from content rendering or a
framework/dev overlay path. Investigate only if it persists after DB timeouts
are stable.

## Open Decisions

1. Whether to apply `0003_dashboard_home_indexes.sql` manually now or generate a
   fresh Drizzle snapshot/journal entry first.
2. Whether the `Letzte Inhalte` desktop breakpoint should stay at `112rem` or
   move earlier once the sidebar/content widths are settled.
3. Whether `Weiterarbeiten` should use pure CSS container queries instead of
   viewport breakpoints. This would likely be better because sidebar-open width
   matters more than viewport width.
4. Whether the dashboard home should display app-aware quick-action selection
   now, or leave it documented in `dashboard-todo.md`.
5. Whether the allowlist timeout should be handled with retries/fallback UI or
   fixed at DB/pooler/config level.
6. Whether to keep generated dashboard UI assets/mockups in
   `apps/dashboard/documentation/assets/calm-creative-dashboard/` as canonical
   visual references.

## Constraints, User Preferences, And Do-Not-Touch Areas

### Strong User Preferences

- User prefers German UI text with umlauts.
- User mostly uses dark mode.
- The dashboard should be a calm admin tool, but still feel cool/creative.
- Avoid card-inside-card aesthetics.
- Avoid excessive separator lines.
- Use global colors and fonts from `packages/ui/src/styles/globals.css`.
- Keep dashboard typography aligned with shared/global UI patterns.
- Main usage is desktop, but mobile/tablet must remain usable.
- `mobile first` does not mean desktop can be neglected.
- For dashboard desktop, treat it as the main polished experience.

### Component / UI Rules

- Always check first if a shadcn component already exists in `@bubbles/ui`.
- If not present, check shadcn registry and add via official shadcn CLI.
- Do not rebuild shadcn components from docs by hand.
- Do not default to raw HTML for UI patterns if a shadcn component exists.
- Build app-specific components on top of shared shadcn/UI primitives.
- Do not edit shadcn component files directly unless there is a clear shared
  package reason.
- Use existing Hugeicons exports; if a needed icon exists upstream but is not
  exported, add a narrow export in `packages/ui/src/lib/hugeicons.ts`.

### Repo / Process Rules From `AGENTS.md`

- Read relevant local Next.js docs under `node_modules/next/dist/docs/` before
  changing Next.js behavior.
- Be concise.
- Avoid overly clever abstractions.
- Ask before significantly changing a file.
- Run formatting, linting, typechecking before finishing.
- Keep tests current for functional changes.
- Add concise JSDoc for new functions/components/hooks/etc.
- Avoid `any`, `unknown`, `never` unless absolutely necessary.
- Update docs/changelogs close to the code scope.

### Do Not Touch / Be Careful

- Do not revert user changes.
- Do not stop the user’s dev server unless explicitly asked.
- Be careful with `docs/codex-handoffs/2026-05-02-dashboard-auth-proxy-handoff.md`
  and `docs/codex-handoffs/2026-05-02-teacherbuddy-sidebar-handoff.md`; they
  were already untracked at handoff creation time and may belong to adjacent
  sessions.
- Avoid broad package redesigns while continuing dashboard UI polish.
- Avoid global color/font changes unless the user explicitly asks for shared UI
  token work.

## Next 3-7 Concrete Steps

1. Apply or validate the new DB migration:
   `apps/dashboard/drizzle/0003_dashboard_home_indexes.sql`.
   Confirm the two indexes exist in the DB.

2. Reload `http://dashboard.mrbubbles.test:3004/` with the user’s dev server and
   verify there are no new `57014` timeouts for the Vault entries query.

3. Inspect the final desktop state at common widths with sidebar open:
   - around `1355px`
   - around `1594px`
   - around `1947px`
   Confirm `Weiterarbeiten` and `Letzte Inhalte` are each one-line/table-like
   only where there is enough content width.

4. If responsive rows still feel brittle, replace viewport breakpoints for
   `dashboard-work-row` and `dashboard-content-table-row` with container-query
   based breakpoints tied to the actual panel/content width.

5. Investigate the allowlist timeout separately:
   - confirm current DB connection string/pooler mode
   - check `pg_stat_activity` / locks during a timeout
   - verify the primary-key index on `private.dashboard_github_allowlist`
   - decide retry/fallback vs DB config fix

6. Revisit `dashboard-todo.md` and decide whether quick actions should prompt
   for app/module selection now or remain a documented future task.

7. Once visual polish is accepted, stage/commit only the intended dashboard/UI
   and migration files. Avoid sweeping unrelated markdown-renderer or
   TeacherBuddy changes into the same commit unless they are already committed
   on the branch.

## Reactivation Prompt For Fresh Codex Chat

Paste this into a new Codex chat:

```text
We are in repo `/Users/mrbubbles/dev/bubbles-verse` on branch
`new-app/dashboard`.

Read `docs/codex-handoffs/2026-05-02-dashboard-command-center-ui-handoff.md`
first and continue from it. The active goal is to finish the `apps/dashboard`
command-center home UI polish and stabilize the dashboard dev runtime.

Important context:
- The dashboard should match the calm/creative dark command-center mockup in
  `apps/dashboard/documentation/assets/calm-creative-dashboard/dashboard-command-center-dark.png`.
- Use global colors/fonts from `packages/ui/src/styles/globals.css`.
- Always prefer existing `@bubbles/ui` shadcn components; if missing, add via
  shadcn CLI rather than rebuilding by hand.
- Desktop is the main usage and should be polished, but mobile/tablet must stay
  usable.
- Do not stop my dev server unless I explicitly ask.
- Do not revert user changes.
- Run prettier, lint, typecheck, tests, and build before finalizing.

Current likely next step:
Apply/verify `apps/dashboard/drizzle/0003_dashboard_home_indexes.sql`, then
check the dashboard at `http://dashboard.mrbubbles.test:3004/` for DB timeouts
and responsive row layout at 1355px, 1594px, and 1947px with the sidebar open.

Known runtime issue:
Postgres `57014` statement timeouts were observed for the dashboard allowlist
query and the Vault entries recent-items query. The Vault/home query has been
limited to 5 rows and indexes were added, but the migration must exist in the
actual DB. The allowlist timeout is probably DB/pooler/cold-connection related,
not missing UI code.
```
