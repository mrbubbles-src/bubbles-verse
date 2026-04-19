# Dashboard Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the dashboard into a flatter, clearer, mobile-first workspace without changing the core functionality.

**Architecture:** Keep the existing route structure, data loaders, and editor package intact. Replace box-heavy route UIs with flatter page compositions, migrate management surfaces to tables/lists plus dialogs, update sidebar/header copy and navigation, and add reusable UI primitives in `@bubbles/ui` where repetition is likely.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind/shadcn in `@bubbles/ui`, existing `@bubbles/markdown-editor`, existing dashboard data layer/tests, Vitest.

---

## Scope

This implementation covers:

- shared dashboard shell and navigation adjustments
- `/`
- `/profile`
- `/account` → `Zugangsverwaltung`
- `/vault`
- `/vault/entries`
- `/vault/categories`
- `/vault/entries/new`
- `/vault/entries/[id]`
- documentation updates and shared UI primitives needed by the redesign

This implementation does **not** add new product functionality beyond agreed UI behavior changes such as:

- reusable dialogs/toolbars/pagination controls
- sidebar draft navigation for entry work
- frontend preview entry point wiring

## Files Expected To Change

### Shared shell / navigation

- Modify: `apps/dashboard/components/app-shell.tsx`
- Modify: `apps/dashboard/lib/page-meta.ts`
- Modify: `apps/dashboard/lib/sidebar.ts`
- Possibly modify: `packages/ui/src/components/bubbles-sidebar/*`
- Possibly modify: `packages/ui/src/lib/bubbles-sidebar.ts`
- Test: `apps/dashboard/__tests__/components/app-shell.test.tsx`
- Test: `packages/ui/__tests__/bubbles-sidebar-layout.test.tsx`

### Home

- Modify: `apps/dashboard/components/home/dashboard-home.tsx`
- Modify: `apps/dashboard/components/home/quick-actions.tsx`
- Modify: `apps/dashboard/components/home/workspace-stats.tsx`
- Modify: `apps/dashboard/components/home/recent-content-list.tsx`
- Modify: `apps/dashboard/components/home/profile-status.tsx`
- Possibly add focused helper components under `apps/dashboard/components/home/`
- Test: `apps/dashboard/__tests__/components/home/dashboard-home.test.tsx`

### Profile

- Modify: `apps/dashboard/components/profile/profile-editor.tsx`
- Modify: `apps/dashboard/app/(dashboard)/profile/page.tsx`
- Modify: `apps/dashboard/lib/profile/profile.ts`
- Modify: `apps/dashboard/app/(dashboard)/profile/actions.ts`
- Test: `apps/dashboard/__tests__/components/profile/profile-editor.test.tsx`
- Test: `apps/dashboard/__tests__/lib/profile/profile.test.ts`

### Access management

- Modify: `apps/dashboard/app/(dashboard)/account/page.tsx`
- Modify: `apps/dashboard/app/(dashboard)/account/actions.ts`
- Modify: `apps/dashboard/lib/account/dashboard-access.ts`
- Add/modify page-local components under `apps/dashboard/components/account/`
- Test: `apps/dashboard/__tests__/lib/account/dashboard-access.test.ts`

### Vault overview

- Modify: `apps/dashboard/components/vault/vault-overview.tsx`
- Modify: `apps/dashboard/lib/vault/overview.ts`
- Test: `apps/dashboard/__tests__/components/vault/vault-overview.test.tsx`
- Test: `apps/dashboard/__tests__/lib/vault/overview.test.ts`

### Vault entries list

- Modify: `apps/dashboard/components/vault/entries/vault-entry-list.tsx`
- Modify: `apps/dashboard/components/vault/entries/vault-entry-filters.tsx`
- Modify: `apps/dashboard/app/(dashboard)/vault/entries/page.tsx`
- Modify: `apps/dashboard/lib/vault/entries.ts`
- Possibly add new table/pagination helpers
- Test: `apps/dashboard/__tests__/components/vault/entries/vault-entry-list.test.tsx`
- Test: `apps/dashboard/__tests__/lib/vault/entries.test.ts`

### Vault entry editor pages

