# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Added shared dashboard auth cookie configuration so Supabase sessions can be
  scoped to a parent domain like `.mrbubbles.test` or `.mrbubbles-src.dev`.
- Added the first protected dashboard shell with shared sidebar, header, footer,
  and placeholder account/Vault routes.
- Added the first dashboard home view with quick actions, recent content
  sections, and app summaries.
- Added an optimistic dashboard `proxy.ts` and shared session-cookie helpers for
  faster auth redirects.
- Added login feedback for failed OAuth returns plus a one-time success toast
  after a real sign-in round-trip.
- Added a dedicated `/auth/callback` route so Supabase PKCE logins can exchange
  the auth code for a cookie-backed dashboard session before redirecting home.
- Added the first owner-only `/account` access-management UI for creating,
  updating, and deleting rows in `private.dashboard_github_allowlist`.
- Added a DB-backed dashboard access layer so protected routes now resolve
  `dashboard_access` and `user_role` from the private allowlist table.
- Added the first real `/vault/categories` CRUD workflow with create, edit, and
  delete handling for the two-level Vault category tree.
- Added the first real Vault entry authoring flow with a `/vault/entries` list,
  a `/vault/entries/new` markdown-editor screen, and app-local save/upload API
  routes.
- Added the first `/vault/entries/[id]` edit flow so existing Vault content can
  be reopened and updated in the same shared markdown-editor surface.
- Added the first real `/vault` overview with quick authoring actions,
  editorial counts, category context, and the latest touched Vault entries.
- Added direct Vault-entry deletion from the edit flow, including API cleanup
  and redirect feedback back to the entry list.
- Added server-side filters for `/vault/entries`, including title search,
  status filtering, and category filtering via query params.
- Added draft duplication for existing Vault entries, including a dedicated
  duplicate route and a direct jump into the copied edit screen.
- Added a dedicated `/profile` screen so every allowed dashboard user can edit
  the shared author profile row, including slug, avatar, bio, and fixed social
  links.
- Added a live dashboard landing page that now reads real identity, profile,
  and Vault data instead of static mock content.
- Added fullscreen Vault preview routes for create/edit flows so draft content
  can open in a separate browser tab outside the split editor preview.
- Added a first RLS layer for all dashboard tables plus the private allowlist,
  using the custom JWT claims `dashboard_access` and `user_role`.
- Added public-read RLS policies for published content, author data, active
  app modules, and the visible Vault taxonomy so non-dashboard apps can query
  shared data without login.
- Added a shared dashboard redirect-feedback bridge plus generic helper layer
  so server-first mutation toasts no longer need per-page wrapper components.
- Added shared dashboard loading, error, and not-found route surfaces so
  protected routes no longer drop back to generic Next.js fallback UI.

### Changed

- Split shared dashboard-access helpers from the server-only DB module so the
  `/account` client bundle no longer pulls in the Postgres driver during
  Next.js development.
- Aligned the app's Next.js, React, and type package versions with the shared
  workspace packages to reduce monorepo version drift.
- Reworked the shared dashboard shell navigation to match the redesign
  playbook, including shorter header copy, `Zugangsverwaltung` in the primary
  nav, profile access in the sidebar footer menu, and temporary draft children
  below `Einträge`.
- Reworked the dashboard UI around the redesign playbook: flatter layouts,
  work-first home and Vault overview, table-first management screens, and a
  reduced authoring header around the shared markdown editor.
- Replaced the `create-next-app` placeholder metadata and landing page copy with
  dashboard-specific scaffold content.
- Documented the dashboard environment variables needed for Supabase auth and
  database access.
- Replaced the temporary root placeholder route with the authenticated
  dashboard home route inside the `(dashboard)` route group.
- Fixed the login bootstrap so client-side `NEXT_PUBLIC_*` variables are read
  from explicit public env keys instead of the full `process.env` object.
- Reset the login pending state when GitHub OAuth cannot be started, so the
  button no longer gets stuck on `Weiterleitung...`.
- Non-allowlisted GitHub sessions are now redirected through server logout so
  rejected users do not keep a live dashboard session cookie after OAuth.
- Updated the server-side owner fallback so GitHub users from Supabase can be
  recognized through `user_metadata` when `identities` is empty.
- Replaced the old `.env`-based owner gate with a private-table-based access
  check, keeping `proxy.ts` as an optimistic session check only.
- Opened Vault category management to `owner` and `editor` roles, while keeping
  `/account` owner-only.
- Moved the shared profile bootstrap logic out of the Vault entry flow so
  `/profile` and future author surfaces can reuse the same profile source of
  truth.
- Updated the local `typecheck` script to run `next typegen` before `tsc`, so
  route-aware Next.js types no longer break standalone type validation.
