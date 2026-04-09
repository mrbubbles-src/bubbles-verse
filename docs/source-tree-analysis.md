# Source Tree Analysis

> Updated: 2026-04-09

## Top-level structure

```text
bubbles-verse/
├── apps/
│   ├── it-counts/
│   ├── portfolio/
│   ├── teacherbuddy/
│   └── the-coding-vault/
├── packages/
│   ├── footer/
│   ├── theme/
│   ├── ui/
│   ├── eslint-config/
│   └── typescript-config/
├── documentation/         # Maintained monorepo docs
├── docs/                  # Repo knowledge snapshots / indexes
├── README.md
├── CHANGELOG.md
├── AGENTS.md
├── package.json
└── turbo.json
```

## App highlights

### `apps/it-counts`

- App Router app
- local-first state via Zustand
- persistent business state in `localStorage`
- custom PWA manifest + service worker
- Vitest suite under `__tests__/`

### `apps/portfolio`

- locale route segment under `app/[lang]`
- server actions for contact flow
- static marketing-style app structure

### `apps/teacherbuddy`

- route-driven feature app
- reducer/context state model
- broad app-local documentation set

### `apps/the-coding-vault`

- split route groups for public and admin areas
- DB, auth, content editing, and API endpoints

## Package highlights

### `packages/ui`

Shared UI package with component exports, hooks, fonts, and global styles.

### `packages/theme`

Shared theme provider, toggle, and transition helpers.

### `packages/footer`

Shared footer component boundary so app layouts stay thin.

### `packages/eslint-config`

Shared flat ESLint config entries.

### `packages/typescript-config`

Shared TypeScript profiles for apps and internal packages.

## Documentation placement

- Root repo docs: `README.md`, `CHANGELOG.md`, `documentation/`, `docs/`
- App docs: `apps/*/README.md`, `apps/*/CHANGELOG.md`, `apps/*/documentation/`
- Package docs: `packages/*/README.md`, `packages/*/CHANGELOG.md`, optional `packages/*/documentation/`
