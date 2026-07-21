# Changelog

## Unreleased

- Replaced the dashboard's global top-20 audit snapshot with an independent,
  membership-scoped 20-item `ActivityPage`. Project and issue events are merged
  newest-first through a stable `(occurredAt, source, eventId)` cursor, support
  a minimal event-kind filter, recheck every resource binding before the public
  DTO, and distinguish an empty project from revoked access. Database mode no
  longer falls back to snapshot activity, and both event sources now include
  their ID tie-breaker in the cursor index.
- Removed the unbounded legacy issue graph from `DashboardSnapshot`. Dashboard
  reads now load only project metadata with complete SQL aggregates plus bounded
  run groups plus membership-scoped member and token groups; issue
  queues and details come exclusively from the paginated page/detail contracts.
  Global run cards deep-link by public issue key, including issues outside the
  current page.
- Connected the all-project dashboard queue to its bounded server page with
  canonical shared filters, separate three-field URL cursors, exact request
  fingerprints, cross-project direct details, revalidated role-based write
  gates, and no fallback to legacy snapshot issues on stale or failed reads.
- Added a server-only all-project issue page with membership-bound search,
  status and priority filters, 25-item newest/oldest keyset pagination over
  public `(updatedAt, projectKey, issueNumber)` values, same-query latest-plan
  summaries, and a final per-issue project, membership, and archive recheck.
  Invalidated race candidates are skipped with an internal cursor so later
  visible issues remain reachable.
- Moved dashboard project metrics to dedicated SQL aggregates for all candidate
  issues, so open, ready, and blocked counts no longer depend on how many issue
  detail rows remain hydrated in the legacy snapshot.
- Before removing the legacy issue graph, bounded its dashboard notes to the
  newest 50 explicit `issue_note`
  events plus one history sentinel per issue, using SQL-side payload filtering
  and stable per-issue window ranks without cross-issue starvation. Project
  and issue IDs stay paired through mapping to fail closed during issue moves.
- Before removing the legacy issue graph, bounded its latest-plan lookup to one database-selected
  version per visible issue instead of loading every historical plan version.
- Added a membership-scoped 20-item project run page with a stable
  `(updated_at, run_id)` URL cursor, same-statement project/issue/token binding,
  safe result summaries, honest empty-project access rechecks, and concrete
  project UI isolation from the legacy global run limit.
- Bounded agent-run PATCH envelopes to 64 KiB of streamed UTF-8 and result JSON
  to 48 KiB, 12 levels, and 1000 nodes, rejecting malformed, cyclic, sparse,
  accessor-backed, and non-plain values before persistence.
- Added a server-only, membership-scoped dashboard issue-page contract with
  fixed 25-item issue-number cursors, newest/oldest ordering, same-query latest
  plan counts, a fail-closed final membership gate, and no internal project or
  issue IDs in the browser DTO.
- Added a direct membership-scoped dashboard issue-detail contract for deep
  links outside the current page, including one defensively normalized latest
  plan and the newest 50 explicit issue notes. Older note history is reported
  as truncated; internal database IDs, runs, and general audit data stay out.
- Added server-validated issue-page search across title, issue number, and
  public key plus single status and priority filters, preserving authorized
  empty projects by keeping every issue condition inside the membership-bound
  left join.
- Connected concrete project queues to the bounded server reads with canonical
  URL-backed search, status, priority, sort, and forward-cursor state; direct
  details remain independent of the current page, local mutations overlay by
  public issue key, archived issues stay readable but immutable, and read
  failures no longer fall back silently to snapshot issues. Exact request
  fingerprints reject stale same-project results, final roles and archive state
  drive write gates, transient detail failures preserve deep links, and a final
  missing-membership page result redacts every affected snapshot group.
- Added the Bubblophy Phase 2 roadmap and the detailed first-slice plan for a
  provider-neutral Remote MCP using personal Supabase OAuth 2.1 access.
- Hardened relative auth redirects, contributor/viewer mutation boundaries,
  agent-run token binding, and direct RLS access to sensitive run/event payloads.
- Required executable agent tokens at run request and approval time, kept
  cancellation available for unavailable tokens, and made human/agent run
  transitions compare-and-set safe.
