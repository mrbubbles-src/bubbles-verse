# Troubleshooting

## Turbo: “wrong” build output or stale env

**Symptom:** Production build works locally with `bun run build` in the app folder but fails in CI, or behavior changes after Turbo cache hits.

**Cause:** Turborepo hashes **declared** environment variables for `build` / `dev`. Missing keys fall out of the hash and can serve a cached build built with different env.

**Fix:**

1. Add any new `process.env.X` used during `next build` or `next dev` to [`turbo.json`](../turbo.json) under `tasks.build.env` **and** `tasks.dev.env` (keep both lists in sync unless you have a reason not to).
2. After changing `turbo.json`, treat the next CI run as a clean graph; use `--force` locally if you need to invalidate:  
   `bunx turbo build --force`

## Turbo: task runs for the whole repo

**Symptom:** `bun run dev` starts every workspace with a `dev` script.

**Fix:** Scope work:

```bash
bunx turbo dev --filter=portfolio
bunx turbo lint --filter=@bubbles/ui
```

Use `package.json` `name` in `--filter` (e.g. `portfolio`, `teacherbuddy`, `@bubbles/ui`).

## Workspace dependency not found

**Symptom:** `Cannot find module '@bubbles/ui'` or TypeScript can’t resolve workspace paths.

**Fix:**

1. Run `bun install` from **monorepo root**.
2. Confirm the consumer’s `package.json` lists `"@bubbles/ui": "workspace:*"` (or `workspace:^`).
3. For path aliases like `@/`, check that app’s `tsconfig.json` — that is per-app, not inherited from the root.

## Bun vs Node for Next

Apps use **`bun --bun next dev`** so the Next CLI runs on Bun’s runtime. If you bypass scripts and run `npx next dev`, behavior can differ (especially around native deps). Prefer the scripts in each app’s `package.json`.

## ESLint: env / Turbo plugin noise

`eslint-plugin-turbo` flags env vars that are not allowlisted in `turbo.json`. Either add the variable to Turbo’s `env` arrays or avoid referencing unknown keys in linted files without declaring them.

## Prettier: Tailwind class order surprises

Root [`.prettierrc`](../.prettierrc) sets `"tailwindStylesheet": "packages/ui/src/styles/globals.css"` so `prettier-plugin-tailwindcss` resolves your design tokens. If you move `globals.css`, update that path or class sorting may degrade.

## Next.js “this is not the Next you know”

Internal docs ship under `node_modules/next/dist/docs/`. Prefer those over outdated blog posts when APIs look unfamiliar — see [`AGENTS.md`](../AGENTS.md).
