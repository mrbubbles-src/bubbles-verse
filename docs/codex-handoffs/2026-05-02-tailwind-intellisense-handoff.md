# Tailwind IntelliSense Handoff

Date: 2026-05-02  
Repo: `/Users/mrbubbles/dev/bubbles-verse`  
Branch: `new-app/dashboard`  
HEAD: `fb9033a feat: enhance markdown rendering and dashboard styles`

## Current Goal

Keep Tailwind CSS IntelliSense working across the monorepo without adding a
`tailwind.config.*` file or per-app Tailwind setup. Preserve the Tailwind v4
CSS-first setup and use the shared UI package stylesheet as the central
IntelliSense project root.

## What We Already Completed

- Verified the repo uses Tailwind CSS v4 and has no `tailwind.config.*`.
- Confirmed the intended shared Tailwind entrypoint is
  `packages/ui/src/styles/globals.css`.
- Confirmed `packages/ui/src/styles/globals.css` contains `@import 'tailwindcss'`
  and workspace-wide `@source` directives.
- Added/confirmed VS Code workspace Tailwind mapping:

  ```json
  {
    "tailwindCSS.experimental.configFile": {
      "packages/ui/src/styles/globals.css": ["apps/**", "packages/**"]
    }
  }
  ```

- Confirmed the original brace-glob mapping did not work:

  ```json
  ["apps/**/*.{ts,tsx}", "packages/**/*.{ts,tsx}"]
  ```

- Confirmed Tailwind IntelliSense started working once the mapping was simplified
  to `["apps/**", "packages/**"]`.
- Added/confirmed root `tailwindcss` dependency so editor tooling can resolve
  Tailwind from the repo root:

  ```json
  "tailwindcss": "^4.1.18"
  ```

- Removed unnecessary editor settings during troubleshooting:
  - `editor.quickSuggestions.strings`
  - `files.associations["*.css"]`

## Files Touched Or Investigated

### Touched

- `.vscode/settings.json`
  - Keeps the central Tailwind IntelliSense project mapping.
- `package.json`
  - Root `tailwindcss` dev dependency is present.
- `bun.lock`
  - Updated by Bun after adding root Tailwind dependency.

### Investigated

- `packages/ui/src/styles/globals.css`
  - Shared Tailwind v4 stylesheet and current IntelliSense root.
- `packages/ui/package.json`
  - Exports `./globals.css` and contains package-local Tailwind dependency.
- `apps/*/components.json`
  - All app shadcn configs point at `../../packages/ui/src/styles/globals.css`.
- `apps/*/postcss.config.mjs`
  - Apps mostly re-export shared `packages/ui/postcss.config.mjs`.
- `apps/*/app/*.css`
  - Checked app-local CSS roots and `@reference`/`@import` usage.
- `apps/*/app/layout.tsx`
  - Checked which CSS files are actually imported.
- `.vscode/settings.json`
  - Checked that only the TypeScript SDK and Tailwind mapping remain.
- `AGENTS.md`
  - Repo rules and user constraints.
- Official Tailwind IntelliSense docs/README
  - Verified `tailwindCSS.experimental.configFile` is the official way to map
    Tailwind v4 CSS entrypoints in monorepos/multiple-root setups.

## Commands And Checks Already Run

- `git branch --show-current`
- `git status --short`
- `git status --short --untracked-files=all`
- `git log --oneline -5`
- `git show --stat --oneline --decorate -1`
- `rg --files -g 'package.json' -g 'tailwind.config.*' -g 'postcss.config.*' -g 'components.json' -g '.vscode/**' -g 'tsconfig*.json' -g 'next.config.*' -g 'AGENTS.md'`
- `rg -n "tailwind|@import|@theme|@source|content|classRegex|tailwindCSS|experimental.configFile|cssVariables|baseColor" ...`
- `sed -n '1,220p' package.json`
- `sed -n '1,220p' .vscode/settings.json`
- `sed -n '1,80p' packages/ui/package.json`
- `find ~/.vscode ~/.cursor ~/.windsurf -maxdepth 3 -type d \( -iname '*tailwind*' -o -iname '*bradlc*' \)`
- `code --list-extensions --show-versions`
- `cursor --list-extensions --show-versions`
- `test -d node_modules/tailwindcss && node -p "require('./node_modules/tailwindcss/package.json').version"`
- `node -p "require.resolve('tailwindcss/package.json') + ' ' + require('tailwindcss/package.json').version"`
- `bun pm ls tailwindcss --all`
- `bun add --dev tailwindcss@^4.1.18`
- `bunx prettier --check .vscode/settings.json`
- `bunx prettier --check package.json .vscode/settings.json`
- `bun run lint`
- `bun run typecheck`

## Known Errors, Warnings, Or Failing Checks

