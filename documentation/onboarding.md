# Onboarding

## 1. Clone and tool versions

```bash
git clone <repo-url> bubbles-verse
cd bubbles-verse
nvm use          # optional; reads .nvmrc
bun --version    # expect 1.3.x per packageManager
```

## 2. Install

```bash
bun install
```

Always install from the **repository root** so Bun links `workspace:*` packages (`@bubbles/ui`, configs).

## 3. Run one application

Examples:

```bash
bunx turbo dev --filter=portfolio
bunx turbo dev --filter=teacherbuddy
bunx turbo dev --filter=the-coding-vault
```

Open the URL Next prints (usually `http://localhost:3000`). Multiple `dev` tasks may use different ports if you run the full `bun run dev` without a filter.

## 4. Environment variables

- **Portfolio / Coding Vault** — Copy each app’s `.env.example` → `.env` (secrets stay local).
- **TeacherBuddy** — No env required for core features; optional `NEXT_PUBLIC_SITE_URL` for canonical/OG URLs.
- **Turbo** — Keys that affect `next build` or `next dev` must appear in [`turbo.json`](../turbo.json) `tasks.build.env` and `tasks.dev.env` if you rely on Turbo cache or CI.

## 5. Before a PR

From root (adjust if you only touched one package):

```bash
bun run lint
bun run typecheck
```

Apps with tests (e.g. TeacherBuddy): `cd apps/teacherbuddy && bun run test:run`.

## 6. Where to read next

- Repo standards: [`../AGENTS.md`](../AGENTS.md)
- Architecture: [architecture.md](architecture.md)
- When something breaks: [troubleshooting.md](troubleshooting.md)
