# Dashboard Draft Sidebar Handoff

Date: 2026-05-02  
Repo: `/Users/mrbubbles/dev/bubbles-verse`  
Branch: `new-app/dashboard`

## Current goal

Finish and preserve the dashboard sidebar draft-item polish work in
`apps/dashboard` / `@bubbles/ui`, specifically:

- nested `Entwürfe` child items
- trailing dismiss `X`
- hover/active color behavior
- no overlap between label text and action icon
- stable behavior when hovering near, on, and between child items

At the end of this session, the bug is **substantially improved and functionally
stable**, but a fresh Codex should still start with a **manual browser
verification pass** before assuming it is fully done.

## Current status

- `HEAD`: `fb9033a feat: enhance markdown rendering and dashboard styles`
- Current worktree from `git status --short`:
  - `?? docs/codex-handoffs/`
- Meaning:
  - no tracked code changes are currently dirty
  - this handoff location itself is currently untracked in git in this worktree

## What we already completed

### Sidebar draft-item bug investigation

- Compared our current dashboard sidebar implementation against the external
  repo:
  - `/Users/mrbubbles/dev/novari/novari-education-portal`
- Focused on the Topics draft/sidebar flow there because it has the closest
  analogue to our `Neuer Eintrag (Draft)` / `Eintrag bearbeiten (Draft)` items.
- Confirmed the crucial architectural difference:
  - Novari does **not** use the generic shared `SidebarMenuAction` primitive
    for nested draft delete actions.
  - Instead, nested draft delete uses its **own sub-item-scoped button**.

### Root cause we found

The main issue was not just “wrong color classes”.

It was a combination of:

1. A **generic top-level action primitive** (`SidebarMenuAction`) being reused
   for **nested** draft child items.
2. That primitive carrying broader hover/peer/group behavior intended for
   normal sidebar items.
3. An **absolutely positioned action button** beside a separately hoverable
   label/button surface.
4. Right-side spacing and active/hover color rules fighting each other while
   we iterated on fixes.

This produced several symptoms:

- all child `X` icons reacting together
- hover “dead zones” or strange tiny trigger areas near the item edge
- the active item `X` changing color when hovering a sibling
- text and `X` overlapping
- temporary regressions where the `X` sat on the wrong background or looked too
  dim

### What we changed

#### Shared UI package

- Removed reliance on the generic shared `SidebarMenuAction` for nested
  draft-child actions.
- Added a **custom nested action button path** in:
  - `packages/ui/src/components/bubbles-sidebar/bubbles-sidebar-nav.tsx`
- Kept that custom nested action:
  - scoped to `menu-sub-item` / `menu-sub-button`
  - transparent background
  - color-coupled to the correct child item hover/active state
  - vertically centered with `top-1/2 -translate-y-1/2`
  - with a smoother transition
- Restored `data-sidebar="menu-action"` on the nested button so the existing
  right-padding reservation logic still works.
- Adjusted nested sub-button styling in:
  - `packages/ui/src/components/shadcn/sidebar.tsx`
  so child-item transitions feel smoother and the right-side action gutter is
  respected.

#### Dashboard app

- Simplified dashboard-local draft action classes in:
  - `apps/dashboard/lib/sidebar.ts`
- Stopped trying to “fight” the shared primitive with lots of broad local hover
  overrides.
- Kept only the minimal nested child-item color coupling needed for the draft
  dismiss icon.

### Docs/tests already updated

- `packages/ui/CHANGELOG.md`
- `apps/dashboard/CHANGELOG.md`
- `packages/ui/__tests__/bubbles-sidebar-layout.test.tsx`
- `apps/dashboard/__tests__/lib/sidebar.test.ts`

## Files touched or investigated

### Touched in this sidebar-draft session

