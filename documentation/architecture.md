# Architecture

## Workspaces

Bun reads `workspaces` from the root [`package.json`](../package.json): `apps/*` and `packages/*`. Internal dependencies use the **`workspace:`** protocol so every consumer resolves to the same on-disk package version.

```text
bubbles-verse (root)
├── apps/*          → may depend on packages/*
├── packages/*
│   ├── @bubbles/ui
│   ├── @bubbles/eslint-config
│   └── @bubbles/typescript-config
```

## Dependency direction and boundaries

| Direction | Allowed? |
| --------- | -------- |
| App → shared package | Yes |
| Shared package → app | No |
| `@bubbles/ui` → app-specific data / routes | No — keep UI presentational |

**`@bubbles/ui`** is the single shared design-system surface: React components, `globals.css`, PostCSS entry, and path exports declared in [`packages/ui/package.json`](../packages/ui/package.json). Apps import **subpaths** (`@bubbles/ui/shadcn/button`, etc.) so unused code can tree-shake.

**Configs** (`eslint-config`, `typescript-config`) are dev-time only but follow the same “no upward imports” rule.

## Build graph (Turborepo)

- `turbo build` runs **`dependsOn: ["^build"]`**: dependencies build before dependents. If you add a package that emits types or bundles, give it a `build` script or consumers may typecheck against stale output.
- Outputs are pinned to **`.next/**`** (excluding `.next/cache`) for Next apps — see [`turbo.json`](../turbo.json).

## Next.js version and docs

All Next apps here target **Next.js 16** with the **App Router**. Framework behavior may differ from older training data; [`AGENTS.md`](../AGENTS.md) points contributors at in-repo Next docs under `node_modules/next/dist/docs/`.

## State and persistence by app

| App | Primary state | Notes |
| --- | ------------- | ----- |
| **portfolio** | Server actions + env-backed APIs | Email (Resend), Turnstile, static/MDX content; locale via `proxy.ts` + `i18n-config.ts`. |
| **teacherbuddy** | `localStorage` + React context | Reducer in `context/app-store.tsx`; hydrate before interactive UI; see app `documentation/state-and-storage.md`. |
| **the-coding-vault** | PostgreSQL + JWT sessions | Drizzle schema in `drizzle/db/`; Cloudinary for uploads; optional no-DB fallback flag for local UI work. |

## Adding a new workspace

1. Create `apps/<name>` or `packages/<name>` with its own `package.json` and **`name`** field (scoped for packages, e.g. `@bubbles/foo`).
2. Add workspace deps as `"workspace:*"`.
3. Extend `@bubbles/typescript-config` and `@bubbles/eslint-config` like existing siblings.
4. Register scripts Turbo should run (`dev`, `build`, `lint`, `typecheck` as needed).
5. If the app reads new build-time env vars, append them to **`turbo.json`** `env` lists.
