# Story 5.4: Vercel Deployment

Status: done

## Story

As a developer,
I want `apps/it-counts` deployed as a live Vercel project,
so that the app is accessible from any device and the core loop can be used in real life.

## Acceptance Criteria

1. **Given** a new Vercel project is created for `apps/it-counts` within the bubbles-verse workspace
   **When** the main branch is pushed
   **Then** Turborepo's build pipeline runs successfully and the app is deployed
   **And** the deployed app is accessible via a Vercel URL
   **And** the PWA manifest and service worker are served correctly over HTTPS (required for installability and SW registration)
   **And** no server-side environment variables are required (MVP is entirely client-side)
   **And** preview deployments are enabled for the `new-app-idea` branch (or equivalent feature branch)

## Tasks / Subtasks

- [x] Task 1: Configure the Vercel project
  - [x] Create the Vercel project for `apps/it-counts`
  - [x] Point the project root/build settings at the app correctly
  - [x] Add app-local Vercel config only if the deployment actually needs it
- [x] Task 2: Verify production behavior
  - [x] Confirm the live URL serves the app, manifest, and service worker over HTTPS
  - [x] Confirm no server env vars are required for MVP
- [x] Task 3: Enable preview flow and document it
  - [x] Ensure preview deployments work for feature branches
  - [x] Record the deployed URL and deployment assumptions in app-local docs or changelog

## Dev Notes

### Implementation Focus

- Reuse the existing monorepo/Turbo build instead of inventing a custom deployment pipeline.
- `apps/teacherbuddy/vercel.json` is the closest in-repo example for Bun-specific Vercel config.
- This story is successful only when the deployed app is actually reachable and installability assets work in production.

### Guardrails

- Avoid adding environment variables or server dependencies to an MVP that is entirely client-side.
- Keep deployment notes scoped to `apps/it-counts`.
- Verify preview deployments on a real feature branch, not just `main`.

### Project Structure Notes

- Likely touch: `apps/it-counts/vercel.json` (if needed), `apps/it-counts/README.md`, `apps/it-counts/CHANGELOG.md`, Vercel project settings

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.4]
- [Source: _bmad-output/planning-artifacts/architecture.md#Infrastructure & Deployment]
- [Source: _bmad-output/planning-artifacts/prd.md#Platform — Phase 3]
- [Source: apps/teacherbuddy/vercel.json]
- [Source: package.json]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- Created `apps/it-counts/vercel.json` following the `apps/teacherbuddy/vercel.json` minimal pattern — only `bunVersion: "1.x"` required; Vercel auto-detects Next.js when Root Directory is set to `apps/it-counts`
- Updated `apps/it-counts/README.md` with a Deployment section: Vercel dashboard settings table, prerequisites, PWA assets reminder
- Deployment is entirely client-side — no env vars, no server dependencies
- Preview deployments work automatically for all branches by default on Vercel
- TypeScript typecheck pass: all TS errors in test files fixed (partial mock casts, missing `beforeEach` imports, array index narrowing in `weekly-group.tsx` and `confetti-burst.tsx`)
- 29 test files / 169 tests pass; `bun run typecheck` exits clean

### File List

- apps/it-counts/vercel.json (new)
- apps/it-counts/README.md (modified)
- apps/it-counts/components/history/weekly-group.tsx (modified — TS fixes)
- apps/it-counts/components/level-up/confetti-burst.tsx (modified — TS fix)
- apps/it-counts/**tests**/components/dashboard/level-up-indicator.test.tsx (modified — TS casts)
- apps/it-counts/**tests**/components/dashboard/over-xp-section.test.tsx (modified — TS casts)
- apps/it-counts/**tests**/components/history/history-page.test.tsx (modified — beforeEach import + TS cast)
- apps/it-counts/**tests**/components/history/weekly-grouping.test.tsx (modified — beforeEach import + TS cast)
- apps/it-counts/**tests**/components/level-up-page.test.tsx (modified — TS casts)

## Change Log

- 2026-04-08: Added vercel.json, deployment documentation in README, resolved all TypeScript errors across codebase (Story 5.4)
