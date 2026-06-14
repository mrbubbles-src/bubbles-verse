# Codex Handoff: Bun Install Policy

Date: 2026-05-25
Repo: /Users/mrbubbles/dev/bubbles-verse
Branch: new-app/dashboard
Commit: a5576a9
Working tree: dirty after handoff creation; untracked handoff docs present

## Current Goal

Preserve the current repo/session state around Bun install hardening and the
root-only dependency workflow so a fresh Codex chat can continue without old
chat history.

## Completed

- Added root Bun install hardening via `bunfig.toml` with a 3-day minimum
  release age.
- Documented that `bun install` and `bun add` should run from the repository
  root.
- Documented root-level workspace add examples using `bun add ... --filter`.
- Added the same root-only `bun install` / `bun add` rule to `AGENTS.md`.
- Verified the final state with formatting, linting, and typechecking.

## Files Touched Or Investigated

Touched:

- `bunfig.toml` - configures Bun installs with `minimumReleaseAge = 259200`.
- `README.md` - documents the root-only dependency workflow and workspace
  `--filter` examples.
- `CHANGELOG.md` - records the Bun install hardening and dependency workflow
  documentation under `Unreleased`.
- `AGENTS.md` - tells future agents to run `bun install` and `bun add` only
  from the repository root.
- `docs/codex-handoffs/2026-05-25-bun-install-policy.md` - this handoff.

Investigated:

- `package.json` - checked root scripts/workspaces while considering an install
  guard.
- `docs/codex-handoffs/` - existing repo convention for handoff documents.

## Commands And Checks Run

- `git rev-parse --show-toplevel` - returned
  `/Users/mrbubbles/dev/bubbles-verse`.
- `git branch --show-current` - returned `new-app/dashboard`.
- `git rev-parse --short HEAD` - returned `a5576a9`.
- `git status --short` - clean at handoff creation.
- `git diff --name-only` - no output at handoff creation.
- `git diff --stat` - no output at handoff creation.
- `bun run format` - passed.
- `bun run lint` - passed with existing warnings.
- `bun run typecheck` - passed.

## Known Errors, Warnings, Or Failing Checks

- A `preinstall` guard was tested during the session and then discarded. Bun
  normalizes workspace install lifecycle context to the repo root, so the guard
  could not reliably detect whether the original command started inside a
  workspace folder.
- `bun run lint` reports existing React compiler warnings in several workspaces,
  including `packages/ui/src/components/bubbles-sidebar/bubbles-sidebar-nav.tsx`,
  `packages/ui/src/hooks/use-mobile.ts`,
  `packages/theme/src/theme-provider.tsx`,
  `packages/markdown-editor/src/components/markdown-editor.tsx`,
  `apps/the-coding-vault/components/layout/auth/login-form.tsx`,
  `apps/the-coding-vault/hooks/use-mobile.ts`,
  `apps/teacherbuddy/hooks/use-student-generator.ts`, and
  `apps/dashboard/app/login/page.tsx`. The command still exits successfully.
- `git status --short` after creating this handoff also showed untracked
  `docs/codex-handoffs/2026-05-25-dashboard-shape.md`,
  `docs/codex-handoffs/2026-05-25-dependency-catalogs-react-hooks-lint.md`,
  and `docs/codex-handoffs/2026-05-25-supabase-data-api-grants.md`; those were
  not created or edited in this handoff task.
- No failing checks remain in the current repo state.

## Open Decisions

- Decide whether to add a stronger non-Bun enforcement layer later, such as a
  local Git hook or external shell wrapper. Impact: could catch root-only
  install policy violations before commit, but would add maintenance overhead
  and may not be portable.
- Decide whether to stage/commit the already-present Bun policy changes if they
  are not part of an existing commit in the receiving environment. Current
  handoff environment shows a clean worktree.

## Constraints, Preferences, And Do-Not-Touch Areas

- Follow `AGENTS.md`.
- Be extremely concise.
- Always run formatting, linting, and typechecking before finishing repo tasks.
- Do not significantly change a file without confirmation.
- Always run `bun install` and `bun add` from the repository root; use
  `bun add <dependency> --filter=<workspace-name>` or
  `bun add -d <dependency> --filter=<workspace-name>` for workspace
  dependencies.
- For Next.js work, read relevant docs in `node_modules/next/dist/docs/` before
  writing code.
- Do not revert user changes or unrelated dirty worktree changes.

## Next Steps

1. Run `git status --short` and compare with this handoff before editing.
2. Confirm whether the Bun policy changes are already committed in the target
   continuation context.
3. If needed, stage and commit the Bun policy changes with a concise
   conventional commit message.
4. If stronger enforcement is requested, propose a Git hook or shell-wrapper
   approach and ask before adding it.
5. Keep root-only Bun add/install behavior in mind for all future dependency
   work.

## Reactivation Prompt

```text
Continue this work from the handoff document:
/Users/mrbubbles/dev/bubbles-verse/docs/codex-handoffs/2026-05-25-bun-install-policy.md

Work in repo:
/Users/mrbubbles/dev/bubbles-verse

Start by reading the handoff and any repo instructions such as AGENTS.md. Verify the current branch and working tree with git status before editing. Do not rely on old chat context; treat the handoff and repository as the source of truth.

Current goal:
Preserve and continue the Bun install hardening/root-only dependency workflow work.

Important constraints:
- Follow AGENTS.md.
- Run bun install and bun add only from the repository root.
- Use bun add <dependency> --filter=<workspace-name> for workspace dependencies.
- Run format, lint, and typecheck before finishing repo tasks.
- Do not revert unrelated user changes.

Begin with the next steps listed in the handoff, and report any mismatch between the handoff and the current repo state before changing files.
```
