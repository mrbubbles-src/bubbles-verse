# Codex Handoff: TeacherBuddy Sidebar/Header + Standalone Parity

Date: 2026-05-02  
Repo: `/Users/mrbubbles/dev/bubbles-verse`  
Branch: `new-app/dashboard`

## Current Goal

Keep `apps/teacherbuddy` behavior aligned with the standalone repo at `/Users/mrbubbles/dev/private/projects/teacherbuddy` while moving the reusable sidebar/header shell into `@bubbles/ui`.

Latest concrete focus:

- fix the desktop `PageInfoDialog` visibility regression
- verify parity with the standalone TeacherBuddy app
- keep sidebar/footer changes out of that parity check

## Status

Current worktree was clean before this handoff request.  
At handoff creation time, this repo has new uncommitted handoff-doc changes only if you continue editing after this file; before this file, the worktree was clean.

## What Was Already Completed

### Shared sidebar/header extraction

- Built a shared reusable sidebar shell in `@bubbles/ui`.
- Moved sidebar-related shared components into `packages/ui/src/components/bubbles-sidebar/`.
- Split header concerns out of `BubblesSidebarLayout` into a separate `BubblesAppHeader`.
- Kept TeacherBuddy-specific utilities injected from the app instead of hard-coding them into the package:
  - timer
  - theme toggle
  - page info dialog
  - route-specific subtitle/meta

### TeacherBuddy migration

- Migrated TeacherBuddy onto:
  - `@bubbles/ui/components/bubbles-sidebar-layout`
  - `@bubbles/ui/components/bubbles-app-header`
- Reworked TeacherBuddy header composition for desktop/mobile:
  - sticky top bar
  - breadcrumbs
  - injected help action
  - injected timer controls
  - injected theme toggle
- Switched TeacherBuddy footer usage to shared `@bubbles/footer`.

### Sidebar behavior fixes

- Collapsed sidebar is now icon-only without text leakage.
- Sidebar branding/logo alignment was adjusted.
- Header and mobile spacing were iterated repeatedly based on browser review comments.

### Runtime/bug fixes

- Added an app-local UUID helper in TeacherBuddy to avoid runtime crashes where `crypto.randomUUID()` is unavailable.
- Replaced direct UUID generation call sites in TeacherBuddy with that helper.

### Standalone parity investigation

- Compared monorepo TeacherBuddy against standalone TeacherBuddy.
- Confirmed the main desktop `PageInfoDialog` regression was not in the dialog component itself.
- Identified the actual root cause in the shared `Sheet` implementation inside `@bubbles/ui`.
- Fixed the shared `SheetContent` right-side class chain so desktop sheet content can render/animate correctly again.
- Relaxed the shared header subtitle truncation so descriptions behave closer to standalone TeacherBuddy.

### Regression protection

- Added a UI package regression test for the right-side `Sheet` desktop class path.

## Files Touched Or Investigated

### Shared package files

- `/Users/mrbubbles/dev/bubbles-verse/packages/ui/src/components/bubbles-sidebar/bubbles-app-header.tsx`
- `/Users/mrbubbles/dev/bubbles-verse/packages/ui/src/components/bubbles-sidebar/bubbles-breadcrumbs.tsx`
- `/Users/mrbubbles/dev/bubbles-verse/packages/ui/src/components/bubbles-sidebar/bubbles-sidebar-layout.tsx`
- `/Users/mrbubbles/dev/bubbles-verse/packages/ui/src/components/bubbles-sidebar/bubbles-sidebar-nav.tsx`
- `/Users/mrbubbles/dev/bubbles-verse/packages/ui/src/components/bubbles-sidebar/bubbles-sidebar-user-menu.tsx`
- `/Users/mrbubbles/dev/bubbles-verse/packages/ui/src/components/shadcn/sidebar.tsx`
- `/Users/mrbubbles/dev/bubbles-verse/packages/ui/src/components/shadcn/sheet.tsx`
- `/Users/mrbubbles/dev/bubbles-verse/packages/ui/src/components/shadcn/dialog.tsx`
- `/Users/mrbubbles/dev/bubbles-verse/packages/ui/src/lib/bubbles-sidebar.ts`
- `/Users/mrbubbles/dev/bubbles-verse/packages/ui/__tests__/bubbles-app-header.test.tsx`
- `/Users/mrbubbles/dev/bubbles-verse/packages/ui/__tests__/bubbles-sidebar-layout.test.tsx`
- `/Users/mrbubbles/dev/bubbles-verse/packages/ui/__tests__/sheet.test.tsx`
- `/Users/mrbubbles/dev/bubbles-verse/packages/ui/README.md`
- `/Users/mrbubbles/dev/bubbles-verse/packages/ui/CHANGELOG.md`
- `/Users/mrbubbles/dev/bubbles-verse/packages/ui/docs/sidebar-v1-spec.md`
- `/Users/mrbubbles/dev/bubbles-verse/packages/ui/docs/sidebar-header-direction.md`
- `/Users/mrbubbles/dev/bubbles-verse/packages/ui/docs/overview.md`

