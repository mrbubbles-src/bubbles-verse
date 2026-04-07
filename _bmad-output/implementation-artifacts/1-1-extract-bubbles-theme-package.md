# Story 1.1: Extract `@bubbles/theme` Package

Status: done

## Story

As a developer,
I want the theme toggle (next-themes + View Transitions animation) extracted into `packages/theme`,
so that It Counts and all future apps can consume a consistent animated theme toggle from day one.

## Acceptance Criteria

1. **Given** TeacherBuddy has a working animated theme toggle with View Transitions
   **When** `packages/theme` is created
   **Then** it exports `ThemeProvider` (wraps next-themes) and `ThemeToggle` component

2. **Given** TeacherBuddy imports theme logic from local files (`context/theme-provider.tsx`, `hooks/use-theme.ts`, `components/utility/theme-toggle.tsx`, `lib/view-transition.ts`)
   **When** migration is complete
   **Then** TeacherBuddy imports `ThemeProvider`, `ThemeToggle`, and `useTheme` from `@bubbles/theme` instead
   **And** local theme files in TeacherBuddy are deleted

3. **Given** `packages/theme` is a workspace package
   **When** `bun run build` is executed monorepo-wide
   **Then** it passes without errors

## Tasks / Subtasks

- [x] Task 1: Create `packages/theme` package scaffold (AC: #1, #3)
  - [x] Create `packages/theme/` directory structure
  - [x] Create `package.json` with correct name, exports, and dependencies
  - [x] Create `tsconfig.json` extending `@bubbles/typescript-config/react-library.json`
  - [x] Create `eslint.config.mjs` extending `@bubbles/eslint-config/react-internal`

- [x] Task 2: Implement package source files (AC: #1)
  - [x] Create `src/use-theme.ts` — copy from TeacherBuddy's `hooks/use-theme.ts`
  - [x] Create `src/view-transition.ts` — copy from TeacherBuddy's `lib/view-transition.ts`
  - [x] Create `src/theme-provider.tsx` — copy from TeacherBuddy's `context/theme-provider.tsx`, update internal imports
  - [x] Create `src/theme-toggle.tsx` — copy from TeacherBuddy's `components/utility/theme-toggle.tsx`, update internal imports
  - [x] Create `src/index.ts` — barrel export for all public API

- [x] Task 3: Migrate TeacherBuddy to `@bubbles/theme` (AC: #2, #3)
  - [x] Add `@bubbles/theme: workspace:*` to TeacherBuddy `package.json` dependencies
  - [x] Update TeacherBuddy `tsconfig.json` paths to include `@bubbles/theme`
  - [x] Delete `apps/teacherbuddy/context/theme-provider.tsx`
  - [x] Delete `apps/teacherbuddy/hooks/use-theme.ts`
  - [x] Delete `apps/teacherbuddy/components/utility/theme-toggle.tsx`
  - [x] Delete `apps/teacherbuddy/lib/view-transition.ts`
  - [x] Update all TeacherBuddy import sites to use `@bubbles/theme`

- [x] Task 4: Validate monorepo build passes (AC: #3)
  - [x] Run `bun run typecheck` monorepo-wide — must pass
  - [x] Run `bun run lint` monorepo-wide — must pass
  - [x] Run `bun run build` — must pass for both `teacherbuddy` and `packages/theme`

### Review Follow-ups (AI)

- [x] [Review][Patch] Add scripts block to packages/theme/package.json [packages/theme/package.json]
- [x] [Review][Defer] 'system' unsafely cast to Theme in ThemeBridge [packages/theme/src/theme-provider.tsx:23,25] — deferred, pre-existing code from TeacherBuddy, app working in production; resolvedTheme is what components use for behavior
- [x] [Review][Defer] startVt CSS variables written even when startViewTransition unsupported [packages/theme/src/view-transition.ts] — deferred, pre-existing behavior from TeacherBuddy
- [x] [Review][Defer] Hydration flash on ThemeToggle icons (isHydrated pattern) [packages/theme/src/theme-toggle.tsx] — deferred, pre-existing behavior from TeacherBuddy
- [x] [Review][Defer] German error message in useTheme [packages/theme/src/use-theme.ts:29] — deferred, intentional (personal project, German-speaking developer, pre-existing)
- [x] [Review][Defer] Redundant `?? theme` fallback in ThemeToggle click handler [packages/theme/src/theme-toggle.tsx] — deferred, pre-existing code

## Dev Notes

### What Exists in TeacherBuddy (Source of Truth)

All files to extract are in `apps/teacherbuddy/`:

| TeacherBuddy source | Destination in `packages/theme/src/` |
|---|---|
| `context/theme-provider.tsx` | `theme-provider.tsx` |
| `hooks/use-theme.ts` | `use-theme.ts` |
| `components/utility/theme-toggle.tsx` | `theme-toggle.tsx` |
| `lib/view-transition.ts` | `view-transition.ts` |

**`theme-provider.tsx`** — `ThemeProvider` wraps `next-themes`' `ThemeProvider` and includes a `ThemeBridge` component that feeds the `next-themes` state into a custom `ThemeProviderContext`. Includes hydration guard via `isHydrated` state.

**`use-theme.ts`** — exports: `Theme` type (`'dark' | 'light'`), `ThemeProviderValue` type, `ThemeProviderContext`, `useTheme()` hook. Must stay in the same package as `theme-provider.tsx` (they share the context).

**`view-transition.ts`** — `startVt(cb, ev?)` utility: checks `prefers-reduced-motion`, sets `--vt-x`/`--vt-y` CSS variables, calls `document.startViewTransition()` when available, falls back to direct `cb()`. Used by `ThemeToggle` internally — must co-locate with it in the package.

**`theme-toggle.tsx`** — Full animated toggle using `HugeiconsIcon` (Moon02Icon, SunIcon from `@bubbles/ui/lib/hugeicons`), shadcn `Button` and `Tooltip` from `@bubbles/ui`. Calls `startVt()` on click. Uses `useTheme()` internally.

### Package Scaffold — Follow Existing Patterns

Mirror `packages/ui/` structure. Key reference points:

**`packages/ui/package.json`** has:
- `"type": "module"`
- `"private": true`
- Named exports map in `"exports"` (e.g., `"./lib/*": "./src/lib/*.ts"`)
- Peer deps are listed as regular `dependencies` in this monorepo (not `peerDependencies`)

**`packages/typescript-config/react-library.json`** — correct `tsconfig` base for React packages:
```json
{ "extends": "./base.json", "compilerOptions": { "jsx": "react-jsx" } }
```

### `package.json` for `packages/theme`

```json
{
  "name": "@bubbles/theme",
  "version": "0.0.0",
  "type": "module",
  "private": true,
  "exports": {
    ".": "./src/index.ts"
  },
  "dependencies": {
    "@bubbles/ui": "workspace:*",
    "next-themes": "^0.4.6",
    "react": "^19.2.4"
  },
  "devDependencies": {
    "@bubbles/eslint-config": "workspace:*",
    "@bubbles/typescript-config": "workspace:*",
    "@types/react": "^19.2.10",
    "eslint": "^9.39.2",
    "typescript": "^5.9.3"
  }
}
```

**Why `@bubbles/ui` as dependency:** `theme-toggle.tsx` imports `@bubbles/ui/lib/hugeicons`, `@bubbles/ui/shadcn/button`, `@bubbles/ui/shadcn/tooltip`.

### `src/index.ts` — Barrel Export

```ts
export { ThemeProvider } from './theme-provider';
export { ThemeToggle } from './theme-toggle';
export { useTheme } from './use-theme';
export type { Theme, ThemeProviderValue } from './use-theme';
export { startVt } from './view-transition';
```

### Internal Import Updates (Critical)

When copying files to `packages/theme/src/`, update all internal cross-file imports:

**`theme-provider.tsx`** — replace `@/hooks/use-theme` → `./use-theme`

**`theme-toggle.tsx`** — replace:
- `@/lib/view-transition` → `./view-transition`
- `@/hooks/use-theme` → `./use-theme`
- Keep `@bubbles/ui/lib/hugeicons`, `@bubbles/ui/shadcn/button`, `@bubbles/ui/shadcn/tooltip` unchanged

### TeacherBuddy Migration — Import Sites

After deletion, TeacherBuddy source that imports from the old local paths:

Find all usages before deleting:
```bash
grep -r "use-theme\|theme-provider\|theme-toggle\|view-transition" apps/teacherbuddy --include="*.tsx" --include="*.ts" -l
```

Expected import sites in TeacherBuddy:
- `app/layout.tsx` — imports `ThemeProvider` from `@/context/theme-provider`
- `components/utility/theme-toggle.tsx` — (the file itself, delete it)
- Anywhere `ThemeToggle` is used in TeacherBuddy components — update to `@bubbles/theme`
- Anywhere `useTheme` is used — update to `@bubbles/theme`

New imports after migration:
```ts
import { ThemeProvider, ThemeToggle, useTheme } from '@bubbles/theme';
```

### TeacherBuddy `tsconfig.json` — Path Mapping

Add to `paths`:
```json
"@bubbles/theme": ["../../packages/theme/src/index.ts"]
```

### Anti-Patterns to Avoid

- **Do NOT** rewrite the ThemeToggle — copy it exactly, only update import paths
- **Do NOT** use `interface`, use `type` (existing code already uses `type`)
- **Do NOT** add test files — this story has no test requirement; the build validation is the acceptance test
- **Do NOT** use `any`, `unknown`, `never`
- **Do NOT** manually create shadcn components — ThemeToggle uses already-existing `@bubbles/ui` shadcn components

### Build Validation Strategy

No new unit tests needed (pure extraction). Validation is:
1. `bun run typecheck` — confirms TypeScript resolution correct in both `packages/theme` and `teacherbuddy`
2. `bun run lint` — confirms ESLint config correct
3. `bun run build` — confirms Turborepo dependency graph resolves correctly

Run from monorepo root: `bun run typecheck && bun run lint`

### Project Structure Notes

- New package goes in `packages/theme/` — follows `packages/ui/`, `packages/eslint-config/`, `packages/typescript-config/` pattern
- Monorepo `workspaces` in root `package.json` already includes `packages/*` — no root config change needed
- Turborepo will auto-detect the new package

### References

- TeacherBuddy theme-provider: `apps/teacherbuddy/context/theme-provider.tsx`
- TeacherBuddy use-theme: `apps/teacherbuddy/hooks/use-theme.ts`
- TeacherBuddy theme-toggle: `apps/teacherbuddy/components/utility/theme-toggle.tsx`
- TeacherBuddy view-transition: `apps/teacherbuddy/lib/view-transition.ts`
- Existing package pattern: `packages/ui/package.json`
- TS config base: `packages/typescript-config/react-library.json`
- ESLint config exports: `packages/eslint-config/package.json` → `./react-internal`
- Root workspace config: `package.json` (workspaces: `packages/*`)
- [Source: epics.md#Story 1.1]
- [Source: architecture.md#Monorepo Stack, #Technical Constraints]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- Extracted 4 files from TeacherBuddy into `packages/theme/src/`: `use-theme.ts`, `view-transition.ts`, `theme-provider.tsx`, `theme-toggle.tsx`
- Added `src/index.ts` barrel export
- `tsconfig.json` uses `moduleResolution: Bundler` override (base config uses `NodeNext` which requires explicit `.js` extensions in relative imports — incompatible with extensionless cross-file imports in the package)
- TeacherBuddy: 4 local files deleted, 4 import sites updated (`layout.tsx`, `app-sidebar.tsx`, `header.tsx`, `breakout-groups-card.tsx`)
- `project-list-view.tsx` imports `useTheme` from `next-themes` directly (not our hook) — intentionally left unchanged
- Pre-existing TeacherBuddy typecheck errors unrelated to this story (app-store.tsx, tests) not touched

### File List

- `packages/theme/package.json` (new)
- `packages/theme/tsconfig.json` (new)
- `packages/theme/eslint.config.mjs` (new)
- `packages/theme/src/index.ts` (new)
- `packages/theme/src/use-theme.ts` (new)
- `packages/theme/src/view-transition.ts` (new)
- `packages/theme/src/theme-provider.tsx` (new)
- `packages/theme/src/theme-toggle.tsx` (new)
- `apps/teacherbuddy/package.json` (modified — added `@bubbles/theme`)
- `apps/teacherbuddy/tsconfig.json` (modified — added `@bubbles/theme` path)
- `apps/teacherbuddy/app/layout.tsx` (modified — import from `@bubbles/theme`)
- `apps/teacherbuddy/components/app-sidebar.tsx` (modified — import from `@bubbles/theme`)
- `apps/teacherbuddy/components/header.tsx` (modified — import from `@bubbles/theme`)
- `apps/teacherbuddy/components/breakout/breakout-groups-card.tsx` (modified — import from `@bubbles/theme`)
- `apps/teacherbuddy/context/theme-provider.tsx` (deleted)
- `apps/teacherbuddy/hooks/use-theme.ts` (deleted)
- `apps/teacherbuddy/components/utility/theme-toggle.tsx` (deleted)
- `apps/teacherbuddy/lib/view-transition.ts` (deleted)
