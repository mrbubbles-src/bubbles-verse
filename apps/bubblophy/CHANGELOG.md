# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Added the initial Bubblophy Next.js app shell with a project-aware issue and
  agent orchestration dashboard.
- Added the first Drizzle schema for projects, project members, issues, issue
  plans, issue events, agent tokens, and agent runs.
- Added an auth and security plan for Supabase human auth, scoped hashed agent
  tokens, audit events, RLS direction, and human-in-the-loop run approval.
- Added the initial public Supabase auth groundwork for human login, callback,
  logout, host-aware cookie options, and local Bubblophy environment parsing.
- Added schema tests for table naming and allowed agent token scopes.
- Added focused tests for the Bubblophy env helper, auth cookie domain
  handling, login feedback, callback route, and logout route.
- Added a server-only dashboard DTO boundary so the public MVP page no longer
  imports sample data directly.
- Added the first protected Bubblophy dashboard gate with Supabase human
  sessions, safe relative redirects, and a temporary server-only email
  allowlist.
- Added a server-only project/issue repository mapper that converts
  persistence rows into dashboard DTOs without requiring a live database.
- Added a server-only issue draft create contract with injectable tests and a
  Drizzle adapter that writes an issue plus `created` audit event without
  starting agent runs.
- Added the dashboard dialog wiring for database-backed issue creation while
  preserving explicit local-only drafts for sample and fallback data sources.
- Added a server-only project create contract, authenticated server action, and
  minimal dashboard dialog for database-backed project creation.
- Added the initial Drizzle SQL migration and database setup notes for
  reviewable Bubblophy table creation without remote migration execution.
- Added a server-only issue plan draft flow, authenticated server action, and
  dashboard dialog that writes plan versions plus `plan_updated` events without
  starting agent runs.
- Added server-only Bubblophy agent token creation with secure random tokens,
  hash-only persistence, owner/maintainer checks, a one-time plaintext display,
  project-wide `agent_token_created` audit events, and no agent run side
  effects.
- Added database-backed dashboard reads for public agent token summaries and
  project audit activity, constrained by project membership and excluding token
  secrets.
- Improved dashboard interaction states for project and issue selection,
  section navigation, and honest Sample/Fallback previews. The Runs panel no
  longer exposes fake run actions before a human-approved run workflow exists.
- Added explicit dashboard data-source states for real database data, an empty
  but reachable database, and unavailable database/schema setup without silently
  replacing authenticated work with sample projects.
- Added human-controlled issue status transitions for database-backed issues,
  including membership-checked server actions, `status_changed` audit events,
  same-status no-op protection, and no agent run side effects.
- Added dashboard UI for human-only agent run requests that insert local
  waiting RunQueue entries after the server action succeeds, without starting
  agents or executing work.
- Added human approve/cancel decisions for requested agent runs with
  membership-checked server actions, explicit state transitions, and audit
  events.
- Added the scoped agent run update endpoint for bearer-token status updates,
  including token hash lookup, `runs:update` scope checks, project binding,
  paused/revoked/expired rejection, `last_used_at`, and audit events without
  executing code.
- Added a journaled Supabase RLS baseline custom migration that enables RLS on
  Bubblophy tables, scopes direct reads by project membership, and keeps agent
  token hashes closed to direct authenticated access.
- Reused the shared `@bubbles/supabase-access` cookie and optimistic session
  helpers while keeping Bubblophy-specific authorization inside the app.
- Improved the empty database onboarding flow so creating a project selects it
  immediately and offers a project-bound persisted issue creation path.
- Threaded issue descriptions through the server-side create and dashboard
  read DTOs so detail panels survive reloads without client-only overlays.
- Hardened the human issue plan dialog so saved plans send normalized steps,
  update the visible plan counter, and keep denied saves in the dialog.
- Loaded latest persisted issue plan summaries and steps into the dashboard
  snapshot so plan details survive page reloads.
- Made issue rows directly clickable and keyboard-selectable, with a clearer
  empty detail state when no issue is selected.
- Added reload-aware project/issue selection, project-scoped tokens/runs/activity
  panels, visible persisted issue creation, and close/reopen status handling for
  completed issues without hiding them from the dashboard.
- Added server-backed agent token lifecycle controls for pause, resume, and
  guarded revoke, including owner/maintainer checks, explicit audit metadata,
  expiry-aware token states, and no token hash or plaintext exposure.
- Expanded the optimistic Bubblophy auth proxy to protected browser page paths,
  preserving deep-link `next` values while keeping agent/API and auth callback
  routes on their route-specific auth contracts.
- Kept Bubblophy OAuth callback redirects on the Bubblophy app origin when the
  local environment would otherwise point at the dashboard host.
- Added server-backed issue title and description editing with contributor role
  checks, no-op protection, explicit issue update audit metadata, and inline
  dashboard feedback for forbidden saves.
