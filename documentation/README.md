# Monorepo documentation

This folder documents **bubbles-verse as a repo**: workspace boundaries, setup, tooling, and repo-wide troubleshooting.

App-specific details stay inside each workspace. For `it-counts`, start with [`../apps/it-counts/README.md`](../apps/it-counts/README.md) and [`../apps/it-counts/documentation/README.md`](../apps/it-counts/documentation/README.md).

## Reading order

1. [onboarding.md](onboarding.md) - new machine, install, first successful run
2. [architecture.md](architecture.md) - workspace graph, boundaries, shared packages
3. [tooling.md](tooling.md) - Bun, Turbo, ESLint, Prettier, TypeScript, test entrypoints
4. [troubleshooting.md](troubleshooting.md) - stale cache, env drift, hostnames, workspace wiring
5. [markdown-packages-remediation-plan-2026-04-13.md](markdown-packages-remediation-plan-2026-04-13.md) - agreed implementation plan for the shared markdown package fixes

## Per workspace

Each app or package should keep its own:

- `README.md` - what it is and how to run it
- `CHANGELOG.md` - scoped release notes only
- `documentation/` - deeper notes for that workspace only

Root [`CHANGELOG.md`](../CHANGELOG.md) stays reserved for cross-cutting repo changes.