### TeacherBuddy files

- `/Users/mrbubbles/dev/bubbles-verse/apps/teacherbuddy/components/app-shell.tsx`
- `/Users/mrbubbles/dev/bubbles-verse/apps/teacherbuddy/components/play/quiz-timer-card.tsx`
- `/Users/mrbubbles/dev/bubbles-verse/apps/teacherbuddy/components/utility/page-info-dialog.tsx`
- `/Users/mrbubbles/dev/bubbles-verse/apps/teacherbuddy/components/dashboard/dashboard-cards.tsx`
- `/Users/mrbubbles/dev/bubbles-verse/apps/teacherbuddy/lib/sidebar.ts`
- `/Users/mrbubbles/dev/bubbles-verse/apps/teacherbuddy/lib/storage.ts`
- `/Users/mrbubbles/dev/bubbles-verse/apps/teacherbuddy/lib/uuid.ts`
- `/Users/mrbubbles/dev/bubbles-verse/apps/teacherbuddy/context/app-store.tsx`
- `/Users/mrbubbles/dev/bubbles-verse/apps/teacherbuddy/app/layout.tsx`
- `/Users/mrbubbles/dev/bubbles-verse/apps/teacherbuddy/README.md`
- `/Users/mrbubbles/dev/bubbles-verse/apps/teacherbuddy/CHANGELOG.md`
- `/Users/mrbubbles/dev/bubbles-verse/apps/teacherbuddy/docs/components.md`
- `/Users/mrbubbles/dev/bubbles-verse/apps/teacherbuddy/docs/routes.md`

### Shared footer/theme touched or checked

- `/Users/mrbubbles/dev/bubbles-verse/packages/footer/src/footer.tsx`

### Standalone repo files inspected for parity

- `/Users/mrbubbles/dev/private/projects/teacherbuddy/components/utility/page-info-dialog.tsx`
- `/Users/mrbubbles/dev/private/projects/teacherbuddy/components/ui/sheet.tsx`
- `/Users/mrbubbles/dev/private/projects/teacherbuddy/components/ui/dialog.tsx`
- `/Users/mrbubbles/dev/private/projects/teacherbuddy/components/header.tsx`
- broader diff against `/Users/mrbubbles/dev/private/projects/teacherbuddy`

## Commands / Tests Already Run

### Repeated validation runs during the session

- `bunx turbo run lint --filter=@bubbles/ui --filter=teacherbuddy`
- `bunx turbo run typecheck --filter=@bubbles/ui --filter=teacherbuddy`
- `bunx turbo run test --filter=@bubbles/ui --filter=teacherbuddy -- --run`

### Additional commands used

- `bunx prettier --write ...` on touched package/app files
- `git branch --show-current`
- `git status --short`
- `git log --oneline -8`
- `diff -ru ... /Users/mrbubbles/dev/private/projects/teacherbuddy /Users/mrbubbles/dev/bubbles-verse/apps/teacherbuddy`
- targeted `sed -n` / `rg` inspection across package + app files

### Latest known successful check state

- `@bubbles/ui` lint: passing
- `teacherbuddy` lint: passing
- `@bubbles/ui` typecheck: passing
- `teacherbuddy` typecheck: passing
- `@bubbles/ui` tests: passing
- `teacherbuddy` tests: passing

Notable latest test counts seen:

- `@bubbles/ui`: 3 test files, 11 tests passing
- `teacherbuddy`: 13 test files, 169 tests passing

## Known Errors, Warnings, Or Failing Checks

### Current known failing checks

- None known from the last command runs.

### Previously identified root cause that was fixed

