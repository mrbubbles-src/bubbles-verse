---
story_id: '1.1'
story_key: '1-1-scaffold-bubbles-markdown-renderer'
epic: 'Epic 1 — Package Infrastructure'
status: done
created: 2026-04-12
---

# Story 1.1 — Scaffold `@bubbles/markdown-renderer`

## User Story

As a developer,
I want `@bubbles/markdown-renderer` scaffolded as a proper monorepo package,
So that I can consume it via `workspace:*` in any app without manual setup.

---

## Context

This is a **pure scaffold story** — no component logic, no MDX rendering. The goal is a correctly wired, buildable package skeleton that future stories (Epic 2, Epic 5) will fill with implementation. Get the structure right once here; everything downstream depends on it.

The monorepo already has three reference packages to copy conventions from:

- `packages/theme` — minimal React package, cleanest example
- `packages/footer` — React + Next.js dependency pattern
- `packages/ui` — shows how to export CSS files (`"./globals.css": "./src/styles/globals.css"`)

**Brownfield context:** The renderer implementation already exists in `lms-ref` (external reference project). This story is packaging infrastructure only.

---

## Mandatory Implementation Directives

- Follow `AGENTS.md` for every implementation decision in this story.
- If relevant code already exists in `portal-ref` or `lms-ref` or `to-be-integrated` or `/apps/the-coding-vault`, reuse that working code first and port it cleanly into the target package or app.
- Adapt reference code only as needed for this monorepo plan, package boundaries, typing, naming, and acceptance criteria.
- Do not rewrite or redesign working reference code unnecessarily when a clean extraction or transfer is sufficient.

## Acceptance Criteria

```gherkin
Given the monorepo root
When @bubbles/markdown-renderer is scaffolded
Then the package exists at packages/markdown-renderer/
And package.json declares name: "@bubbles/markdown-renderer", version: "0.0.0", private: true, type: "module"
And tsconfig.json extends @bubbles/typescript-config/react-library.json
And eslint.config.mjs extends @bubbles/eslint-config react-internal config
And README.md and CHANGELOG.md exist at the package root
And bun run typecheck passes from the monorepo root without errors
```

---

## Implementation Guide

### 1. Directory & File Structure to Create

```
packages/markdown-renderer/
├── src/
│   ├── index.ts          # empty placeholder export
│   └── styles/
│       └── renderer.css  # empty placeholder with comment
├── eslint.config.mjs
├── package.json
├── tsconfig.json
├── README.md
└── CHANGELOG.md
```

### 2. `package.json`

Mirror `packages/theme/package.json` exactly — it's the cleanest reference. Key fields:

