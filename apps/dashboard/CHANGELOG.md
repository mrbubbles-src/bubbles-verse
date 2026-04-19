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
- Added a first RLS layer for all dashboard tables plus the private allowlist,
  using the custom JWT claims `dashboard_access` and `user_role`.
- Added public-read RLS policies for published content, author data, active
  app modules, and the visible Vault taxonomy so non-dashboard apps can query
  shared data without login.

### Changed

- Aligned the app's Next.js, React, and type package versions with the shared
  workspace packages to reduce monorepo version drift.
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
- Added dev-time Vault entry submit traces so browser payloads and parsed API
  bodies can be compared quickly while debugging metadata persistence.
- Allowed `manifest.json` and generated app icons to bypass the dashboard auth
  proxy so browsers no longer parse redirected HTML as a broken manifest.

### Documentation

- Rewrote the app README so it documents the monorepo workflow, current scaffold
  state, and local quality checks.
- Added an app-local changelog for future dashboard-specific changes.
