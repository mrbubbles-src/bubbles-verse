# Story 5.4: Vercel Deployment

Status: ready-for-dev

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

- [ ] Task 1: Configure the Vercel project
  - [ ] Create the Vercel project for `apps/it-counts`
  - [ ] Point the project root/build settings at the app correctly
  - [ ] Add app-local Vercel config only if the deployment actually needs it
- [ ] Task 2: Verify production behavior
  - [ ] Confirm the live URL serves the app, manifest, and service worker over HTTPS
  - [ ] Confirm no server env vars are required for MVP
- [ ] Task 3: Enable preview flow and document it
  - [ ] Ensure preview deployments work for feature branches
  - [ ] Record the deployed URL and deployment assumptions in app-local docs or changelog

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

GPT-5 Codex

### Debug Log References

### Completion Notes List

### File List
