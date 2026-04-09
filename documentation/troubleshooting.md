# Troubleshooting

## Turbo cache or env looks stale

Symptom: a build works locally inside one app but behaves differently through Turbo or CI.

Fix:

1. Add the new build-time env key to both `tasks.build.env` and `tasks.dev.env` in [`turbo.json`](../turbo.json).
2. Re-run with a clean graph if needed:

```bash
bunx turbo build --force
```

## A task runs for the whole repo

Symptom: `bun run dev` starts more than the app you care about.

Fix: scope it.

```bash
bunx turbo dev --filter=it-counts
bunx turbo lint --filter=@bubbles/ui
```

## Workspace dependency cannot be resolved

Symptom: imports like `@bubbles/ui` or `@bubbles/theme` fail.

Fix:

1. Run `bun install` from the repo root.
2. Verify the consumer declares the dependency as `workspace:*` or `workspace:^`.
3. Check the workspace's local `tsconfig.json` if the issue is only path aliases like `@/`.

## Dev hostname does not resolve

Some app scripts bind to fixed local hosts such as `itcounts.mrbubbles.test`.

Fix:

1. Inspect the workspace `dev` script in its `package.json`.
2. Ensure your local hostname setup resolves the `*.mrbubbles.test` domain.
3. If you intentionally need a different host, override the script locally instead of assuming `localhost:3000`.

## Bun vs Node behavior differs

The app scripts intentionally run Next through Bun. If you swap to `npx next dev`, behavior can drift.

Prefer the checked-in scripts.

## Prettier sorts Tailwind classes strangely

The root config points `tailwindStylesheet` at `packages/ui/src/styles/globals.css`. If that file moves, update the path in [`.prettierrc`](../.prettierrc).

## Next.js docs feel unfamiliar

Use the repo rules in [`AGENTS.md`](../AGENTS.md). For code changes, the repo expects contributors to lean on the in-install Next.js docs instead of memory.
