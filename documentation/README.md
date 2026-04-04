# Monorepo documentation

Material here describes **bubbles-verse as a whole**. It does not replace per-app guides (for example TeacherBuddy’s [`../apps/teacherbuddy/documentation/README.md`](../apps/teacherbuddy/documentation/README.md)).

## Reading order

1. **[onboarding.md](onboarding.md)** — Checklist for a new machine or contributor.
2. **[architecture.md](architecture.md)** — Workspaces, boundaries, where state lives.
3. **[tooling.md](tooling.md)** — Bun, Turbo, Prettier, ESLint, TypeScript bases.
4. **[troubleshooting.md](troubleshooting.md)** — Cache, env, filters, typical failures.

## Reference

| Document | Contents |
| -------- | -------- |
| [architecture.md](architecture.md) | Dependency direction, `@bubbles/ui`, Next.js note |
| [tooling.md](tooling.md) | Tasks, `turbo.json` env allowlist, Prettier (`tailwindStylesheet`) |
| [onboarding.md](onboarding.md) | Clone → install → run one app → PR checks |
| [troubleshooting.md](troubleshooting.md) | Turbo cache, `--filter`, workspace protocol |

## Per workspace

Each **app** and **package** under `apps/*` and `packages/*` should keep:

- `README.md` — how to run and what it does.
- `CHANGELOG.md` — **scoped** releases (not duplicate root changelog).
- `documentation/` — optional deeper notes for that scope only.

Root [`CHANGELOG.md`](../CHANGELOG.md) is for **cross-repo** changes (tooling, workspace moves, shared breaking changes).
