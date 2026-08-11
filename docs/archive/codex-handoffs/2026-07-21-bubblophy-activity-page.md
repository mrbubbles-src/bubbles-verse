# Codex Handoff: Bubblophy ActivityPage

Date: 2026-07-21
Repo: `/Users/mrbubbles/dev/private/projects/bubbles-verse`
Branch: `feature/bubblophy-phase-2`
Commit: `377f8d1` (ActivityPage slice; this handoff follows separately)
Working tree: expected clean after the docs-only handoff commit

## Next Agent Start Here

1. Do not continue implementation until the user explicitly reactivates the goal.
2. On reactivation, read `AGENTS.md`, this handoff, and
   `apps/bubblophy/docs/phase-2-roadmap.md`.
3. Verify branch, commit, and worktree before choosing the next bounded slice.

## Current Goal

Continue Bubblophy Phase 2 after the MVP in reviewable, tested slices. The user
explicitly paused work after the ActivityPage slice; no following slice is
authorized yet.

## Current State

- The old global top-20 database audit snapshot has been replaced by an
  independent, membership-scoped 20-item ActivityPage.
- Project and issue events merge newest-first with the stable public cursor
  `(occurredAt, source, eventId)` and a minimal `all | issue | project` filter.
- Database activity no longer falls back to `DashboardSnapshot.activity`.
- Project members and agent tokens remain membership-scoped but unpaginated.
- The real Codex/Claude OAuth staging smoke remains intentionally parked until
  a shared HTTPS deployment exists.

## Completed

- Added the server-only ActivityPage contract and Drizzle reader.
- Added initial/final concrete-project access checks and per-event
  membership/project/issue rebinding before public DTO mapping.
- Added source-qualified UI IDs, quiet actor labels, URL-backed filter and
  pagination state, stale-request fingerprints, and honest UI states.
- Removed the legacy database activity row group and mapper from the dashboard
  snapshot path; Sample activity remains an explicitly labeled preview.
- Added migration `0009_normal_monster_badoon.sql` to extend both event cursor
  indexes with `id`.
- Updated README, changelog, MVP status, database setup, and Phase 2 roadmap.
- Tesla completed the final independent review with no findings.

## Files And Modules That Matter

- `apps/bubblophy/lib/dashboard/activity.ts` - public service contract.
- `apps/bubblophy/lib/dashboard/activity-database-read.ts` - merge, cursor,
  access rechecks, and DTO mapping.
- `apps/bubblophy/lib/dashboard/activity-query.ts` - canonical URL contract.
- `apps/bubblophy/app/page.tsx` - parallel server read and access-loss wiring.
- `apps/bubblophy/components/dashboard/bubblophy-dashboard.tsx` - filter,
  states, timeline, and pagination controls.
- `apps/bubblophy/drizzle/0009_normal_monster_badoon.sql` - cursor indexes.
- `apps/bubblophy/docs/phase-2-roadmap.md` - remaining Phase 2 scope.

## Commands And Checks Run

- `bun --bun vitest run --maxWorkers=4` - 115 files, 836 tests passed.
- `bun run lint` - passed.
- `bun run typecheck` - passed after final test changes.
- `bun run build` - Next.js production build passed.
- `git diff --check` and staged diff check - passed.
- Tesla focused Activity/migration suite - 17 tests passed; no findings.

## Known Warnings And Residual Risks

- The default full-worker Vitest run intermittently times out in two unchanged
  MCP route tests. Both pass isolated in about 0.5 seconds; the full suite is
  green with `--maxWorkers=4`.
- No production-like PostgreSQL `EXPLAIN` was run. Observe the cross-project
  issue-event join after deployment and with realistic event volume.
- Migration `0009` replaces indexes without `CONCURRENTLY`; on already large
  tables it can temporarily block writes.
- Race behavior is covered by controlled query mocks, not a real concurrent
  PostgreSQL integration test.
- No manual browser pass was run for this slice; component tests cover filter,
  loading/error/empty behavior, pagination, and project cursor reset.

## Constraints And Do-Not-Touch Areas

- Do not start another slice until the user reactivates the goal.
- Keep personal OAuth/MCP access separate from project Agent-Token execution.
- Preserve human-in-the-loop run approval and fail-closed membership checks.
- Do not merge or deploy either Phase 2 branch without explicit user direction.
- Continue using Tesla for review and commit each completed slice separately.

## Next Steps After Reactivation

1. Reconfirm the next slice with the user; the roadmap currently points to
   bounded member/token reads as the next larger dashboard-data gap.
2. Recheck the domain and authorization contract before editing.
3. Implement only that approved slice, run full gates with bounded Vitest
   workers, obtain Tesla review, and commit it separately.

## Reactivation Prompt

```text
Continue this work from the handoff document:
/Users/mrbubbles/dev/private/projects/bubbles-verse/docs/codex-handoffs/2026-07-21-bubblophy-activity-page.md

Work in repo:
/Users/mrbubbles/dev/private/projects/bubbles-verse

Start by reading the handoff and AGENTS.md. Verify the branch and working tree
before editing. Do not rely on old chat context; treat the handoff and repository
as the source of truth.

Current goal:
Continue Bubblophy Phase 2 in one bounded, reviewed slice after the user has
explicitly reactivated the goal.

Important constraints:
Do not merge or deploy without explicit direction. Preserve human-in-the-loop,
membership-scoped, fail-closed contracts. Use Tesla for review and commit the
completed slice separately.
```
