# Tooling

## Bun

- Install once at the repo root with `bun install`.
- Prefer `bun run <script>` inside a workspace and `bunx turbo ...` from the root.
- Next apps in this repo typically run through `bun --bun next ...`.

## Turborepo

Configuration lives in [`turbo.json`](../turbo.json).

| Task | Behavior |
| ---- | -------- |
| `build` | Runs in dependency order via `^build` |
| `dev` | Persistent, uncached |
| `lint` | Runs through the lint graph |
| `typecheck` | Runs through the typecheck graph |
| `format` | Only runs where a workspace exposes `format` |

### Useful filters

```bash
bunx turbo dev --filter=it-counts
bunx turbo run build lint typecheck --filter=teacherbuddy
bunx turbo lint --filter=@bubbles/theme
```

Use package names from `package.json`, not guessed folder aliases.

## Environment hashing

Turbo hashes declared `env` keys for `build` and `dev`. If a workspace starts reading a new build-time env var, add it to both env lists in [`turbo.json`](../turbo.json).

## ESLint

Shared presets live in `@bubbles/eslint-config`:

- `./base`
- `./next-js`
- `./react-internal`

Apps consume the Next preset; internal packages consume the React/library preset.

## TypeScript

Shared compiler baselines live in `@bubbles/typescript-config`:

- `base.json`
- `nextjs.json`
- `react-library.json`

## Prettier

- Root config: [`.prettierrc`](../.prettierrc)
- Plugins: import sorting + Tailwind class sorting
- Tailwind sorting resolves through `packages/ui/src/styles/globals.css`

## Testing entrypoints

Testing is workspace-local, not a root Turbo task everywhere yet.

- `apps/it-counts` - Vitest + RTL + jsdom
- `apps/teacherbuddy` - Vitest + RTL + jsdom

Run tests from the owning app until the repo adds a shared root test graph.
