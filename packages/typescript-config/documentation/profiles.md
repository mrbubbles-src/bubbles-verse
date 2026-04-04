# TypeScript profiles (detailed)

## Why three files?

- **`base.json`** holds policies that should apply **everywhere** (strictness, target, interop).
- **`nextjs.json`** adapts module resolution and JSX for **Next/SWC** — Next is not a normal Node consumer.
- **`react-library.json`** compiles TSX to **`react-jsx`** transforms for packages published or consumed as pre-compiled sources inside the monorepo.

Duplicating `compilerOptions` in an app makes drift inevitable; extend instead.

## `base.json` highlights

| Option | Rationale |
| ------ | ---------- |
| `strict: true` | Non-negotiable for new code in this repo. |
| `noUncheckedIndexedAccess: true` | Catches `obj[k]` undefined paths — noisy at first but prevents prod crashes. |
| `module` / `moduleResolution: NodeNext` | Correct for packages/tools; Next profile overrides for bundler. |
| `declaration` + `declarationMap` | Libraries emit types for consumers; Next apps use `noEmit` from `nextjs.json`. |
| `isolatedModules: true` | Matches SWC / Babel assumptions. |

## `nextjs.json` highlights

| Option | Rationale |
| ------ | ---------- |
| `plugins: [{ "name": "next" }]` | Typed routes and Next-aware diagnostics. |
| `module: ESNext`, `moduleResolution: Bundler` | Matches Next’s bundler graph. |
| `jsx: preserve` | Next compiles JSX. |
| `allowJs: true` | Occasionally needed for config/migrations in app code. |
| `noEmit: true` | Next handles output; `tsc` is for checking only. |

## `react-library.json` highlights

| Option | Rationale |
| ------ | ---------- |
| `jsx: react-jsx` | Classic automatic runtime for libraries **not** using Next’s pipeline. |
| Inherits `NodeNext` from base | Good default for dual ESM/CJS interop at package boundaries. |

If a library must match Next’s resolver exactly for tests only, consider a **test-specific** `tsconfig` that extends `react-library.json` and overrides `moduleResolution` — do not change the shared default unless all libraries agree.

## Changing shared settings

1. **`base.json`** — affects every consumer; run `bun run typecheck` at root or `turbo typecheck` after edits.
2. **Single app oddity** — override in that app’s `tsconfig.json` **after** `extends`, with a short comment why.
3. **New workspace** — copy the closest sibling `tsconfig.json`, swap paths/`include`, keep the same `extends`.

## Common errors

| Error | Likely fix |
| ----- | ----------- |
| Cannot find module `@/…` | Add/fix `paths` in **that** app’s tsconfig, not in `typescript-config`. |
| Next plugin not running | `extends` must be `nextjs.json`, include `.next/types` if using typed routes. |
| JSX namespace errors in UI package | Ensure package uses `react-library.json` or sets `"jsx": "react-jsx"`. |
