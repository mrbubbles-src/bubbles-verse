# Tooling

## Bun

- **Install:** `bun install` at the **repository root** once; workspaces share `node_modules` layout.
- **Scripts:** Prefer `bun run <script>`; Next apps in this repo typically invoke **`bun --bun next ...`** so Next runs on Bun (see each `package.json`).
- **Running one-off tools:** `bunx turbo ...` or `bunx eslint` work like `npx` but respect Bun’s resolution.

## Turborepo

Configuration: [`turbo.json`](../turbo.json).

| Task | Behavior |
| ---- | -------- |
| `build` | Depends on `^build`; captures `.env*` in inputs; outputs `.next/**` (minus cache). |
| `dev` | **Not cached**, **persistent**; same `env` allowlist as build for hashing consistency. |
| `lint` / `typecheck` / `format` | `lint` and `typecheck` depend on upstream `^lint` / `^typecheck` where defined. |

### Declared environment variables

These keys are explicitly passed into Turbo’s hash for **`build`** and **`dev`** (keep in sync when you add secrets):

`CLOUDINARY_API_SECRET`, `DATABASE_URL`, `DIRECT_URL`, `DISCORD_WEBHOOK_URL`, `JWT_SECRET`, `NEXT_DISABLE_REACT_COMPILER`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_CLOUDINARY_API_KEY`, `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `NODE_ENV`, `RESEND_API_KEY`, `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, `THE_CODING_VAULT_ENABLE_NO_DB_FALLBACK`, `TURNSTILE_SECRET_KEY`, `VERCEL_PROJECT_PRODUCTION_URL`, `VERCEL_URL`.

If you introduce a new `process.env.*` read at build or dev time, **add it here** or remote cache and teammates may see confusing results. See [troubleshooting.md](troubleshooting.md).

### Filtering

```bash
bunx turbo dev --filter=portfolio
bunx turbo run build lint typecheck --filter=the-coding-vault
```

Filter accepts package **names** from each `package.json`, not folder names (though they often match).

## Prettier

- **Config:** root [`.prettierrc`](../.prettierrc) + [`.prettierignore`](../.prettierignore).
- **Plugins:** `@ianvs/prettier-plugin-sort-imports`, `prettier-plugin-tailwindcss`.
- **Tailwind:** `tailwindStylesheet` points at **`packages/ui/src/styles/globals.css`** so class sorting matches your design tokens. Update that path if the stylesheet moves.
- **Scope:** Individual workspaces may expose `format` scripts (e.g. `@bubbles/ui`); root `bun run format` runs Turbo’s `format` task across the graph.

## ESLint

Flat configs live in **`@bubbles/eslint-config`**: `base`, `next-js`, `react-internal`. Apps import one entry in `eslint.config.*`. Prettier conflicts are disabled via `eslint-config-prettier`. See [packages/eslint-config/README.md](../packages/eslint-config/README.md).

## TypeScript

Shared compiler profiles: **`@bubbles/typescript-config`** (`base.json`, `nextjs.json`, `react-library.json`). **Do not** duplicate `strict` or module settings app-by-app unless there is a documented exception.