- Tailwind IntelliSense log originally showed:

  ```txt
  Loading Tailwind CSS projects from the workspace settings.
  [Global] Creating projects: ...
  [Global] Initialized 0 projects
  [GLOBAL] No matching project for document {
    fsPath: '/Users/mrbubbles/dev/bubbles-verse/packages/markdown-renderer/src/components/markdown-code/markdown-code-block.tsx'
  }
  ```

- The mapping using brace globs loaded but did not match documents:

  ```json
  "packages/ui/src/styles/globals.css": [
    "apps/**/*.{ts,tsx}",
    "packages/**/*.{ts,tsx}"
  ]
  ```

- The simplified mapping fixed matching:

  ```json
  "packages/ui/src/styles/globals.css": ["apps/**", "packages/**"]
  ```

- No current lint/typecheck failures were observed in this session.
- Current `git status --short --untracked-files=all` showed untracked handoff
  docs:
  - `docs/codex-handoffs/2026-05-02-dashboard-auth-proxy-handoff.md`
  - `docs/codex-handoffs/2026-05-02-teacherbuddy-sidebar-handoff.md`
  - this handoff file after creation

## Open Decisions

- Decide whether to commit the new handoff files or leave them local.
- Decide whether root `tailwindcss` dependency should stay. It is useful for
  editor/tooling resolution from the monorepo root and is already present in
  `HEAD`.
- No `tailwind.config.*` should be introduced unless the user explicitly changes
  direction.
- Do not re-add `editor.quickSuggestions` or `files.associations` unless a new
  symptom proves they are needed.

## Constraints, User Preferences, And Do-Not-Touch Areas

- User asked for concise communication.
- User prefers simple, non-clever, maintainable solutions.
- Do not make significant file changes without confirmation.
- Always run formatting, linting, and typechecking before finishing code changes.
- Always assume Next.js knowledge is outdated:
  - use NextDevTools `init` first in a new Next.js session.
  - read relevant docs before Next.js changes.
- Keep Tailwind v4 CSS-first setup.
- Do not create a `tailwind.config.*` for this IntelliSense issue.
- Do not configure Tailwind separately per app/package for this issue.
- Preserve the shared UI stylesheet as the central Tailwind source:
  `packages/ui/src/styles/globals.css`.
- Do not edit shadcn component files directly unless there is a concrete reason.
- Be careful with existing dirty/untracked work:
  - do not revert user changes.
  - existing handoff docs were already untracked before this handoff was created.

## Next Steps

1. Check `git status --short --untracked-files=all`.
2. Decide whether to stage/commit the handoff docs.
3. If IntelliSense regresses, open VS Code/Cursor Output panel:
   `Cmd+Shift+U`, choose `Tailwind CSS IntelliSense`.
4. Confirm the Tailwind output says it creates one project from
   `packages/ui/src/styles/globals.css` and no longer logs
   `Initialized 0 projects`.
5. If matching breaks again, keep the mapping broad and simple:
   `["apps/**", "packages/**"]`.
6. Avoid changing app-local Tailwind setup unless a specific app has runtime CSS
   issues, not just editor IntelliSense issues.
7. Before any final code handoff, rerun:
   `bunx prettier --check .vscode/settings.json package.json`,
   `bun run lint`, and `bun run typecheck`.

## Reactivation Prompt

Paste this into a fresh Codex chat:

```text
You are continuing work in `/Users/mrbubbles/dev/bubbles-verse` on branch
`new-app/dashboard`. Read `AGENTS.md` first and follow it. Initialize
NextDevTools MCP before any Next.js work.

Context: We debugged Tailwind CSS IntelliSense in this Tailwind v4 monorepo.
The desired setup is no `tailwind.config.*`, no per-app Tailwind config, and
one shared CSS-first Tailwind root at `packages/ui/src/styles/globals.css`.

The working VS Code setting is:

{
  "tailwindCSS.experimental.configFile": {
    "packages/ui/src/styles/globals.css": ["apps/**", "packages/**"]
  }
}

Important finding: brace globs like `packages/**/*.{ts,tsx}` loaded in the
Tailwind IntelliSense output but did not match documents. The Tailwind output
showed `Initialized 0 projects` and repeated `No matching project for document`.
Changing the selectors to `apps/**` and `packages/**` made IntelliSense work
without a VS Code reload.

Root `tailwindcss` is present in `package.json` so editor tooling can resolve it
from the monorepo root. Do not add `tailwind.config.*`. Do not re-add
`editor.quickSuggestions` or `files.associations` unless there is a proven new
need.

Current repo-local handoffs live in `docs/codex-handoffs/`. Check `git status`
before touching files because there are untracked handoff docs. Do not revert
user changes.

If the next task is to verify or continue this issue:
1. inspect `.vscode/settings.json`, `package.json`, and
   `packages/ui/src/styles/globals.css`;
2. ask the user for Tailwind CSS IntelliSense Output if IntelliSense fails;
3. run formatting/lint/typecheck before finishing any code changes.
```
