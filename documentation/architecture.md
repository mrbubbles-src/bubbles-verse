# Architecture

## Workspace graph

The root [`package.json`](../package.json) defines two workspace groups:

- `apps/*`
- `packages/*`

Current workspace count: **9**

```text
bubbles-verse
├── apps/
│   ├── it-counts
│   ├── portfolio
│   ├── teacherbuddy
│   └── the-coding-vault
└── packages/
    ├── @bubbles/ui
    ├── @bubbles/theme
    ├── @bubbles/footer
    ├── @bubbles/eslint-config
    └── @bubbles/typescript-config
```

## Dependency direction

| Direction | Allowed? |
| --------- | -------- |
| App -> shared package | Yes |
| Shared package -> app | No |
| App -> app | Avoid |

The repo treats packages as the reusable surface and apps as deployment units.

## Shared packages

### `@bubbles/ui`

Shared design-system surface: shadcn-style components, globals, hooks, utilities, fonts.

### `@bubbles/theme`

Shared theme concerns: provider, toggle, and view-transition helpers used by multiple apps.

### `@bubbles/footer`

Shared footer rendering so apps can supply their own link sets without duplicating layout code.

### `@bubbles/eslint-config`

Flat ESLint presets for app and package consumption.

### `@bubbles/typescript-config`

Shared TypeScript baselines for apps and internal packages.

## App persistence model

| App | Primary state | Persistence |
| --- | ------------- | ----------- |
| `it-counts` | Zustand stores | `localStorage` + custom PWA service worker |
| `portfolio` | Server-rendered content + server actions | env-backed integrations |
| `teacherbuddy` | reducer + React context | `localStorage` |
| `the-coding-vault` | DB-backed server state | PostgreSQL + JWT cookies |

## Build graph

- [`turbo.json`](../turbo.json) uses `dependsOn: ["^build"]` so dependencies build before consumers.
- Shared packages are consumed through `workspace:*` links.
- Build outputs are captured primarily from `.next/**` for app workspaces.

## Next.js note

The apps in this repo target **Next.js 16.x** with the App Router. Repo instructions in [`AGENTS.md`](../AGENTS.md) take precedence over stale assumptions.