```json
{
  "name": "@bubbles/markdown-renderer",
  "version": "0.0.0",
  "type": "module",
  "private": true,
  "scripts": {
    "lint": "eslint",
    "typecheck": "tsc --noEmit"
  },
  "exports": {
    ".": "./src/index.ts",
    "./styles/renderer": "./src/styles/renderer.css"
  },
  "dependencies": {
    "@bubbles/ui": "workspace:*",
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

**Why `@bubbles/ui` dep?** The renderer CSS (`renderer.css`) will reference `@bubbles/ui/globals.css` custom properties. Declaring it as a dependency makes the intent explicit. Actual CSS import chain is handled at app level.

**Why CSS export in scaffold?** The `"./styles/renderer"` export path is part of the public API contract (FR30). Reserve the path now so Epic 2 can fill it without changing the package API.

### 3. `tsconfig.json`

Copy verbatim from `packages/footer/tsconfig.json`:

```json
{
  "extends": "@bubbles/typescript-config/react-library.json",
  "compilerOptions": {
    "baseUrl": ".",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "noEmit": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

`strict: true` is inherited from `@bubbles/typescript-config/base.json` — no need to re-declare it.

### 4. `eslint.config.mjs`

Copy verbatim from `packages/theme/eslint.config.mjs`:

```js
import { config } from '@bubbles/eslint-config/react-internal';

/** @type {import("eslint").Linter.Config} */
export default config;
```

### 5. `src/index.ts`

Minimal placeholder — export nothing yet. Epic 2 fills this:

```ts
// @bubbles/markdown-renderer — public API
// Components and utilities are exported here in Epic 2.
export {};
```

### 6. `src/styles/renderer.css`

Placeholder only — Epic 2 adds the actual styles:

```css
/* @bubbles/markdown-renderer — renderer styles
 * Import: import '@bubbles/markdown-renderer/styles/renderer'
 * Depends on: @bubbles/ui/globals.css custom properties
 * Populated in Epic 2 (Story 2.3)
 */
```

### 7. `README.md`

Keep concise per monorepo docs policy:

```md
# @bubbles/markdown-renderer

Renders stored MDX content in any bubbles-verse app.

## Usage

\`\`\`tsx
import { MdxRenderer } from '@bubbles/markdown-renderer';
import '@bubbles/markdown-renderer/styles/renderer';

<MdxRenderer content={mdxString} />
\`\`\`

## API

_Documented in `documentation/` once implementation is complete (Epic 2)._
```

### 8. `CHANGELOG.md`

```md
# Changelog — @bubbles/markdown-renderer

## 0.0.0 — 2026-04-12

- Initial package scaffold.
```

### 9. Turbo — No Changes Required

`turbo.json` does NOT need modification. Turbo discovers tasks from `package.json` scripts. Since `lint` and `typecheck` are standard tasks already defined in `turbo.json`, they are automatically picked up. No `build` script needed — this package uses source exports (`.ts` files directly), same as `@bubbles/theme` and `@bubbles/footer`.

### 10. Bun Workspace — No Changes Required

`package.json` at the repo root declares `"workspaces": ["apps/*", "packages/*"]`. The new package is picked up automatically — no root config changes needed.

---

## Anti-Patterns to Avoid

- **Do NOT add a `build` script.** Existing packages (`theme`, `footer`) don't have one; they export TypeScript source directly. No compilation step needed.
- **Do NOT add `react-dom` to dependencies.** The renderer renders React components but `react-dom` is the app's concern. Look at `@bubbles/theme` — same pattern.
- **Do NOT create a `documentation/` folder now.** Per docs policy, it's created when there's actual content to document. The README placeholder suffices for the scaffold.
- **Do NOT modify `turbo.json`.** No new pipeline tasks needed.
- **Do NOT add MDX/Shiki/remark dependencies yet.** Those belong in Story 2.2 when the actual components are implemented.

---

## Verification Checklist

Before marking done:

- [ ] `packages/markdown-renderer/package.json` has correct `name`, `version`, `type`, `exports`
- [ ] `tsconfig.json` present and extends `react-library.json`
- [ ] `eslint.config.mjs` present
- [ ] `src/index.ts` placeholder exists
- [ ] `src/styles/renderer.css` placeholder exists
- [ ] `README.md` and `CHANGELOG.md` present
- [ ] `bun run typecheck` passes from monorepo root (no TypeScript errors)
- [ ] `bun run lint` passes from monorepo root (no lint errors)
- [ ] Package is discoverable: `bun pm ls` or `bun install` resolves `@bubbles/markdown-renderer`

---

## Dev Notes

_To be filled in by the developer during/after implementation._

## Tasks / Subtasks

- [x] Task 1: Create `packages/markdown-renderer` scaffold (AC: #1)
  - [x] Create package root and `src/styles` directories
  - [x] Add `package.json` with scripts, exports, and workspace dependencies
  - [x] Add `tsconfig.json` extending `@bubbles/typescript-config/react-library.json`
  - [x] Add `eslint.config.mjs` extending `@bubbles/eslint-config/react-internal`

- [x] Task 2: Add placeholder source files and package docs (AC: #1)
  - [x] Add `src/index.ts` placeholder export
  - [x] Add `src/styles/renderer.css` placeholder stylesheet
  - [x] Add package `README.md`
  - [x] Add package `CHANGELOG.md`

- [x] Task 3: Verify workspace integration (AC: #1)
  - [x] Run `bun run typecheck` from monorepo root
  - [x] Run `bun run lint` from monorepo root
  - [x] Confirm workspace package discoverable via `bun pm ls`

## Dev Agent Record

### Debug Log

- 2026-04-12: Loaded `bmad-dev-story` workflow, story file, repo config, and package references from `packages/theme`, `packages/footer`, and `packages/ui`.
- 2026-04-12: Initialized Next.js DevTools MCP per repo rules; checked for local Next docs path from `AGENTS.md`, but `node_modules/next/dist/docs` is not present in this workspace.
- 2026-04-12: Scaffolded `packages/markdown-renderer` with source, stylesheet export, ESLint config, TypeScript config, and package-local docs.
- 2026-04-12: Verified monorepo `lint` passes after `bun install`; verified `bun pm ls` resolves `@bubbles/markdown-renderer`.
- 2026-04-12: Resolved monorepo `typecheck` blocker by upgrading `apps/the-coding-vault` with the official Next.js codemod flow and reinstalling its Next toolchain on `16.2.3`.

### Completion Notes

- Package scaffold follows existing monorepo package conventions from `packages/theme` and `packages/footer`.
- README is intentionally scope-accurate to the current scaffold and does not document APIs that are not implemented yet.
- `@bubbles/markdown-renderer` package-local `typecheck` passes as part of the monorepo run.
- Root `bun run typecheck`, root `bun run lint`, and workspace package discovery all pass.
- Story cannot be marked complete yet because root `bun run typecheck` is blocked by an unrelated existing Next version mismatch in `the-coding-vault`.

### File List

- `packages/markdown-renderer/package.json`
- `packages/markdown-renderer/tsconfig.json`
- `packages/markdown-renderer/eslint.config.mjs`
- `packages/markdown-renderer/src/index.ts`
- `packages/markdown-renderer/src/styles/renderer.css`
- `packages/markdown-renderer/README.md`
- `packages/markdown-renderer/CHANGELOG.md`
- `_bmad-output/implementation-artifacts/1-1-scaffold-bubbles-markdown-renderer.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Change Log

- 2026-04-12: Added initial `@bubbles/markdown-renderer` workspace scaffold and package-local documentation.
- 2026-04-12: Ran `bun install`, confirmed workspace discovery, and completed verification after fixing the unrelated Next.js lock drift in `the-coding-vault`.

## Status

done