- Modify: `apps/dashboard/components/vault/entries/vault-entry-editor.tsx`
- Modify: `apps/dashboard/app/(dashboard)/vault/entries/new/page.tsx`
- Modify: `apps/dashboard/app/(dashboard)/vault/entries/[id]/page.tsx`
- Modify shared sidebar wiring in `apps/dashboard/lib/sidebar.ts`
- Possibly add local draft-sidebar state helpers
- Test: `apps/dashboard/__tests__/components/vault/entries/vault-entry-editor.test.tsx`

### Vault categories

- Modify: `apps/dashboard/components/vault/categories/category-manager.tsx`
- Modify: `apps/dashboard/components/vault/categories/category-tree-list.tsx`
- Modify: `apps/dashboard/app/(dashboard)/vault/categories/page.tsx`
- Modify: `apps/dashboard/app/(dashboard)/vault/categories/actions.ts`
- Modify: `apps/dashboard/lib/vault/category-tree.ts`
- Test: `apps/dashboard/__tests__/components/vault/categories/category-tree-list.test.tsx`
- Test: `apps/dashboard/__tests__/lib/vault/category-tree.test.ts`

### Shared reusable UI candidates

- Add or modify in `packages/ui/src/components/`:
  - pagination primitive / page-size selector if needed
  - generic admin/search toolbar helper if repetition becomes obvious
  - generic confirm/delete dialog wrapper if repetition becomes obvious
- Add tests in `packages/ui/__tests__/`

### Documentation

- Modify: `apps/dashboard/README.md`
- Modify: `apps/dashboard/CHANGELOG.md`
- Keep route notes and playbook updated if implementation meaningfully shifts details

## Delivery Strategy

Implement in this order so the app gets cleaner incrementally while minimizing merge pain:

1. shared shell, navigation, and route metadata
2. home
3. profile
4. access management
5. vault overview
6. vault entries list
7. vault categories
8. vault editor pages and sidebar draft behavior
9. shared UI extraction, docs, final polish

## Agent Layout

Planned subagent ownership for implementation:

- Agent A: shared shell, page-meta, sidebar, navigation naming, sidebar draft behavior
- Agent B: home + vault overview
- Agent C: profile + access management
- Agent D: vault entries list + categories
- Main agent: editor pages, shared UI integration, conflict resolution, final polish, verification

If a task depends on earlier shared shell work, the dependent agent waits until the required changes land.

## Implementation Tasks

### Task 1: Reshape shared shell, route copy, and navigation

**Files:**

- Modify: `apps/dashboard/components/app-shell.tsx`
- Modify: `apps/dashboard/lib/page-meta.ts`
- Modify: `apps/dashboard/lib/sidebar.ts`
- Possibly modify: `packages/ui/src/components/bubbles-sidebar/bubbles-sidebar-user-menu.tsx`
- Test: `apps/dashboard/__tests__/components/app-shell.test.tsx`

- [ ] Replace redundant in-page route descriptions with a shell-first approach so pages do not repeat breadcrumb context.
- [ ] Rename route labels/copy to match agreed wording:
  - `Account` → `Zugangsverwaltung`
  - remove redundant `Dashboard`-style body headings
  - remove unnecessary `heute` phrasing where agreed
- [ ] Move or prepare `Profil` access toward the sidebar footer/user menu instead of keeping it as a prominent primary nav item.
- [ ] Extend sidebar data shape if needed for temporary draft child items beneath `Einträge`.
- [ ] Add tests that cover the new sidebar/footer navigation behavior and updated route metadata.

### Task 2: Rebuild home as a flat work overview

**Files:**

- Modify: `apps/dashboard/components/home/dashboard-home.tsx`
- Modify: `apps/dashboard/components/home/quick-actions.tsx`
- Modify: `apps/dashboard/components/home/workspace-stats.tsx`
- Modify: `apps/dashboard/components/home/recent-content-list.tsx`
- Modify: `apps/dashboard/components/home/profile-status.tsx`
- Test: `apps/dashboard/__tests__/components/home/dashboard-home.test.tsx`

- [ ] Replace the hero/card-heavy structure with the agreed flat work layout.
- [ ] Keep only `Hallo, Vorname` at the top, removing badges, duplicate descriptive copy, and oversized module blocks.
- [ ] Convert the primary work area into real tabs for `Offene Entwürfe` and `Zuletzt bearbeitet`, defaulting to drafts.
- [ ] Ensure row clicks go directly to the relevant entry page.
- [ ] Hide profile completion entirely when the profile is already complete.
- [ ] Replace large metric tiles with three lighter inline stats and a slim module status line.
- [ ] Restyle quick actions as a quieter vertical tool list without default emphasis.
- [ ] Update tests to match the new information hierarchy.

