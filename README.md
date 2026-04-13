# bubbles-verse

Monorepo for personal web apps and shared frontend packages. Installs run through **Bun workspaces**; cross-workspace tasks run through **Turborepo**.

## Requirements

| Tool    | Version    | Notes                                               |
| ------- | ---------- | --------------------------------------------------- |
| Node.js | `>=22 <25` | [`.nvmrc`](.nvmrc) pins `24.14.1` for local parity. |
| Bun     | `1.3.11`   | Declared as the root `packageManager`.              |

## First-time setup

```bash
nvm use
bun install
```

Sanity check one workspace:

```bash
bunx turbo run typecheck --filter=it-counts
```

## Daily commands

Run from the repository root unless you are intentionally working inside one app or package.

| Script              | What it does                                        |
| ------------------- | --------------------------------------------------- |
| `bun run dev`       | Starts every workspace that exposes `dev`.          |
| `bun run build`     | Builds the dependency graph in `^build` order.      |
| `bun run lint`      | Runs the lint graph.                                |
| `bun run test`      | Runs every workspace `test` script through Turbo.   |
| `bun run format`    | Runs formatting where a workspace defines `format`. |
| `bun run typecheck` | Runs `tsc --noEmit` where configured.               |

Single-workspace examples:

```bash
bunx turbo dev --filter=it-counts
bunx turbo build --filter=teacherbuddy
bunx turbo lint --filter=@bubbles/ui
bunx turbo test --filter=@bubbles/markdown-editor
```

## Repository layout

```text
apps/
  it-counts/          Local-first walking XP tracker (Next.js 16, Zustand, Vitest, PWA)
  portfolio/          Personal site (i18n, Resend, Turnstile, PDF CV)
  teacherbuddy/       Classroom tools (localStorage, reducer/context, Vitest)
  the-coding-vault/   CMS-style app (Drizzle, PostgreSQL, MDX, Editor.js)
packages/
  @bubbles/ui               Shared components, globals.css, hooks, utilities
  @bubbles/theme            Shared ThemeProvider, ThemeToggle, transitions
  @bubbles/footer           Shared footer surface for app-level legal/footer links
  @bubbles/eslint-config    Flat ESLint presets
  @bubbles/typescript-config Shared tsconfig bases
```

Dependency rule: apps may depend on packages; packages must not import app code.

## Documentation map

| Scope                             | Start here                                             |
| --------------------------------- | ------------------------------------------------------ |
| Monorepo overview and setup       | [`documentation/README.md`](documentation/README.md)   |
| Markdown package remediation plan | [`documentation/markdown-packages-remediation-plan-2026-04-13.md`](documentation/markdown-packages-remediation-plan-2026-04-13.md) |
| Generated repo knowledge snapshot | [`docs/index.md`](docs/index.md)                       |
| Coding and documentation rules    | [`AGENTS.md`](AGENTS.md)                               |
| Story implementation artifacts    | `_bmad-output/implementation-artifacts/*.md`           |
| Cross-cutting changes only        | [`CHANGELOG.md`](CHANGELOG.md)                         |
| `it-counts` app docs              | [`apps/it-counts/README.md`](apps/it-counts/README.md) |

## Workspace notes

- `it-counts` is the most local-first app in the repo: app state lives in `localStorage`, UI state in Zustand, and installability is handled through a custom service worker.
- `portfolio` and `the-coding-vault` use server-side integrations and environment variables.
- `teacherbuddy` and `it-counts` both ship Vitest suites, but their state models differ: reducer/context vs Zustand stores.
- Shared UI, theme, and footer concerns live in packages, not in app-local component folders.
- Story files in `_bmad-output/implementation-artifacts/` should explicitly tell implementers to follow `AGENTS.md`.

## Common issues

- Turbo cache looks wrong after adding a build-time env var: update [`turbo.json`](turbo.json) `tasks.build.env` and `tasks.dev.env`.
- A workspace import cannot be resolved: rerun `bun install` from the repo root, not from one app.
- A dev server hostname does not resolve: check the workspace `dev` script in its `package.json`; some apps bind to fixed `*.mrbubbles.test` hosts and ports.

See [`documentation/troubleshooting.md`](documentation/troubleshooting.md) for more detail.
