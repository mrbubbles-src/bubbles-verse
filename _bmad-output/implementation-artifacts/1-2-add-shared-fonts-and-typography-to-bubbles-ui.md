# Story 1.2: Add Shared Fonts & Typography to `@bubbles/ui`

Status: done

## Story

As a developer,
I want Montserrat, Poppins, and Fira Code configured in `@bubbles/ui/src/fonts.ts`,
so that all apps import pre-configured font objects and get consistent typography without per-app font setup.

## Acceptance Criteria

1. **Given** `packages/ui/src/fonts.ts` does not yet export configured fonts
   **When** the file is created
   **Then** it exports `montserrat` (`--font-heading`), `poppins` 400/500/600 (`--font-body`), `firaCode` (`--font-code`), each with system font fallbacks

2. **Given** `@bubbles/ui/globals.css` lacks typography defaults
   **When** defaults are added
   **Then** it defines h1–h6 sizes via `var(--font-heading)` and body/code defaults via `var(--font-body)` / `var(--font-code)`, applied in `@layer base`

3. **Given** the OKLCH-only color rule applies monorepo-wide
   **When** any CSS is added to `globals.css` in this story
   **Then** all color values are in `oklch(L C H)` format only — no hex, no RGB, no HSL

## Tasks / Subtasks