- Added a fail-closed stateless `/mcp` transport plus RFC 9728 protected-resource
  discovery pinned to Bubblophy's configured app URL and Supabase Auth issuer.
- Added local Supabase OAuth JWT verification through public asymmetric JWKS,
  requiring the configured issuer, exact MCP audience, expiry, subject, and
  OAuth client ID before requests reach the MCP transport.
- Added the read-only `list_projects` MCP tool, re-reading current project
  memberships per call and exposing only public project fields, archive state,
  and the authenticated person's current role.
- Added the Supabase OAuth consent flow with a DB-authorized human session,
  visible client/scopes, strict same-origin decisions, and Supabase-owned 303
  callback redirects after explicit approval or denial.
- Added restrictive RLS policies that block every OAuth JWT carrying a
  `client_id` from direct Data API access to Bubblophy tables, keeping OAuth
  data access behind the narrower MCP tool contract.
- Added the cross-platform MCP operations runbook for environment-specific
  Supabase OAuth configuration, exact audience hooks, personal Codex and Claude
  Code login, credential persistence, staging isolation smokes, and rollback.
- Added the membership-scoped, read-only `list_issues` MCP tool with bounded
  issue-number pagination and a public summary contract that excludes issue
  descriptions, user identifiers, plans, runs, tokens, and audit data.
- Added the membership-scoped, read-only `get_issue` MCP tool for public issue
  detail including description and timestamps without internal issue/user IDs
  or related plans, runs, tokens, and audit data.
- Added the membership-scoped, read-only `get_issue_plan` MCP tool for the
  latest draft or approved plan without internal issue, plan, or actor IDs.
- Added the membership-scoped, read-only `get_run` MCP tool with public run
  metadata and a secret-filtered result summary instead of raw result JSON.
- Added nullable OAuth client attribution to issue plans and issue/project
  audit events as groundwork for distinguishable personal MCP writes.
- Added the controlled `propose_plan` MCP write tool, which reuses the
  transactional membership/role checks to create only OAuth-attributed,
  unapproved plan drafts without starting agent runs.
- Added the controlled `add_note` MCP write tool and a shared locked
  contributor-write context for race-safe plan and note authorization.
- Added the controlled `create_issue` MCP write tool with bounded public input,
  OAuth audit attribution, locked contributor authorization, and serialized
  per-project issue numbering without implicit plans, approvals, or runs.
- Added the read-only `list_run_targets` MCP tool, exposing only IDs and labels
  of currently executable same-project agent tokens to active contributors as
  the narrow selection boundary for human-approved run requests.
- Added the controlled `request_run` MCP write tool with OAuth audit
  attribution, locked contributor and token rechecks, and a public requested-run
  response without approval, execution, workflow mutation, or internal IDs.
- Hardened the shared issue-status writer with locked contributor
  authorization, optional expected-status conflict detection, OAuth audit
  attribution, and explicit server-action field forwarding.
- Added the conflict-safe `update_issue_status` MCP tool with all existing
  status targets, required reasons for blocked/done, and public output without
  actor, audit, run, plan, or approval data.
- Hardened project member role changes and removals with locked project/member
  authorization, stable lock ordering, expected-role conflict detection, and
  conflict-safe UI feedback without stale audit events.
- Added the detailed Phase 2 roles and invitations plan, keeping project
  membership authoritative and separating invitation management, acceptance,
  identity display, and mail delivery into reviewable slices.
- Added shared project and sorted membership lock primitives, then hardened
  project management plus agent-token creation and lifecycle writes against
  concurrent manager demotion while preserving existing role semantics.
- Hardened human run approval and cancellation with ordered project,
  membership, run, and token locks while preserving cancellation for an
  unavailable assigned token, plus foreign-key-compatible issue serialization
  to prevent lock-order deadlocks with audit inserts.
- Hardened human issue content, priority, and assignment writes with the shared
  project/issue lock context and one sorted actor/assignee membership recheck.
- Added the server-only project invitation schema with normalized email,
  non-owner roles, hashed tokens, lifecycle invariants, one open invite per
  project/email, and no direct RLS grants or policies.