### Task 3: Turn profile into view-first, edit-second

**Files:**

- Modify: `apps/dashboard/components/profile/profile-editor.tsx`
- Modify: `apps/dashboard/app/(dashboard)/profile/page.tsx`
- Modify: `apps/dashboard/lib/profile/profile.ts`
- Modify: `apps/dashboard/app/(dashboard)/profile/actions.ts`
- Test: `apps/dashboard/__tests__/components/profile/profile-editor.test.tsx`

- [ ] Replace the default always-editing form with a single, calm profile view.
- [ ] Remove auth/account details and slug from the page UI.
- [ ] Show only avatar, display name, bio, and social links in the default state.
- [ ] Add a clear `Bearbeiten` entry point.
- [ ] Implement a full-page edit mode on the same route with top-right `Abbrechen` and `Speichern`.
- [ ] Keep avatar editing only available within edit mode.
- [ ] Keep social links as fixed fields in edit mode, and simple links in view mode.
- [ ] Ensure slug handling moves to internal generation from GitHub username when necessary.
- [ ] Update tests and README/changelog notes accordingly.

### Task 4: Rebuild account into `Zugangsverwaltung`

**Files:**

- Modify: `apps/dashboard/app/(dashboard)/account/page.tsx`
- Modify: `apps/dashboard/app/(dashboard)/account/actions.ts`
- Add/modify: `apps/dashboard/components/account/*`
- Test: `apps/dashboard/__tests__/lib/account/dashboard-access.test.ts`

- [ ] Replace the card-per-account layout with a real management table.
- [ ] Add a flat header with a `Zugang freigeben` dialog trigger.
- [ ] Implement dialog-driven create/edit flows instead of permanently visible forms.
- [ ] Show columns:
  - GitHub-Name
  - E-Mail
  - Rolle
  - Notiz
  - Zuletzt geändert
  - Status
  - Aktionen
- [ ] Keep notes truncated in-table with full note on hover.
- [ ] Keep the current owner visible, lightly marked, and protected from destructive actions.
- [ ] Use `Zugang entziehen` as the destructive action label.

### Task 5: Rebuild vault overview as a vault-only workspace

**Files:**

- Modify: `apps/dashboard/components/vault/vault-overview.tsx`
- Modify: `apps/dashboard/lib/vault/overview.ts`
- Test: `apps/dashboard/__tests__/components/vault/vault-overview.test.tsx`

- [ ] Remove intro/landing-page behavior from `/vault`.
- [ ] Start directly with work: tabs for `Offene Entwürfe` and `Zuletzt bearbeitet`.
- [ ] Add only two compact actions at the top-right: `Neuer Eintrag`, `Neue Kategorie`.
- [ ] Replace heavy stats/cards with the agreed single status line.
- [ ] Remove `Taxonomie` and `Nächste Schritte` presentation from the page.
- [ ] Ensure clicking an item opens the editor directly.

### Task 6: Turn vault entries into a real table

**Files:**

- Modify: `apps/dashboard/components/vault/entries/vault-entry-list.tsx`
- Modify: `apps/dashboard/components/vault/entries/vault-entry-filters.tsx`
- Modify: `apps/dashboard/app/(dashboard)/vault/entries/page.tsx`
- Modify: `apps/dashboard/lib/vault/entries.ts`
- Test: `apps/dashboard/__tests__/components/vault/entries/vault-entry-list.test.tsx`
- Test: `apps/dashboard/__tests__/lib/vault/entries.test.ts`

- [ ] Replace the pseudo-table with a real table and clear headers.
- [ ] Add the agreed toolbar: search, filter, `Neuer Eintrag`.
- [ ] Add the slim summary line above the table.
- [ ] Keep columns limited to title/description, category, status, last edited, actions.
- [ ] Show description as a truncated second line below the title, full content on hover.
- [ ] Use icon actions for edit, preview, delete.
- [ ] Wire preview to open a separate preview page in a new tab.
- [ ] Add classic pagination and only render pagination when needed.
- [ ] Add items-per-page control if implementing the shared component in this pass.