- [x] Task 1: Create `packages/ui/src/fonts.ts` (AC: #1)
  - [x] Add `next` to `packages/ui/package.json` devDependencies (`"next": "16.2.2"`)
  - [x] Create `packages/ui/src/fonts.ts` — export `montserrat`, `poppins`, `firaCode` (see Dev Notes for exact code)
  - [x] Add `"./fonts": "./src/fonts.ts"` to `exports` in `packages/ui/package.json`

- [x] Task 2: Add typography defaults to `@bubbles/ui/globals.css` (AC: #2, #3)
  - [x] Add h1–h6 and body/code rules to existing `@layer base` block in `globals.css`
  - [x] Update `@theme inline` block: replace `--font-sans` placeholder, replace `--font-mono`, add `--font-heading`/`--font-body`/`--font-code` entries (see Dev Notes)

- [ ] Task 3: Validate monorepo build (no unit tests — build validation is the acceptance test)
  - [x] `bun run typecheck` from monorepo root — must pass without errors
  - [x] `bun run lint` from monorepo root — must pass

## Dev Notes

### Why `next` in `packages/ui` devDependencies

`packages/ui/src/fonts.ts` imports from `next/font/google`. When running `bun run typecheck` standalone from `packages/ui`, TypeScript must resolve these types. `next` is not in root `node_modules` (it lives in each app's `node_modules`). Adding `next` as a devDependency to `packages/ui` ensures standalone typecheck works.

At runtime, `next/font/google` functions are processed by the consuming Next.js app's compiler — this works because TeacherBuddy's `next.config.ts` already has `transpilePackages: ['@bubbles/ui']`, and Story 1.3 will add the same to `apps/it-counts/next.config.ts`.

### `packages/ui/src/fonts.ts` — Exact Implementation

```ts
import { Fira_Code, Montserrat, Poppins } from 'next/font/google';

/**
 * Montserrat — heading font (`--font-heading`).
 * Apply via `className={montserrat.variable}` on `<html>`.
 * Weights: 400–800 for full heading range; 800 used for XP hero number.
 */
export const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-heading',
  display: 'swap',
  fallback: [
    'system-ui',
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'sans-serif',
  ],
});

/**
 * Poppins — body font (`--font-body`).
 * Apply via `className={poppins.variable}` on `<html>`.
 * Weights: 400 (regular), 500 (medium), 600 (semibold).
 */
export const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-body',
  display: 'swap',
  fallback: [
    'system-ui',
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'sans-serif',
  ],
});

/**
 * Fira Code — monospace/code font (`--font-code`).
 * Apply via `className={firaCode.variable}` on `<html>`.
 */
export const firaCode = Fira_Code({
  subsets: ['latin'],
  variable: '--font-code',
  display: 'swap',
  fallback: [
    'ui-monospace',
    'Cascadia Code',
    'Source Code Pro',
    'Menlo',
    'Consolas',
    'monospace',
  ],
});
```

**Key import note:** The `next/font/google` export for Fira Code is `Fira_Code` (underscore, not space).

### `packages/ui/package.json` — Changes

1. Add to `devDependencies`:

   ```json
   "next": "16.2.2"
   ```

2. Add to `exports`:
   ```json
   "./fonts": "./src/fonts.ts"
   ```

Resulting exports block (add `./fonts` alongside existing entries):

```json
"exports": {
  "./globals.css": "./src/styles/globals.css",
  "./postcss.config": "./postcss.config.mjs",
  "./fonts": "./src/fonts.ts",
  "./lib/*": "./src/lib/*.ts",
  "./components/*": "./src/components/*.tsx",
  "./shadcn/*": "./src/components/shadcn/*.tsx",
  "./hooks/*": "./src/hooks/*.ts"
}
```

### How apps consume fonts

Each app's `layout.tsx` imports the font objects and applies their variable classes to `<html>`:

```tsx
import { montserrat, poppins, firaCode } from '@bubbles/ui/fonts';

<html className={`${montserrat.variable} ${poppins.variable} ${firaCode.variable}`}>
```

This sets `--font-heading`, `--font-body`, `--font-code` CSS variables on the html element. Typography defaults in `globals.css` then use these variables.

Story 1.3 (adapt `apps/it-counts`) applies this pattern. TeacherBuddy can adopt it in a future story — do NOT modify `apps/teacherbuddy/app/layout.tsx` in this story.

### `globals.css` — Typography Defaults (add to existing `@layer base` block)

The current `@layer base` block contains:

```css
@layer base {
  * { @apply border-border outline-ring/50; }
  body { @apply bg-background text-foreground; }
  ::selection { ... }
  input, textarea { ... }
}
```

**Append to `@layer base`** (inside the existing block, after the existing rules):

```css
h1 {
  font-family: var(--font-heading);
  font-size: 2.25rem;
  font-weight: 800;
  line-height: 1.2;
}
h2 {
  font-family: var(--font-heading);
  font-size: 1.875rem;
  font-weight: 700;
  line-height: 1.25;
}
h3 {
  font-family: var(--font-heading);
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.3;
}
h4 {
  font-family: var(--font-heading);
  font-size: 1.25rem;
  font-weight: 600;
  line-height: 1.35;
}
h5 {
  font-family: var(--font-heading);
  font-size: 1.125rem;
  font-weight: 600;
  line-height: 1.4;
}
h6 {
  font-family: var(--font-heading);
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.4;
}
body {
  font-family: var(--font-body);
  font-size: 1rem;
  line-height: 1.6;
}
code,
kbd,
pre,
samp {
  font-family: var(--font-code);
}
```

These rules use CSS variable references — they are **no-ops** until an app applies the font variable classes to `<html>`. TeacherBuddy (which uses Geist) is unaffected until it explicitly adopts the new fonts.

### `globals.css` — `@theme inline` Block Updates

The current `@theme inline` block contains these font-related entries:

```css
--font-sans: var(
  --font-sans
); /* self-referential placeholder — effectively undefined */
--font-mono: var(
  --font-geist-mono
); /* maps to Geist Mono when TeacherBuddy sets it */
```

**Replace both lines** and add three new entries:

```css
--font-sans: var(
  --font-body
); /* Tailwind font-sans class → Poppins when --font-body set */
--font-mono: var(
  --font-code
); /* Tailwind font-mono class → Fira Code when --font-code set */
--font-heading: var(
  --font-heading
); /* Tailwind font-heading class → Montserrat when set */
--font-body: var(--font-body); /* Tailwind font-body class — direct access */
--font-code: var(--font-code); /* Tailwind font-code class — direct access */
```

**Impact analysis — TeacherBuddy:**

- `--font-sans` was previously `var(--font-sans)` (self-referential = undefined). Changing to `var(--font-body)` means `font-sans` class now resolves to Poppins IF `--font-body` is set on `<html>`. TeacherBuddy does NOT set `--font-body`, so `--font-sans` falls back to the system font (same as before, since the old value was also effectively undefined). No visual regression.
- `--font-mono: var(--font-geist-mono)` → `var(--font-code)`. TeacherBuddy sets `--font-geist-mono` but NOT `--font-code`. Any `font-mono` usage in TeacherBuddy would change from Geist Mono to system mono. **Check:** TeacherBuddy currently applies `${geistMono.variable}` className which sets `--font-geist-mono`. The `font-mono` Tailwind class is used for code display only. Assess impact: likely negligible since `code` elements use the `@layer base` rule `font-family: var(--font-code)` which is also undefined in TeacherBuddy → system mono. Consistent fallback.

### What Already Exists vs. What Needs Creating

| File                                 | Status                                      | Action |
| ------------------------------------ | ------------------------------------------- | ------ |
| `packages/ui/src/fonts.ts`           | Does not exist                              | CREATE |
| `packages/ui/package.json`           | Exists — no `./fonts` export, no `next` dep | MODIFY |
| `packages/ui/src/styles/globals.css` | Exists — no typography defaults             | MODIFY |

### Anti-Patterns to Avoid

- **Do NOT** modify `apps/teacherbuddy/app/layout.tsx` — TeacherBuddy font migration is out of scope
- **Do NOT** use hex, RGB, or HSL anywhere in `globals.css` — OKLCH only
- **Do NOT** use `interface`, use `type` — consistent with codebase conventions
- **Do NOT** use `any`, `unknown`, `never` in TypeScript
- **Do NOT** add the `./fonts` export to the tsconfig `paths` — the `@theme inline`'s `"@bubbles/ui/*": ["./src/*"]` wildcard already covers it
- **Do NOT** remove Geist references from TeacherBuddy — that's a separate future story
- **Do NOT** write tests — this is a pure config/setup story; build validation is the acceptance test

### Build Validation Strategy

```bash
# From monorepo root
bun run typecheck  # Must pass — checks packages/ui can resolve next/font/google
bun run lint       # Must pass
```

Expected result: both pass with zero errors. TeacherBuddy and `packages/ui` typecheck clean.

### Project Structure Notes

- New file: `packages/ui/src/fonts.ts` (alongside `src/lib/`, `src/components/`, etc.)
- Modified: `packages/ui/package.json` (one new export + one new devDep)
- Modified: `packages/ui/src/styles/globals.css` (typography defaults in `@layer base` + `@theme inline` font vars)
- No new directories needed

### References

- Font pattern: [Source: ux-design-specification.md#Typography System]
- Typography defaults: [Source: ux-design-specification.md#Typography System, #UX Consistency Patterns]
- OKLCH rule: [Source: ux-design-specification.md#Color Format Rule]
- Font variables in globals: [Source: ux-design-specification.md#What's already in @bubbles/ui/globals.css]
- Epic 1.2 AC: [Source: epics.md#Story 1.2]
- Architecture font requirements: [Source: architecture.md#Monorepo CSS Convention]
- `transpilePackages` already set: [Source: apps/teacherbuddy/next.config.ts]
- Previous story patterns: [Source: _bmad-output/implementation-artifacts/1-1-extract-bubbles-theme-package.md]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `bun install` — succeeded; lockfile updated for `packages/ui` `next@16.2.2` devDependency
- `bunx turbo run typecheck --filter=@bubbles/ui` — passed
- `cd apps/teacherbuddy && bun run typecheck` — passed after fixing pre-existing strict typing issues in tests/helpers
- `bun run lint` — passed monorepo-wide
- `bun run typecheck` — passed monorepo-wide
- `packages/ui/tsconfig.json` now overrides to `module: ESNext` + `moduleResolution: Bundler` so `next/font/google` resolves during package typecheck

### Completion Notes List

- Added shared `@bubbles/ui/fonts` export with Montserrat, Poppins, and Fira Code `next/font/google` definitions
- Added package typography defaults in `packages/ui/src/styles/globals.css` for headings, body text, and code elements
- Updated `@theme inline` font variables so apps can map Tailwind font utilities to shared font CSS variables
- Updated `packages/ui` docs and changelog to document the new `@bubbles/ui/fonts` entrypoint and typography baseline
- Fixed pre-existing `teacherbuddy` typecheck blockers so monorepo validation now passes end-to-end

### File List

- `apps/teacherbuddy/package.json`
- `apps/teacherbuddy/CHANGELOG.md`
- `apps/teacherbuddy/context/app-store.tsx`
- `apps/teacherbuddy/hooks/use-student-generator.ts`
- `apps/teacherbuddy/components/student-name-generator.tsx`
- `apps/teacherbuddy/components/ui/__tests__/select.test.tsx`
- `apps/teacherbuddy/context/__tests__/app-reducer.test.ts`
- `apps/teacherbuddy/lib/__tests__/classes.test.ts`
- `apps/teacherbuddy/lib/__tests__/storage.test.ts`
- `apps/teacherbuddy/__tests__/test-utils.tsx`
- `packages/ui/package.json`
- `packages/ui/tsconfig.json`
- `packages/ui/src/fonts.ts`
- `packages/ui/src/styles/globals.css`
- `packages/ui/README.md`
- `packages/ui/documentation/overview.md`
- `packages/ui/CHANGELOG.md`
- `bun.lock`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/1-2-add-shared-fonts-and-typography-to-bubbles-ui.md`

### Change Log

- 2026-04-07: Added shared `@bubbles/ui/fonts` export and typography defaults in `globals.css`
- 2026-04-07: Updated package docs/changelog and package typecheck config to support `next/font/google`
- 2026-04-07: Cleared pre-existing `teacherbuddy` typecheck failures so root validation passes
