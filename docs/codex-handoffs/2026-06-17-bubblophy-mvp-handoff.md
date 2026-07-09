# Codex Handoff: Bubblophy MVP

Date: 2026-06-17
Repo: `/Users/mrbubbles/dev/private/projects/bubbles-verse`
Branch: `new-app/dashboard`
Commit: `6a6c556`
Working tree: clean

## Next Agent Start Here

1. Read `apps/bubblophy/MVP_STATUS.md` first; it is the compact source of truth
   for what is MVP-fertig and what should come next.
2. Verify current state with `git status --short`, `git branch --show-current`,
   and `git log --oneline -5` before editing.
3. If continuing Bubblophy work, choose one post-MVP slice from
   `apps/bubblophy/MVP_STATUS.md` instead of reopening already-completed MVP
   work.

## Current Goal

Bubblophy was built and merged as a feature-complete MVP for human-in-the-loop
issue and local-agent orchestration inside the Bubblesverse monorepo. The next
agent should preserve the completed MVP and continue only with explicit
post-MVP polish, deployment hardening, or review tasks.

## Current State

- Main worktree is clean on `new-app/dashboard` at `6a6c556`.
- Bubblophy MVP has been merged into the main worktree.
- `apps/bubblophy/MVP_STATUS.md` documents completed MVP scope, next
  improvements, and non-goals.
- There is only one Git worktree left: `/Users/mrbubbles/dev/private/projects/bubbles-verse`.
- No Bubblophy dev server is currently listening on port `3005`.

## Completed

- Built `apps/bubblophy` as a Next.js app with Supabase Auth, Drizzle/Postgres,
  shared `@bubbles/ui` sidebar/header pieces, issue planning, project/issue
  management, agent tokens, agent runs, and audit/activity flows.
- Kept agent behavior human-in-the-loop: runs require human request/approval,
  agent endpoints only read context and report status/result data.
- Added DB-backed access checks instead of env-based user allowlists.
- Added Auth/No-UI-Flash proxy/session behavior and verified it through code,
  tests, and browser behavior.
- Verified responsive behavior in the Codex in-app browser on mobile, tablet,
  laptop, and desktop viewports.
- Added `apps/bubblophy/MVP_STATUS.md`.
- Fast-forward merged `codex/bubblophy-run-lifecycle` into `new-app/dashboard`.
- Committed existing handoff notes under `docs/codex-handoffs/`.
- Removed old clean auxiliary worktrees after the merge.

## Change Map

- `apps/bubblophy/`: new Bubblophy app, tests, routes, database schema,
  documentation, and MVP status note.
- `packages/database-access/`: shared Postgres access package extracted during
  the work.
- `packages/supabase-access/`: shared Supabase auth/proxy helpers extracted
  during the work.
- `packages/ui/`: shared sidebar/header adjustments used by Bubblophy and other
  apps.
- `apps/dashboard/`: small shared database/auth package adoption changes.
- `docs/codex-handoffs/`: continuation notes for earlier dashboard/dependency/
  Supabase investigation threads.

## Files Touched Or Investigated

Touched:

- `apps/bubblophy/MVP_STATUS.md` - MVP completion matrix and next-step list.
- `apps/bubblophy/README.md` - current Bubblophy scope, setup, security model.
- `apps/bubblophy/CHANGELOG.md` - Bubblophy app change history.
- `apps/bubblophy/**` - app implementation, tests, routes, Drizzle schema, docs.
- `packages/database-access/**` - shared database access package.
- `packages/supabase-access/**` - shared Supabase access package.
- `packages/ui/src/components/bubbles-sidebar/**` - shared layout/header support.
- `docs/codex-handoffs/2026-05-25-*.md` - committed existing handoff docs.

Investigated:

- `AGENTS.md` - repo rules, including Next.js docs, root-only Bun commands,
  German umlauts, docs/changelog expectations, and check requirements.
- `apps/bubblophy/MVP_STATUS.md` - current evidence for MVP completeness.
- `apps/bubblophy/README.md` - detailed app/security scope.
- Git worktree state and port `3005` listener state.

## Commands And Checks Run

- `git status --short` - clean at handoff creation.
- `git diff --name-only` and `git diff --stat` - no output at handoff creation.
- `git worktree list --porcelain` - only the main worktree remains.
- `lsof -nP -iTCP:3005 -sTCP:LISTEN` - no Bubblophy dev server listening.
- Earlier Bubblophy readiness checks, before final documentation-only commits:
  `bun run test:run` passed with 373 tests, `bun run lint` passed,
  `bun run typecheck` passed, and `git diff --check` passed.
