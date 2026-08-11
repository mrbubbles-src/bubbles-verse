# Codex Handoff: dashboard shape

Date: 2026-05-25
Repo: /Users/mrbubbles/dev/bubbles-verse
Branch: new-app/dashboard
Commit: a5576a9
Working tree: clean at handoff creation time

## Current Goal

Continue `impeccable shape` for the whole `apps/dashboard` app. The user says the dashboard is functionally close to deployable, but the current design feels not quite right and hard to describe; the goal is a production-ready design brief for a deployable whole-app polish/redesign direction, not implementation yet.

## Completed

- Created and committed repo-level design context earlier in the session:
  - `PRODUCT.md`
  - `DESIGN.md`
  - `.impeccable/design.json`
  - existing `docs/codex-handoffs/*` notes
- Commit created in-session: `cde4b14 docs: add design context and handoff notes`.
- Started `impeccable shape` for the dashboard app after that commit.
- Loaded `impeccable` shape/product references and root design context.
- Inspected dashboard implementation, dashboard docs, and editor/metadata form structure.
- Generated one visual direction probe board with three labeled directions:
  - `Studio Workbench`
  - `Command Center`
  - `Hybrid Lab`

## Files Touched Or Investigated

Touched:

- `docs/codex-handoffs/2026-05-25-dashboard-shape.md` - this continuation handoff.

Investigated:

- `AGENTS.md` - repo instructions: Next.js docs are authoritative, be concise, use shadcn base components, mobile-first, update docs/changelogs, run format/lint/typecheck before finishing implementation work.
- `PRODUCT.md` - repo product context: product register, reusable personal product ecosystem, shadcn base, clarity first, avoid card-heavy UI.
- `DESIGN.md` - design system context: "Personal Product Lab", Catppuccin Latte/Mocha, shadcn primitives, flexible per-app density/elevation/playfulness.
- `.impeccable/design.json` - sidecar design metadata for the above.
- `apps/dashboard/README.md` - current dashboard scope and route descriptions.
- `apps/dashboard/docs/calm-creative-dashboard-visual-spec.md` - existing calm creative admin/content-studio direction and constraints.
- `apps/dashboard/docs/dashboard-design-playbook.md` - existing route-by-route design rules and page directions.
- `apps/dashboard/docs/dashboard-home-redesign-notes.md` - home route direction: flat editorial list, no card-heavy hero, command-center-ish layout.
- `apps/dashboard/docs/dashboard-todo.md` - quick-start app selection future work.
- `apps/dashboard/app/(dashboard)/page.tsx` - dashboard home data loading and render entry.
- `apps/dashboard/app/(dashboard)/layout.tsx` - protected dashboard shell and fallback.
- `apps/dashboard/app/layout.tsx` - root theme/fonts/toaster shell.
- `apps/dashboard/app/dashboard.css` - dashboard-specific layout, typography, studio panel, row, table, and command styles.
- `apps/dashboard/components/app-shell.tsx` - sidebar/header/footer shell and home command search.
- `apps/dashboard/components/home/dashboard-home.tsx` - current home command-center composition.
- `apps/dashboard/components/vault/entries/vault-entry-editor.tsx` - Vault editor wrapper; category/status header and `MarkdownEditor` mount.
- `packages/markdown-editor/src/components/markdown-editor.tsx` - editor and preview are two columns; metadata form renders below in `xl:col-span-2`.
- `packages/markdown-editor/src/components/editor-form.tsx` - default package-level metadata card below the editor.

## Commands And Checks Run

- `git rev-parse --show-toplevel` - repo root: `/Users/mrbubbles/dev/bubbles-verse`.
- `git branch --show-current` - branch: `new-app/dashboard`.
- `git rev-parse --short HEAD` - current commit at handoff creation: `a5576a9`.
- `git status --short` - clean at handoff creation.
- `git diff --name-only` - no unstaged file list at handoff creation.
- `git diff --stat` - no unstaged diff at handoff creation.
- `git log -1 --oneline` - `a5576a9 chore: centralize workspace dependency catalogs`.
- `git add .` - staged all then-untracked design context and handoff docs earlier.
- `git commit -m "docs: add design context and handoff notes"` - succeeded, commit `cde4b14`.
- `node /Users/mrbubbles/.agents/skills/impeccable/scripts/load-context.mjs` - confirmed `PRODUCT.md` and `DESIGN.md`.
- `sed`/`find`/`rg` reads over dashboard docs and components listed above.
- `bunx prettier --check PRODUCT.md` - passed during teach.
- `bunx prettier --check DESIGN.md .impeccable/design.json PRODUCT.md` - initially failed on new files, then passed after formatting.
- `bunx prettier --write DESIGN.md .impeccable/design.json` - formatted new design docs.
- `bun run lint` - passed after design docs, later from cache.
- `bun run typecheck` - passed after design docs, later from cache.