- `apps/dashboard/lib/sidebar.ts`
- `apps/dashboard/__tests__/lib/sidebar.test.ts`
- `apps/dashboard/CHANGELOG.md`
- `packages/ui/src/components/shadcn/sidebar.tsx`
- `packages/ui/src/components/bubbles-sidebar/bubbles-sidebar-nav.tsx`
- `packages/ui/__tests__/bubbles-sidebar-layout.test.tsx`
- `packages/ui/CHANGELOG.md`

### Investigated in this repo

- `packages/ui/src/lib/bubbles-sidebar.ts`
- `packages/ui/src/components/shadcn/button.tsx`
- `packages/ui/src/styles/globals.css`
- `apps/dashboard/components/app-shell.tsx`
- existing handoff docs under `docs/codex-handoffs/`

### External repo investigated for comparison

- `/Users/mrbubbles/dev/novari/novari-education-portal/src/global/navigation/useAppSidebarDrafts.ts`
- `/Users/mrbubbles/dev/novari/novari-education-portal/src/global/navigation/types.ts`
- `/Users/mrbubbles/dev/novari/novari-education-portal/src/global/navigation/nav-main.tsx`
- `/Users/mrbubbles/dev/novari/novari-education-portal/src/global/navigation/__tests__/app-sidebar.test.tsx`
- `/Users/mrbubbles/dev/novari/novari-education-portal/src/components/ui/sidebar.tsx`

## Commands / tests already run

### Repo / git inspection

- `pwd`
- `git rev-parse --show-toplevel`
- `git branch --show-current`
- `git status --short`
- `git log --oneline --decorate -n 12`

### Search / file inspection

- many `rg -n ...`
- many `sed -n ...`
- `nl -ba ...`

### External repo comparison

- searched and read Novari navigation/sidebar files
- used one explorer sub-agent to inspect Novari draft navigation patterns
- used one explorer sub-agent to inspect the remaining local hover bug

### Browser / media inspection

- inspected multiple in-app-browser screenshots from the user
- attempted video tooling checks:
  - `which ffmpeg`
  - `which ffprobe`
- used Quick Look thumbnail generation instead:
  - `qlmanage -t -s 1200 -o /tmp "<video>.mp4"`
- inspected generated thumbnail image locally

### Formatting / validation run repeatedly

#### `packages/ui`

Run multiple times successfully:

- `bun --bun vitest run __tests__/bubbles-sidebar-layout.test.tsx`
- `bun --bun eslint src/components/bubbles-sidebar/bubbles-sidebar-nav.tsx ...`
- `bun --bun eslint src/components/shadcn/sidebar.tsx ...`
- `bun --bun tsc --noEmit`

#### `apps/dashboard`

Run multiple times successfully:

- `bun --bun vitest run __tests__/lib/sidebar.test.ts`
- `bun --bun vitest run __tests__/lib/sidebar.test.ts __tests__/components/app-shell.test.tsx`
- `bun --bun eslint lib/sidebar.ts __tests__/lib/sidebar.test.ts`
- `bun --bun next typegen && bun --bun tsc`

#### Prettier

- `./node_modules/.bin/prettier --write ...` on touched files

## Known errors, warnings, or failing checks

### Current repo/code state

- No known failing lint/test/typecheck in the last successful runs for the
  touched dashboard sidebar files.

### Environment/tooling gotchas seen during this session

These are useful if a fresh Codex tries to replay commands:

1. `bun`, `bunx`, `npx`, `npm` were not always on `PATH`.
   - Working workaround:
     - `export PATH="$HOME/.bun/bin:$PATH"`

2. Running some Vitest/Vite commands through the wrong node/runtime path caused
   a local `rolldown` native-binding failure.
   - Error looked like:
     - `Cannot find native binding`
     - `ERR_DLOPEN_FAILED`
   - Using the actual local `bun` toolchain fixed that.

3. ESLint run from the wrong cwd failed with:
   - `ESLint couldn't find an eslint.config.(js|mjs|cjs) file`
   - This was a cwd/invocation issue, not a repo-wide config bug.

