# bubbles-verse

Monorepo for personal projects: Next.js apps and shared packages (UI, ESLint, TypeScript). **Bun** workspaces orchestrate installs; **Turborepo** runs builds, dev, lint, and typecheck across the graph.

## Requirements

| Tool | Version | Notes |
| ---- | ------- | ----- |
| Node.js | `>=22 <25` | [`.nvmrc`](.nvmrc) pins **24.14.1** for local parity with `engines` in [`package.json`](package.json). |
| Bun | **1.3.11** | Declared as `packageManager` at the repo root; use the same major/minor across machines so lockfiles behave. |

## First-time setup

```bash
nvm use                    # optional: match .nvmrc
bun install                # once at repo root — hoists all workspaces
```

Verify a workspace:

```bash
bunx turbo run typecheck --filter=portfolio
```

## Daily commands (from repo root)

| Script | What it does |
| ------ | ------------- |
| `bun run dev` | Starts **every** package that defines `dev` (multiple terminals / ports — use filters when focusing). |
| `bun run build` | `^build` order: shared packages build before apps that depend on them. |
| `bun run lint` | ESLint pipeline (`dependsOn: ^lint`). |
| `bun run format` | Prettier where the task exists (not all workspaces define it). |
| `bun run typecheck` | `tsc --noEmit` where configured. |

**Single app / package** (faster feedback):

```bash
bunx turbo dev --filter=portfolio
bunx turbo build --filter=teacherbuddy
cd apps/portfolio && bun run dev    # equivalent for one app
```

## Repository layout

```text
apps/
  portfolio/          Personal site: Next 16, de/en routing, Resend, Turnstile
  teacherbuddy/       Classroom tools: localStorage + client state, Vitest
  the-coding-vault/   CMS-style app: Drizzle, Postgres, MDX/Editor.js, Cloudinary
packages/
  @bubbles/ui              Shared components, globals.css, shadcn-style exports
  @bubbles/eslint-config   Flat ESLint presets (base / Next / react-internal)
  @bubbles/typescript-config  Shared tsconfig bases
```

**Dependency rule:** apps may depend on packages; packages must not import app code. Shared UI and tokens live in `@bubbles/ui`.

## Documentation map

| Audience | Start here |
| -------- | ---------- |
| Monorepo / Turbo / env / Prettier | [`documentation/README.md`](documentation/README.md) |
| AI / human coding standards | [`AGENTS.md`](AGENTS.md) |
| Cross-cutting releases only | [`CHANGELOG.md`](CHANGELOG.md) |
| A specific app or package | That folder’s `README.md`, `CHANGELOG.md`, and `documentation/` |

## Common issues

- **`turbo` can’t see env vars in build/dev** — New `process.env.*` keys used at build time must be listed under `env` in [`turbo.json`](turbo.json) for `build` and `dev`, or cache and remote runs diverge from your machine.
- **`bun install` at app root only** — Dependencies are hoisted from the monorepo root; running install inside one app without the root can yield missing workspace links.
- **Node version drift** — Mismatch with `engines` / `.nvmrc` often shows up as native addon or Next warnings first; align Node before debugging app code.

See **[documentation/troubleshooting.md](documentation/troubleshooting.md)** for more detail.