- Cached the dashboard Drizzle/Postgres client across local HMR reloads so
  simple Supabase allowlist queries no longer churn connections and hit
  statement timeouts during `next dev`.
- Reworked the dashboard home so quick actions are role-aware and the start
  page surfaces profile completeness plus current Vault activity.
- Isolated Vault edit drafts per entry so reopening one entry no longer leaks
  another entry's metadata or editor content into the shared markdown-editor
  session.
- Updated the Vault category select to keep showing the human label instead of
  the raw category UUID after selection.
- Allowed `manifest.json` and generated app icons to bypass the dashboard auth
  proxy so browsers no longer parse redirected HTML as a broken manifest.
- Replaced repeated dashboard modal wiring with shared `@bubbles/ui`
  `FormDialog` and `StagedConfirmDialog` shells.
- Replaced raw HTML table markup in the main dashboard management screens with
  the shared `@bubbles/ui/components/management-table` shell built on the
  shadcn CLI-installed table primitive.
- Replaced the custom Vault entry list footer with the shared
  `@bubbles/ui/components/pagination` component.
- Opened the dashboard shell width on desktop and aligned it with the larger
  shared `@bubbles/ui` typography baseline so pages no longer sit inside such a
  narrow central rail.
- Raised the dashboard screen-local typography, table density, and preview
  width so the larger desktop layout now reads visibly bigger instead of being
  pulled back down by local `text-xs` and `text-sm` overrides.
- Limited the temporary `Einträge` sidebar draft affordance to one create item
  plus one edit item, keeping the nav compact while preserving the current
  active draft route.
- Moved the fullscreen editor preview onto an independent `/vault/preview/...`
  route so opening a preview tab no longer looks like another edit route in the
  sidebar.
- Changed the sidebar draft affordance so `Einträge` stays a plain link while
  open draft links live inside a separate `Entwürfe` collapsible.
- Added a confirmation step before the sidebar draft action discards local
  editor state.
- Increased the row-action icon buttons in the Vault entry and category tables
  again so expand, edit, preview, and delete controls are much easier to hit.
- Replaced the sidebar draft discard browser alert with the shared staged
  destructive confirmation dialog pattern.
- Removed a few low-signal dashboard wrappers and redundant layout classes in
  the shell, category tree, and profile edit form while keeping broader
  structural refactors out of scope.
- Removed the unnecessary horizontal overflow in the Vault entry list on large
  screens by dropping the forced table min-width and only keeping no-wrap on
  the action and timestamp columns.
- The Vault entry list now suppresses the shared table wrapper's horizontal
  overflow rail on desktop locally, instead of trying to solve that macOS
  scrollbar behavior through broader shared table changes.
- The local entry-list overflow fallback now stays active through tablet widths
  and only hides the rail again on larger desktop layouts.
- Replaced remaining browser-default `title` tooltips in dashboard management
  actions with the shared tooltip component, especially in category actions and
  disabled owner-only account controls.
- Switched the Vault entry list preview action onto the dashboard-local
  `/vault/preview/[id]` route, so the middle row action no longer stays
  disabled when no separate public Vault app URL is configured.
- Tightened the Vault entry description tooltip trigger to the truncated text
  itself, so the tooltip no longer appears anchored to the far edge of the
  whole table cell.
- Reworked Vault draft routing so create/edit screens now replace one shared
  active draft slot per mode instead of leaving stale per-entry edit drafts in
  localStorage, and warn before another unsaved authoring session is replaced.
- Narrowed the draft-replace warning to same-mode collisions only, so an
  active `Neuer Eintrag` draft no longer blocks opening an unrelated
  `Eintrag bearbeiten` route.
- Restored the replace-or-continue prompt for repeated `Neuer Eintrag`
  navigation when a create draft already exists, so the current draft is no
  longer resumed silently.
- Made the draft-dismiss action in the sidebar permanently visible with clearer
  contrast, instead of hiding it behind a hard-to-read hover-only icon state.
- Switched the draft-dismiss `X` away from the destructive red tint and onto
  the same readable text color as the surrounding draft label, so it stays
  visible on mauve active states as well.
- Let indented draft links use the full available subnav width and reserve
  space for the dismiss action, which removes the cramped overlapping draft
  chips inside the `Entwürfe` section.
- The create-draft sidebar link now resumes the existing draft explicitly,
  instead of accidentally triggering the "Neu beginnen" guard that should only
  belong to the normal `Neuer Eintrag` flow.
- Updated dashboard selects to keep showing editorial labels after selection,
  including category, access-role, and filter selects that previously fell
  back to raw IDs or internal values.
- Restored the Vault entry description to its own line below the title while
  keeping the tooltip anchored to the truncated description text itself.

### Documentation

- Rewrote the app README so it documents the monorepo workflow, current scaffold
  state, and local quality checks.
- Added an app-local changelog for future dashboard-specific changes.