### Task 7: Rebuild categories as a flat hierarchical list

**Files:**

- Modify: `apps/dashboard/components/vault/categories/category-manager.tsx`
- Modify: `apps/dashboard/components/vault/categories/category-tree-list.tsx`
- Modify: `apps/dashboard/app/(dashboard)/vault/categories/page.tsx`
- Modify: `apps/dashboard/app/(dashboard)/vault/categories/actions.ts`
- Modify: `apps/dashboard/lib/vault/category-tree.ts`
- Test: `apps/dashboard/__tests__/components/vault/categories/category-tree-list.test.tsx`

- [ ] Replace the inline form tree with a flatter hierarchical management list.
- [ ] Preserve hierarchy using indentation plus parent/child labels.
- [ ] Make groups optionally collapsible.
- [ ] Add toolbar search and filter.
- [ ] Add the slim category summary line.
- [ ] Move create/edit into dialogs.
- [ ] Keep direct row actions for edit, add child, delete.
- [ ] Keep delete using the shared double-confirmation flow.

### Task 8: Flatten entry editor pages without touching the editor package

**Files:**

- Modify: `apps/dashboard/components/vault/entries/vault-entry-editor.tsx`
- Modify: `apps/dashboard/app/(dashboard)/vault/entries/new/page.tsx`
- Modify: `apps/dashboard/app/(dashboard)/vault/entries/[id]/page.tsx`
- Modify: `apps/dashboard/lib/sidebar.ts`
- Test: `apps/dashboard/__tests__/components/vault/entries/vault-entry-editor.test.tsx`

- [ ] Remove the in-page duplicate/delete management panels entirely.
- [ ] Keep the existing editor package intact.
- [ ] Add the agreed flat top area only:
  - `new`: `Neuer Eintrag`
  - `edit`: overline `Eintrag bearbeiten` + entry title
  - compact context line `Status · Kategorie`
  - top-right actions `Speichern` and `Vorschau`
- [ ] Rename preview action to just `Vorschau`.
- [ ] Wire `Vorschau` to open the rendered frontend preview in a new tab.
- [ ] Add temporary child sidebar items for active draft contexts under `Einträge`.
- [ ] Add per-item close/remove actions for those draft sidebar items that only clear local drafts, not records.
- [ ] Remove duplicate/draft-copy UI entirely.

### Task 9: Extract reusable shared UI only where repetition proves it

**Files:**

- Add/modify: `packages/ui/src/components/...`
- Add tests: `packages/ui/__tests__/...`

- [ ] Review which repeated patterns are clearly shared after route implementations land.
- [ ] Extract only the patterns that are obviously reusable:
  - confirm/delete dialog
  - search/filter toolbar
  - pagination/items-per-page
- [ ] Keep extractions minimal and aligned with existing `@bubbles/ui` patterns.
- [ ] Add tests/docs for any new shared primitives.

### Task 10: Final polish, docs, and verification

**Files:**

- Modify: `apps/dashboard/README.md`
- Modify: `apps/dashboard/CHANGELOG.md`
- Possibly update route notes if implementation meaningfully sharpens decisions

- [ ] Update README to reflect the new route behavior and shared UI direction.
- [ ] Update CHANGELOG with the redesign scope.
- [ ] Run dashboard tests.
- [ ] Run any affected `@bubbles/ui` tests.
- [ ] Run formatting, linting, and typechecking for the touched workspace(s).
- [ ] Do one final pass to remove stray old copy, lingering card wrappers, and inconsistent action naming.

## Verification Commands

Run these before calling the work complete:

```bash
pnpm --filter @bubbles/dashboard test
pnpm --filter @bubbles/dashboard lint
pnpm --filter @bubbles/dashboard typecheck
pnpm --filter @bubbles/ui test
pnpm --filter @bubbles/ui lint
pnpm --filter @bubbles/ui typecheck
```

If the workspace names differ, adjust to the actual package names from the repo.

## Notes For Execution

- Follow `AGENTS.md` throughout.
- Keep mobile-first.
- Do not re-invent the editor package.
- Reuse repo tokens, colors, and shared UI primitives.
- Keep destructive actions out of the editor pages.
- Continue implementation until the full agreed scope is done, then smooth and verify.
