# Story 1.3: Adapt `apps/it-counts` to Monorepo Conventions

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want `apps/it-counts` fully integrated into the bubbles-verse monorepo,
so that it uses shared configs, shared packages, shared shadcn primitives, and the verified Next.js 16.2.2 setup already used across the workspace.

## Acceptance Criteria

1. **Given** `apps/it-counts` has a `create-next-app` scaffold with `components.json` already present
   **When** monorepo adaptation is complete
   **Then** `package.json` lists `@bubbles/ui`, `@bubbles/theme`, `@bubbles/eslint-config`, `@bubbles/typescript-config` as workspace dependencies

2. **Given** monorepo shared configs are required
   **When** adaptation is complete
   **Then** `tsconfig.json` extends `@bubbles/typescript-config/nextjs.json`
   **And** `eslint.config.mjs` extends `@bubbles/eslint-config/next-js`

3. **Given** the app must stay on the verified Next.js line
   **When** adaptation is complete
   **Then** `next.config.ts` targets Next.js 16.2.2 conventions
   **And** keeps `transpilePackages` for local workspace packages
   **And** keeps `reactCompiler` enabled

4. **Given** the monorepo CSS convention requires one app-local stylesheet
   **When** adaptation is complete
   **Then** `app/it-counts.css` exists as the app-specific stylesheet
   **And** it is imported from `app/layout.tsx`
   **And** app-specific CSS stays minimal

5. **Given** Story 1.2 added shared fonts and typography to `@bubbles/ui`
   **When** adaptation is complete
   **Then** `app/layout.tsx` imports fonts from `@bubbles/ui/fonts`
   **And** applies the font variable classes to `<html>`
   **And** wraps children in `@bubbles/theme` `ThemeProvider`

6. **Given** this repo centralizes shadcn primitives in `packages/ui`
   **When** required primitives are audited
   **Then** `sheet`, `badge`, `button`, `input`, and `sonner` are reused from `@bubbles/ui`
   **And** missing `progress` is added via the official shadcn CLI in `packages/ui`
   **And** no duplicate local `apps/it-counts/components/ui/*` files are created

7. **Given** the UX spec requires a global 44px touch target
   **When** the shared shadcn `Button` is updated
   **Then** `touch-hitbox` is added globally to `packages/ui/src/components/shadcn/button.tsx`
   **And** that is the only intentional behavior change in the shared button for this story

8. **Given** the app already partially works
   **When** this story is finished
   **Then** `bun run typecheck`, `bun run lint`, and `bun run build` in `apps/it-counts` pass
   **And** `bun run dev` starts without errors

9. **Given** repo policy requires local docs and changelogs close to the app
   **When** this story is completed
   **Then** `apps/it-counts/README.md` documents the real monorepo workflow
   **And** `apps/it-counts/CHANGELOG.md` is created or updated with Story 1.3 changes

## Tasks / Subtasks

- [x] Task 1: Finish app-level monorepo alignment without regressing existing work (AC: 1, 2, 3, 4, 5, 8)
  - [x] Preserve the current good state in `apps/it-counts/package.json`, `tsconfig.json`, `eslint.config.mjs`, and `next.config.ts`; do delta work only
  - [x] Import `./it-counts.css` from `apps/it-counts/app/layout.tsx` alongside `@bubbles/ui/globals.css`
  - [x] Keep `ThemeProvider` from `@bubbles/theme` and the shared font variable classes on `<html>`
  - [x] Do not remove `transpilePackages`, `reactCompiler`, or the workspace path aliases
  - [x] Do not downgrade `next`, `react`, or `react-dom`

- [x] Task 2: Complete shared shadcn setup in `packages/ui` and keep It Counts consuming the shared registry (AC: 6, 7)
  - [x] Audit the existing shared shadcn inventory before generating anything
  - [x] Reuse the already-present shared files: `sheet.tsx`, `badge.tsx`, `button.tsx`, `input.tsx`, `sonner.tsx`
  - [x] Add the missing `progress` primitive via the official CLI from `packages/ui` using that package's `components.json`
  - [x] Update `packages/ui/src/components/shadcn/button.tsx` to include `touch-hitbox`
  - [x] Do not run the CLI in a way that generates `apps/it-counts/components/ui/*` duplicates

- [x] Task 3: Replace leftover app boilerplate docs with real app-local documentation (AC: 9)
  - [x] Rewrite `apps/it-counts/README.md` to use Bun commands and explain the shared package setup
  - [x] Create `apps/it-counts/CHANGELOG.md`
  - [x] Record the Story 1.3 adaptation work in the changelog
  - [x] Keep documentation scoped to `apps/it-counts`; do not put app-local notes in the root README/CHANGELOG