- Earlier in-app browser responsive check passed on `390x844`, `768x1024`,
  `1366x768`, and `1440x900`; mobile sidebar toggle was also verified.

## Known Errors, Warnings, Or Failing Checks

- No current failing checks are known.
- Final two commits were documentation-only, so full app checks were not rerun
  after them.
- Bubblophy dev server is not currently running on port `3005`.
- Some old handoff documents mention repo path `/Users/mrbubbles/dev/bubbles-verse`;
  current authoritative repo path is
  `/Users/mrbubbles/dev/private/projects/bubbles-verse`.

## Risk And Protection Notes

- Do not regress human-in-the-loop behavior. Avoid adding auto-starting agents,
  hidden polling loops, or broad write-capable agent endpoints without a
  separate security design.
- Do not put Supabase service-role keys, database URLs, agent token hashes, or
  plaintext tokens into client bundles, UI state, logs, or handoff files.
- RLS and database migrations should be reviewed before remote/production use.
- Use root-level Bun commands only; workspace dependency changes should use
  `bun add ... --filter=<workspace-name>` from the monorepo root.
- For Next.js changes, read relevant docs in `node_modules/next/dist/docs/`
  before editing; this repo uses newer Next.js conventions.
- Write German text with real umlauts.

## Open Decisions

- Which post-MVP slice to do first: visual regression automation, search/filter,
  notifications, agent handoff polish, roles/invites, deployment hardening, or
  deeper security review.
- Whether to deploy Bubblophy now or keep it local until Supabase redirect
  config, monitoring, and backup/restore plans are explicitly reviewed.
- Whether to expand agent APIs beyond context-read/status-update; this should
  require a separate security design.

## Constraints, Preferences, And Do-Not-Touch Areas

- Follow `AGENTS.md`.
- Keep answers concise.
- Always protect user changes; do not revert unrelated work.
- Use `@bubbles/ui` / shared shadcn-based primitives before inventing UI.
- Keep Bubblophy operationally human-controlled.
- Do not restart or kill user-managed dev servers unless explicitly asked.
- Do not recreate removed auxiliary worktrees unless a new isolated branch is
  explicitly needed.

## Next Steps

1. Confirm with the user which post-MVP item from `MVP_STATUS.md` should happen
   next.
2. If working on deployment, first audit Supabase redirect URLs, env handling,
   RLS policies, and runtime config; then run relevant checks.
3. If working on UX, start with a small slice such as search/filter or agent
   handoff polish, and verify in the in-app browser.
4. If working on security, review `apps/bubblophy/drizzle/`,
   `apps/bubblophy/lib/auth/`, `apps/bubblophy/lib/agent-*`, and route handlers.
5. For any functional changes, update app-local docs/changelog and run
   `bun run test:run`, `bun run lint`, and `bun run typecheck` in the relevant
   scope.

## Recommended Continuation Order

1. Treat the MVP as complete; do not re-open foundational work unless evidence
   contradicts `MVP_STATUS.md`.
2. Pick one post-MVP improvement and keep it narrow.
3. Verify the slice locally, then commit with a focused conventional commit.
4. Only then consider broader deployment or multi-agent extensions.

## Reactivation Prompt

```text
Continue this work from the handoff document:
/Users/mrbubbles/dev/private/projects/bubbles-verse/docs/codex-handoffs/2026-06-17-bubblophy-mvp-handoff.md

Work in repo:
/Users/mrbubbles/dev/private/projects/bubbles-verse

Start by reading the handoff and any repo instructions such as AGENTS.md. Verify the current branch and working tree with git status before editing. Do not rely on old chat context; treat the handoff and repository as the source of truth.

Current goal:
Continue from the completed Bubblophy MVP and choose the next explicit post-MVP slice without regressing the human-in-the-loop security model.

Important constraints:
- Follow AGENTS.md.
- Treat apps/bubblophy/MVP_STATUS.md as the MVP completion source of truth.
- Keep Bubblophy human-in-the-loop.
- Do not expose secrets or add broad agent write access without security design.
- Use root-level Bun commands for dependency work.
- Run relevant checks before finishing functional changes.

Begin with `Next Agent Start Here` and `Recommended Continuation Order`. Report any mismatch between the handoff and the current repo state before changing files.
```