4. `ffmpeg` / `ffprobe` were not installed in this environment.
   - Quick Look thumbnail generation worked as a fallback for video review.

### Residual product risk

- The current implementation is much better, but the issue was **highly
  interaction-specific** and depended on tiny mouse positions.
- A fresh Codex should still assume **manual browser verification is required**
  before calling the sidebar behavior completely done.

## Open decisions

1. Whether the current nested-action solution should remain an internal special
   case in `bubbles-sidebar-nav.tsx`, or eventually become a first-class shared
   primitive for nested trailing actions.

2. Whether to add a broader app-shell/sidebar integration test or visual test
   for this interaction.
   - Current unit tests cover class structure.
   - They do **not** truly prove browser hover geometry.

3. Whether to keep the current hover/transition timing as-is, or tune it one
   final step after another manual UX pass.

## Constraints, user preferences, and do-not-touch areas

### User preferences from this session

- Be concise.
- Investigate carefully, not just guess.
- Compare against the Novari repo, but **do not** copy it 1:1.
- Adapt any useful pattern to this monorepo’s structure.
- The sidebar/draft behavior matters more than abstract reuse purity.
- Use sub-agents freely if useful.

### Repo constraints from `AGENTS.md`

- If significantly changing a file, ask first.
- Use `apply_patch` for manual file edits.
- Run formatting, linting, and typechecking before finishing.
- Add/update tests for functional changes.
- Update docs and changelog close to the changed code.
- Avoid `any`, `unknown`, `never` unless necessary.
- This repo’s Next.js may differ from training data; check local docs if doing
  Next.js work.

### Do-not-touch / caution areas

- Do not blindly copy Radix-era Novari code into this repo’s Base-UI/shared
  package structure.
- Preserve the current shared-vs-app separation:
  - shared hover/hitbox primitives in `packages/ui`
  - app-specific draft semantics in `apps/dashboard`
- Avoid regressing top-level sidebar actions while tweaking nested draft items.

## Next 3–7 concrete steps

1. Reload the dashboard in the in-app browser and manually test the nested
   draft items again:
   - hover directly on `X`
   - hover on active child label
   - hover on inactive sibling
   - hover just before/after the child surface edge

2. If a residual issue still exists, inspect the exact live DOM/classes in the
   browser for:
   - the active child `SidebarMenuSubButton`
   - the nested custom action button
   - the surrounding `SidebarMenuSubItem`

3. If needed, tune only one of these at a time:
   - nested action hitbox size/position
   - child-item right padding
   - transition timing/easing
   - child-item hover background scope

4. If the browser behavior is now fully clean, consider extracting the nested
   action pattern into a tiny shared helper/primitive instead of leaving it only
   inside `bubbles-sidebar-nav.tsx`.

5. If you continue refactoring, re-run:
   - `packages/ui` test/lint/typecheck
   - `apps/dashboard` sidebar test/lint/typecheck

## Reactivation prompt

Paste this into a fresh Codex chat:

```text
Continue from this handoff file:
/Users/mrbubbles/dev/bubbles-verse/docs/codex-handoffs/2026-05-02-dashboard-draft-sidebar-handoff.md

Repo: /Users/mrbubbles/dev/bubbles-verse
Branch: new-app/dashboard

Please read the handoff first, then inspect the current git/worktree state.

Primary task:
- continue the dashboard nested draft sidebar polish work
- verify the current `Entwürfe` child-item dismiss `X` behavior in the browser
- only make further changes if a real residual hover/active geometry bug still remains

Important context:
- we compared against /Users/mrbubbles/dev/novari/novari-education-portal
- do not copy Novari blindly
- preserve the current shared `packages/ui` vs app-local `apps/dashboard` split
- use the local bun toolchain (`export PATH="$HOME/.bun/bin:$PATH"`) if PATH issues appear
```