## Known Errors, Warnings, Or Failing Checks

- No known failing repo checks at handoff creation.
- No implementation has been started for the dashboard shape work.
- Visual probe was generated but not yet reviewed with the user.
- Current HEAD is `a5576a9`, which is newer than the in-session design-context commit `cde4b14`; later repo changes exist and should be treated as source of truth.
- Generated visual probe image is outside the repo:
  `/Users/mrbubbles/.codex/generated_images/019df746-b3f8-7910-9eb8-e5eebdbcc1ff/ig_0b584d09faa0e1b80169f9b30fb5448191b4fd7eb19490bfdf.png`

## Open Decisions

- Which visual direction should guide the final shape brief:
  - `Studio Workbench`
  - `Command Center`
  - `Hybrid Lab`
- Whether the dashboard should lean more content-studio, compact control-center, or a route-specific hybrid.
- How to integrate Vault entry metadata: current package form sits below editor/preview; likely better as a publishing/metadata rail, drawer, or route-level custom form.
- Whether to preserve current route docs as binding or supersede them with a new whole-app design brief.
- Whether implementation later should be one deployable polish slice or multiple route-by-route slices.

## Constraints, Preferences, And Do-Not-Touch Areas

- Use the `impeccable` flow: shape first, brief confirmation before craft/implementation.
- For UI/UX tasks, also honor repo instructions to use frontend-design/userinterface-wiki/shadcn skills when implementation begins.
- Dashboard is a product/admin surface, not a marketing page.
- User prefers German UI text with real umlauts.
- Dashboard should feel deployable soon; avoid large speculative feature additions.
- User is unsure what feels wrong visually, so use probes and concrete route examples to make decisions tangible.
- Avoid card-heavy UI, nested cards, generic SaaS dashboard feel, corporate blue defaults, decorative complexity, side-stripe borders, gradient text, default glassmorphism, modal-first design.
- Keep Catppuccin Latte/Mocha and shared `@bubbles/ui` tokens as the visual spine.
- Do not edit shadcn primitive files directly unless there is a specific, discussed reason.
- Existing functional editor should mostly remain; metadata form placement is a known weak point.
- If significant file changes are proposed later, ask for confirmation before proceeding.

## Next Steps

1. Show or reference the generated visual probe image and ask the user which lane feels closest, what feels off, and what should carry forward.
2. If needed, ask one final focused question about deployment priority: home/shell first, Vault/editor first, or all routes as a coherent pass.
3. Draft the `impeccable shape` design brief for the whole dashboard app using the required 10-section structure.
4. Explicitly ask the user to confirm or revise the brief.
5. After confirmation, proceed only if the user asks for implementation, likely through `impeccable craft` or a scoped implementation plan.

## Reactivation Prompt

```text
Continue this work from the handoff document:
/Users/mrbubbles/dev/bubbles-verse/docs/codex-handoffs/2026-05-25-dashboard-shape.md

Work in repo:
/Users/mrbubbles/dev/bubbles-verse

Start by reading the handoff and any repo instructions such as AGENTS.md. Verify the current branch and working tree with git status before editing. Do not rely on old chat context; treat the handoff and repository as the source of truth.

Current goal:
Continue impeccable shape for the whole apps/dashboard app. The user says the dashboard is functionally close to deployable, but the current design feels not quite right and hard to describe. Produce a production-ready design brief for a deployable whole-app polish/redesign direction, not implementation yet.

Important constraints:
- Use impeccable shape and ask for explicit brief confirmation before implementation.
- Use Catppuccin Latte/Mocha and @bubbles/ui shadcn-based primitives as the design spine.
- Avoid card-heavy, generic SaaS, nested-card, modal-first, gradient-text, glassmorphism, and side-stripe-border directions.
- Keep the dashboard deployable soon; do not invent large new features.
- Metadata form placement under the Vault editor is a known weak point.
- Start by reviewing the generated visual probe image at /Users/mrbubbles/.codex/generated_images/019df746-b3f8-7910-9eb8-e5eebdbcc1ff/ig_0b584d09faa0e1b80169f9b30fb5448191b4fd7eb19490bfdf.png and ask the user which lane feels closest.

Begin with the next steps listed in the handoff, and report any mismatch between the handoff and the current repo state before changing files.
```