- Added manager-only project invitation create, reinvite, and revoke actions
  with ordered authorization locks, seven-day one-time token rotation,
  compare-and-set conflict handling, and email/token-free audit events.
- Added a manager-only project invitation snapshot that binds role
  authorization and invitation rows in one query while excluding token hashes
  and inviter, acceptor, and revoker user IDs.
- Added the secure invitation acceptance boundary: public deep links stage the
  secret in a short-lived HttpOnly cookie, OAuth resumes only the exact
  token-free acceptance path, and matching verified identities atomically gain
  membership with race-safe, email- and token-free audit events.
- Replaced the normal technical Auth-ID member handoff with a manager-only
  email invitation UI, including redacted lifecycle states, archived-project
  guards, conflict refreshes, confirmation before revoke, and dismissible
  one-time links returned as entry paths instead of separate plaintext tokens.
- Added server-synchronized display profiles with closed direct RLS access,
  membership-scoped names, manager/self-only e-mail visibility, stable
  assignee ID/label separation, and technical Auth IDs only as a fallback.
- Closed the dashboard membership-read race with a final fail-closed
  membership and role gate across projects, issues, members, tokens, runs, and
  activity, including renewed co-member e-mail redaction after role demotion.
- Aligned project and agent-token management controls with each project's
  current owner/maintainer role, filtered mixed-role token actions per project,
  and blocked archived-project content edits at the locked server boundary.
- Added a compact project-role guide showing the current person's effective
  role, centralized role labels across members and invitations, replaced
  technical member IDs in removal feedback, and renamed issue ownership to
  responsibility in the queue.
- Synchronized project and issue selection with post-mount URL changes so
  browser back/forward navigation no longer gets overwritten by stale local
  dashboard state.

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
- Added server-backed project editing plus archive/restore controls for
  owner/maintainer users, with visible archived-project state, explicit
  `project_updated` audit metadata, and UI/server guards that keep archived
  projects out of operative issue, run, and token mutation paths.
- Added a conservative project member management MVP: dashboard member lists,
  owner/maintainer-only non-owner role changes, guarded hard removal, explicit
  project-member audit metadata, and no fake Add-by-E-Mail flow before a real
  profile or invite model exists.
- Added local agent handoff guidance for active `runs:update` tokens, including
  one-time token copy UX and placeholder curl examples for the existing agent
  run update endpoint without introducing read APIs or automation.
- Added a read-only local agent context endpoint for approved run handoff:
  `GET /api/agent-runs/[runId]` uses active same-project Bearer tokens with
  `issues:read`, returns only minimal Run/Project/Issue/latest-plan context,
  and updates `last_used_at` without starting automation.
- Clarified dashboard action labels and empty states so issue creation, plan
  drafting, and run queues point at existing human-controlled workflows instead
  of database jargon or future-placeholder wording.
- Constrained Bubblophy project, issue, plan, and agent-token dialogs to the
  visible viewport with internal scrolling so mobile and in-app browser sizes
  keep actions reachable.
- Changed the empty-database header CTA from a disabled issue button to the
  real project creation action so first use starts with an actionable step.
- Inlined the Bubblophy proxy matcher configuration so Next.js can statically
  parse the protected browser-page routes during local development.
- Added server-backed issue priority updates with contributor checks,
  `priority_changed` audit metadata, and dashboard feedback that keeps issue
  lists and detail panels consistent after saving.
- Pinned persisted issue plan reload behavior so latest plan summary and steps
  stay visible/editable after dashboard load, and kept failed plan saves inside
  the dialog without losing the draft.
- Hardened the human run decision controls and agent run update route tests so
  failed approve/cancel actions keep visible controls and revoked, expired, or
  invalid agent updates stay on explicit JSON errors.
- Hardened issue edit and status controls so thrown server actions show inline
  errors without losing the edited draft, selected status, or current issue.
- Hardened agent-token lifecycle controls so thrown pause/resume/revoke actions
  show generic inline errors without exposing token internals or changing state.
- Normalized stale Bubblophy project/issue deep-link query parameters with
  history-safe redirects while leaving first-visit default URLs untouched.
