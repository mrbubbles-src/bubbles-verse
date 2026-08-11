# Monorepo documentation

This folder is the entrypoint for **bubbles-verse as a monorepo**: architecture,
setup, tooling, troubleshooting, and cross-cutting contracts. App- and
package-specific documentation stays beside its owning workspace under
`apps/*/docs/` or `packages/*/docs/`.

## Start here

1. [Onboarding](development/onboarding.md) - install, tool versions, and first successful run
2. [Architecture](architecture/monorepo.md) - workspace graph and dependency boundaries
3. [Tooling](development/tooling.md) - Bun, Turbo, ESLint, Prettier, TypeScript, and tests
4. [Troubleshooting](development/troubleshooting.md) - cache, environment, hostname, and workspace issues

The [generated repository knowledge index](archive/repository-scan-2026-04/index.md)
is a dated snapshot, not the canonical home for new app or package documentation.

## Cross-cutting references

- [Markdown package reference review](contracts/markdown-packages-reference-review-2026-04-13.md)
- [Markdown package remediation plan](contracts/markdown-packages-remediation-plan-2026-04-13.md)
- [Archive](archive/README.md) — generated snapshots and historical handoffs
- [Approved plans and specifications](superpowers/)

## Workspace documentation

| Workspace         | Entry point                                       | Deeper docs                                                |
| ----------------- | ------------------------------------------------- | ---------------------------------------------------------- |
| Bubblophy         | [README](../apps/bubblophy/README.md)             | [Docs index](../apps/bubblophy/docs/README.md)             |
| Dashboard         | [README](../apps/dashboard/README.md)             | [Docs index](../apps/dashboard/docs/README.md)             |
| It Counts         | [README](../apps/it-counts/README.md)             | [Docs index](../apps/it-counts/docs/README.md)             |
| Portfolio         | [README](../apps/portfolio/README.md)             | [Docs index](../apps/portfolio/docs/README.md)             |
| TeacherBuddy      | [README](../apps/teacherbuddy/README.md)          | [Docs index](../apps/teacherbuddy/docs/README.md)          |
| The Coding Vault  | [README](../apps/the-coding-vault/README.md)      | [Docs index](../apps/the-coding-vault/docs/README.md)      |
| ESLint config     | [README](../packages/eslint-config/README.md)     | [Docs index](../packages/eslint-config/docs/README.md)     |
| Markdown editor   | [README](../packages/markdown-editor/README.md)   | [Docs index](../packages/markdown-editor/docs/README.md)   |
| TypeScript config | [README](../packages/typescript-config/README.md) | [Docs index](../packages/typescript-config/docs/README.md) |
| UI                | [README](../packages/ui/README.md)                | [Docs index](../packages/ui/docs/README.md)                |

Packages without deeper documentation use their local `README.md` as the
entrypoint. Root [`CHANGELOG.md`](../CHANGELOG.md) remains reserved for
cross-cutting changes.

## Scope boundary

Generated snapshots and historical workflow artifacts live under `archive/`.
Do not add new workspace-owned contracts here; put them in the owning app or
package.