- [x] Task 4: Validate the app after the delta changes (AC: 8)
  - [x] Run `bun run typecheck` in `apps/it-counts`
  - [x] Run `bun run lint` in `apps/it-counts`
  - [x] Run `bun run build` in `apps/it-counts`
  - [x] Run `bun run dev` in `apps/it-counts` and confirm clean startup

## Dev Notes

### Verified Current Snapshot

- `apps/it-counts/package.json` is already mostly adapted:
  - workspace deps already include `@bubbles/theme` and `@bubbles/ui`
  - dev deps already include `@bubbles/eslint-config` and `@bubbles/typescript-config`
  - Bun-based scripts already match the monorepo pattern
  - `next` is already `16.2.2`
- `apps/it-counts/tsconfig.json` already extends `@bubbles/typescript-config/nextjs.json` and already includes the important workspace path aliases.
- `apps/it-counts/eslint.config.mjs` already extends `@bubbles/eslint-config/next-js`.
- `apps/it-counts/next.config.ts` already contains:
  - `transpilePackages: ['@bubbles/ui', '@bubbles/theme']`
  - `reactCompiler: true`
- `apps/it-counts/app/layout.tsx` already imports:
  - `@bubbles/ui/globals.css`
  - `ThemeProvider` from `@bubbles/theme`
  - `firaCode`, `montserrat`, `poppins` from `@bubbles/ui/fonts`
- `apps/it-counts/app/it-counts.css` exists already, but is not imported yet. That is the clearest remaining app-level gap.
- `apps/it-counts/README.md` is still untouched `create-next-app` boilerplate.
- `apps/it-counts/CHANGELOG.md` does not exist yet.
- `apps/it-counts/app/page.tsx` is still the starter page. Do not turn this story into dashboard implementation. Keep scope on monorepo adaptation and shared UI plumbing.

### Previous Story Intelligence

- Story 1.2 already created `@bubbles/ui/fonts` and package-level typography defaults.
- Story 1.2 also documented the critical dependency: apps must apply the shared font variable classes on `<html>` and keep `@bubbles/ui` transpiled so `next/font/google` usage works correctly from the shared package.
- `packages/ui` typecheck was adjusted to work with `next/font/google`; do not undo those package-level changes while working on It Counts.
- Story 1.2 explicitly deferred TeacherBuddy font adoption. Story 1.3 must focus on `apps/it-counts`, not back-edit `apps/teacherbuddy`.

### Git Intelligence

Recent commits confirm the intended order:

1. `feat: add planning artifacts for It Counts project`
2. `feat: integrate @bubbles/theme into teacherbuddy app`
3. `feat: add shared fonts and typography to @bubbles/ui`
4. `chore: finalize shared fonts integration in teacherbuddy app`

Interpretation:

- `@bubbles/theme` and `@bubbles/ui/fonts` are already the approved shared primitives.
- This story should consume them, not recreate local theme/font infrastructure in `apps/it-counts`.

### Shared shadcn Guardrails

- This repo centralizes shadcn primitives in `packages/ui/src/components/shadcn/`.
- `apps/it-counts/components.json` points `ui` to `@bubbles/ui/components/shadcn`, which means the app is meant to consume the shared registry, not own a local `components/ui` tree.
- Verified current inventory in `packages/ui/src/components/shadcn/`:
  - present: `sheet.tsx`, `badge.tsx`, `button.tsx`, `input.tsx`, `sonner.tsx`
  - missing: `progress.tsx`
- Because of that inventory, the safest implementation is:
  - keep consuming the existing shared primitives
  - add only missing `progress` via CLI in `packages/ui`
  - avoid regenerating already-existing shared files unless the CLI intentionally updates them and the diff is reviewed carefully

### Next.js 16.2.2 Verification

Latest version verification was done against:

- `nextjs-docs://llms-index` via Next DevTools MCP — doc version reports `16.2.2`
- local docs in `apps/it-counts/node_modules/next/dist/docs/`

Verified rules relevant to this story:

- Global CSS is imported from the root layout in App Router apps.
- App-wide fonts from `next/font` should be applied in the root layout.
- `transpilePackages` is the supported Next.js config for transpiling local monorepo packages.
- `reactCompiler` is a supported Next.js config and requires `babel-plugin-react-compiler`, which `apps/it-counts` already has.

### Quality Gates Already Verified Before Story Creation

The current baseline in `apps/it-counts` is green:

- `bun run typecheck` — passes
- `bun run lint` — passes
- `bun run build` — passes on Next.js 16.2.2

This means the story is working from a healthy baseline. Treat any new failures as regressions introduced by the story work.

### Testing Requirements