- Desktop `PageInfoDialog` content was not visible because the shared `SheetContent` right-side Tailwind class chain in `/Users/mrbubbles/dev/bubbles-verse/packages/ui/src/components/shadcn/sheet.tsx` was malformed.
- Mobile/tablet still worked because they used the bottom-sheet path.

### Browser/manual verification caveat

- Several iterations relied on manual in-app browser reloads.
- If something looks stale, hard reload the app before assuming regression.

## Open Decisions

1. **How generic should the shared header become?**  
   Current direction:
   - sidebar behavior stays strongly package-opinionated
   - header defaults stay lean
   - app-specific actions get injected

2. **How far should TeacherBuddy continue to shape the package API?**  
   Current answer:
   - acceptable for defaults
   - not acceptable for hard-coded TeacherBuddy-only features

3. **How many `className` hook points should be exposed long-term?**  
   Current direction:
   - support override hooks to avoid repeatedly editing the package for app-local polish

4. **Header meta/help composition**  
   There was some drift from standalone TeacherBuddy:
   - info button relationship to title/subtitle changed during the refactor
   - current behavior was made closer again, but not necessarily pixel-identical

## Constraints, Preferences, And Do-Not-Touch Areas

### User preferences

- very concise communication
- do not dump files loosely into broad component folders; keep structure tidy
- prefer reusable package-level fixes when the issue is truly shared
- do not over-generalize TeacherBuddy-specific behavior into `@bubbles/ui`
- sidebar behavior may be opinionated globally
- header extras should be injected per app
- provide `className`-style escape hatches instead of repeated package surgery

### Explicit do-not-touch / comparison boundaries

- when comparing TeacherBuddy against standalone, **do not treat sidebar and footer differences as regressions**
- standalone parity checks were about the rest of the app behavior

### Implementation constraints from repo instructions

- use `apply_patch` for manual file edits
- run formatting, linting, and typechecking before finishing
- keep docs/changelogs updated close to changed code
- avoid `any`, `unknown`, `never` unless absolutely necessary
- for Next.js work, verify against local Next docs because this repo uses a newer/breaking variant

### Practical architectural constraint

- `teacherbuddy` is/was the only active consumer of `BubblesSidebarLayout`, so breaking API cleanup inside the package has been acceptable so far

## What Still Seems Most Important Next

1. Manually verify in the browser that desktop `PageInfoDialog` now opens with visible content after a hard reload.
2. Re-check that mobile/tablet header layout is still correct after the shared `Sheet` and subtitle adjustments.
3. Decide whether the shared header should get one more pass to match standalone TeacherBuddy semantics more closely around title/help/subtitle.
4. If another app starts using the shared sidebar shell, validate that the injected-header model is sufficient without more package-level assumptions.

## Next 3–7 Concrete Steps

1. Start `teacherbuddy` and hard reload the app.
2. Click the page info/help button on desktop and confirm the right-side sheet content is visible and animated correctly.
3. Check the same page info/help flow on tablet/mobile breakpoints to ensure the bottom-sheet path still behaves correctly.
4. Compare the current TeacherBuddy top header against the standalone repo one more time and decide whether the title/help/subtitle relationship needs a final parity pass.
5. If parity still feels off, change only the injected TeacherBuddy header composition first; avoid pushing more TeacherBuddy-specific assumptions into `@bubbles/ui`.
6. If no further parity issues appear, commit the shared `Sheet` fix, header subtitle adjustment, regression test, and changelog updates.

## Reactivation Prompt

Paste this into a fresh Codex chat:

```text
Continue from this handoff file:
/Users/mrbubbles/dev/bubbles-verse/docs/codex-handoffs/2026-05-02-teacherbuddy-sidebar-handoff.md

Repo: /Users/mrbubbles/dev/bubbles-verse
Branch: new-app/dashboard

Please read the handoff first, then inspect the current git/worktree state before changing anything.

Important context:
- Work focused on apps/teacherbuddy and packages/ui
- TeacherBuddy was migrated onto the shared sidebar/header shell in @bubbles/ui
- The main recent regression was the desktop PageInfoDialog sheet not showing content; root cause was in packages/ui/src/components/shadcn/sheet.tsx right-side classes
- Sidebar/footer differences vs the standalone repo are intentional and should not be treated as parity bugs
- App-specific header extras should stay injected from TeacherBuddy, not hard-coded globally into @bubbles/ui

First do:
1. confirm current git status and branch
2. review the handoff
3. run or verify the most relevant checks
4. continue from the “Next 3–7 Concrete Steps” section
```
