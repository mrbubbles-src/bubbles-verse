# Onboarding

## 1. Clone and tool versions

```bash
git clone <repo-url> bubbles-verse
cd bubbles-verse
nvm use
bun --version
```

Expect Bun `1.3.11` and Node aligned with [`.nvmrc`](../.nvmrc).

## 2. Install from root

```bash
bun install
```

Always install from the repo root so `workspace:*` links resolve correctly.

## 3. Start one workspace

Examples:

```bash
bunx turbo dev --filter=it-counts
bunx turbo dev --filter=portfolio
bunx turbo dev --filter=teacherbuddy
bunx turbo dev --filter=the-coding-vault
```

If you work directly inside `it-counts`:

```bash
cd apps/it-counts
bun run dev
```

The script binds to `itcounts.mrbubbles.test:3003`.

## 4. Environment variables

- `it-counts` - no required server secrets; `NEXT_PUBLIC_SITE_URL` is optional for canonical metadata.
- `portfolio` / `the-coding-vault` - copy local env files as required by each workspace.
- Any build-time `process.env.*` key must also be declared in [`turbo.json`](../turbo.json).

## 5. Before opening a PR

From the root:

```bash
bun run lint
bun run typecheck
```

App-local example:

```bash
cd apps/it-counts
bun run test:run
```

## 6. Read next

- Repo rules: [`../AGENTS.md`](../AGENTS.md)
- Monorepo structure: [architecture.md](architecture.md)
- Broken cache / env / hostnames: [troubleshooting.md](troubleshooting.md)