- This story is primarily config / shared-UI plumbing / documentation work.
- No new app behavior is introduced yet, so new Vitest coverage is not automatically required.
- If implementation expands beyond config/docs and changes runtime behavior, add tests under `apps/it-counts/__tests__/...` only.
- Never colocate tests with source files. [Source: epics.md#ARCH12; architecture.md#Complete Project Directory Structure]

### Project Structure Notes

- Keep using:
  - `apps/it-counts/app/` for App Router files
  - `apps/it-counts/app/it-counts.css` for app-local CSS only
  - `packages/ui/` for shared shadcn primitives
  - `packages/theme/` for theme provider / theme toggle infra
- Do not create local copies of shared theme or shadcn code in `apps/it-counts`.
- `apps/teacherbuddy` is the best in-repo reference for monorepo wiring patterns (`next.config.ts`, `tsconfig.json`, shared package imports), but do not copy its app-specific metadata, cookies logic, or shell structure into It Counts.
- The architecture doc still mentions Next.js `16.1.6` in one stack table, but the verified live source of truth for this story is `16.2.2`:
  - `apps/it-counts/package.json`
  - Next DevTools docs index
  - local Next.js docs in `apps/it-counts/node_modules/next/dist/docs/`

### Files Likely Touched

- `apps/it-counts/app/layout.tsx`
- `apps/it-counts/app/it-counts.css`
- `apps/it-counts/README.md`
- `apps/it-counts/CHANGELOG.md` (new)
- `packages/ui/src/components/shadcn/button.tsx`
- `packages/ui/src/components/shadcn/progress.tsx` (new, CLI-generated)
- Possibly `packages/ui/package.json`, `packages/ui/components.json`, and `bun.lock` if the CLI adds or updates shared package dependencies

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.3]
- [Source: _bmad-output/planning-artifacts/epics.md#ARCH2]
- [Source: _bmad-output/planning-artifacts/epics.md#ARCH3]
- [Source: _bmad-output/planning-artifacts/epics.md#ARCH12]
- [Source: _bmad-output/planning-artifacts/architecture.md#Monorepo CSS Convention]
- [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Handoff]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#shadcn-first,-two-layer-approach]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#shadcn-Components-(install-via-CLI,-minimal-changes)]
- [Source: _bmad-output/implementation-artifacts/1-2-add-shared-fonts-and-typography-to-bubbles-ui.md#Dev Notes]
- [Source: apps/it-counts/package.json]
- [Source: apps/it-counts/next.config.ts]
- [Source: apps/it-counts/tsconfig.json]
- [Source: apps/it-counts/eslint.config.mjs]
- [Source: apps/it-counts/app/layout.tsx]
- [Source: apps/it-counts/app/it-counts.css]
- [Source: apps/it-counts/README.md]
- [Source: apps/it-counts/components.json]
- [Source: packages/ui/components.json]
- [Source: packages/ui/src/components/shadcn/button.tsx]
- [Source: packages/eslint-config/package.json]
- [Source: packages/eslint-config/next.js]
- [Source: packages/typescript-config/nextjs.json]
- [Source: apps/teacherbuddy/next.config.ts]
- [Source: apps/teacherbuddy/tsconfig.json]
- [Source: apps/teacherbuddy/app/layout.tsx]
- [Source: apps/it-counts/node_modules/next/dist/docs/01-app/01-getting-started/11-css.md]
- [Source: apps/it-counts/node_modules/next/dist/docs/01-app/01-getting-started/13-fonts.md]
- [Source: apps/it-counts/node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/transpilePackages.md]
- [Source: apps/it-counts/node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/reactCompiler.md]
- [Source: nextjs-docs://llms-index @doc-version 16.2.2]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `bun run typecheck` in `packages/ui` — passes
- `bun run typecheck` in `apps/it-counts` — passes
- `bun run lint` in `apps/it-counts` — passes
- `bun run build` in `apps/it-counts` — passes
- `bun run dev` in `apps/it-counts` — starts cleanly on `http://localhost:3000`
- `npx -y playwright@1.54.2 screenshot --browser chromium --channel chrome --full-page --viewport-size "1280,900" http://localhost:3000 /Users/mrbubbles/dev/bubbles-verse/apps/it-counts/.tmp-homepage.png` — loads the app successfully in headless Chrome

### Completion Notes List

- Imported `app/it-counts.css` from the root layout, replaced starter metadata, and kept the existing shared fonts, theme provider, and monorepo config wiring intact
- Added the shared `progress` primitive via the official shadcn CLI in `packages/ui` and applied `touch-hitbox` globally in the shared button without creating local app UI duplicates
- Replaced the app boilerplate README, created an app-local changelog, and removed the starter page's remaining browser warning so runtime validation stays clean

### File List

- `_bmad-output/implementation-artifacts/1-3-adapt-apps-it-counts-to-monorepo-conventions.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `apps/it-counts/CHANGELOG.md`
- `apps/it-counts/README.md`
- `apps/it-counts/app/layout.tsx`
- `apps/it-counts/app/page.tsx`
- `packages/ui/src/components/shadcn/button.tsx`
- `packages/ui/src/components/shadcn/progress.tsx`
