# Dependencies

## Runtime (direct)

Declared in `package.json` **dependencies** (keep this table in sync when deps change):

| Package | Purpose |
|---------|---------|
| `next` | App Router, RSC, metadata (16.x). |
| `react`, `react-dom` | UI (19.x). |
| `@bubbles/ui` | Shared components, Tailwind/globals, shadcn-style primitives, toasts, icons (Hugeicons/Base UI/CVA live **inside** this workspace package). |
| `next-themes` | Light/dark; wraps the tree with `ThemeProvider` in root layout. |

**Transitive UI stack** (via `@bubbles/ui`, not duplicated in this app): Base UI, shadcn CLI compatibility, `class-variance-authority`, `clsx` / `tailwind-merge`, `sonner`, animation CSS, Zod for forms, etc. When you need a new primitive, check whether it belongs in **`packages/ui`** first.

**shadcn CLI:** `components.json` targets shared CSS under `packages/ui`. Adding a component may update **`@bubbles/ui`**, not only this app.

## Development

### Build & Tooling

| Package | Purpose |
|---------|---------|
| `typescript` | Type checking |
| `eslint` | Linting; app extends **`@bubbles/eslint-config`** (flat config at repo root patterns) |
| `prettier` | Code formatting |
| `@ianvs/prettier-plugin-sort-imports` | Import sorting |
| `prettier-plugin-tailwindcss` | Tailwind class sorting |
| `tailwindcss`, `@tailwindcss/postcss` | Styling build pipeline |
| `babel-plugin-react-compiler` | React Compiler optimization |

### Testing

| Package | Purpose |
|---------|---------|
| `vitest` | Test runner |
| `@vitest/ui` | Interactive test UI |
| `@vitest/coverage-v8` | Coverage reporting |
| `@vitejs/plugin-react` | React support for Vitest |
| `jsdom` | DOM environment for tests |
| `@testing-library/react` | React component testing utilities |
| `@testing-library/jest-dom` | Custom DOM matchers |
| `@testing-library/user-event` | User interaction simulation |

## Package Manager

The project uses [Bun](https://bun.sh/) as the package manager and runtime. All scripts in `package.json` use `bun --bun` for optimal performance.

## Version Requirements

- Align with **monorepo root** `engines` / `.nvmrc` (Node 22+ per root policy).
- **Bun:** match root `packageManager` (e.g. `1.3.11`).
- **React / Next:** see this app’s `package.json` (currently React 19, Next 16).

## Adding and Removing Dependencies

Use Bun only (see repo root [AGENTS.md](../../../AGENTS.md)):

```bash
bun add <package>           # Add dependency
bun add -d <package>        # Add dev dependency
bun remove <package>        # Remove dependency
```

## Updating Dependencies

```bash
# Check for updates
bunx npm-check-updates

# Update dependencies
bun update

# Verify after updates
bun run typecheck
bun run lint
bun run test:run
bun run build
```
