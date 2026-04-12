---
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics', 'step-03-create-stories', 'step-04-final-validation']
status: complete
completedAt: '2026-04-12'
inputDocuments:
  - _bmad-output/planning-artifacts/prd-markdown-editor.md
  - docs/architecture-the-coding-vault.md
  - docs/integration-architecture.md
---

# bubbles-verse — Epic Breakdown: @bubbles/markdown-editor & @bubbles/markdown-renderer

## Overview

This document provides the complete epic and story breakdown for the `@bubbles/markdown-editor` and `@bubbles/markdown-renderer` packages, decomposing requirements from the PRD and architecture documents into implementable stories.

## Epic Execution Rule

All stories in this document are extraction and porting stories.

They must be implemented by porting the existing working code from the designated reference sources, not by designing new implementations from scratch.

### Primary Source Mapping

- Epic 1: monorepo package scaffolding using in-repo package conventions, plus exact dependency and tooling values from the designated reference sources where applicable
- Epic 2: `to-be-integrated/` first, otherwise `lms-ref` for renderer components, renderer behavior, and renderer styles
- Epic 3: `to-be-integrated/` first, otherwise `portal-ref` for serializer baseline plus explicitly documented `lms-ref` additions
- Epic 4: `to-be-integrated/` first, otherwise `portal-ref` for editor, preview, forms, autosave, import modal, and related behavior
- Epic 5: current monorepo app migration work, using the extracted package behavior as defined by the reference sources above

### Reference Availability Rule

If the required reference implementation cannot be inspected in the primary source, check the designated fallback source.

If the fallback source is also unavailable, incomplete, or inaccessible, stop and ask the user how to proceed before making any code changes.

### Deviation Approval Rule

If implementation appears to require any deviation from the reference implementation or the agreed plan, stop before making the change and ask the user for a decision.

Present:

- what is different
- why the deviation is being considered
- why the reference or current plan cannot be followed as-is
- what options are available
- what tradeoffs each option introduces

Wait for explicit user approval before implementing any deviation.

### Mandatory `AGENTS.md` Rule

All stories in this epic must explicitly require implementation to follow `AGENTS.md` in full.

## Requirements Inventory

### Functional Requirements

FR1: A developer can initialize `<MarkdownEditor>` with a configurable subset of block type plugins
FR2: A developer can provide a custom metadata form via the `renderForm` render prop, receiving full editor state as typed props
FR3: A developer can use the default `<EditorForm>` without providing a custom form
FR4: A developer can configure a service-agnostic image upload handler via the `imageUploader` prop
FR5: A developer can define post-submit behavior via the `onSuccess` callback — the package never handles navigation internally
FR6: A developer can initialize the editor in edit mode with existing content via `initialData` and `isEditMode`
FR7: A developer can extend the MDX component allowlist with app-specific component names via `allowedComponents` — the default allowlist cannot be reduced
FR8: The editor automatically saves draft content to localStorage during authoring
FR9: The editor maintains separate localStorage keys for create mode and edit mode drafts
FR10: Draft content is restored on page load if a draft exists for the current mode
FR11: Draft saving is disabled after a successful submit to prevent stale draft restoration
FR12: The editor supports import of existing Markdown content via an import modal
FR13: The editor automatically derives the entry title from the first H1 block in the editor content
FR14: The editor automatically generates a URL slug from the derived title
FR15: A content author can manually override the auto-generated slug; after manual edit the slug is no longer auto-updated
FR16: The `generateSlug` utility is available as a standalone export for use outside the editor component
FR17: The editor renders a live split-pane MDX preview that updates as content is authored
FR18: Scrolling in the editor pane scrolls the preview pane to the corresponding block, and vice versa
FR19: Every rendered block in the preview is addressable by block ID for scroll targeting
FR20: The editor serializes EditorJS block output to a valid MDX string covering all 15 supported block types
FR21: The serializer escapes MDX brace expressions in user content to prevent JSX injection
FR22: The serializer validates inline component shortcodes against an allowlist before including them in MDX output
FR23: The serializer sanitizes HTML artifacts in block content (e.g. `<br>` → `<br />`)
FR24: The serializer optionally generates heading anchor IDs for TOC use cases, keyed by block ID
FR25: The serializer is available as a standalone tree-shakeable export
FR26: A developer can render stored MDX content via `<MdxRenderer>` without any dependency on `@bubbles/markdown-editor`
FR27: A developer can override or extend any default block component via the `components` prop map
FR28: The renderer provides default implementations for all standard block types: alerts, code blocks, checklists, images, embeds, collapsible toggles, links
FR29: `MarkdownCodeBlock` renders syntax-highlighted code using Catppuccin Latte (light) and Catppuccin Mocha (dark) themes via Shiki CSS Variables Mode
FR30: Editor, preview, and renderer styles are available as separate importable CSS files
FR31: All package styles reference only CSS custom properties from `@bubbles/ui/globals.css` — no hardcoded colors
FR32: Syntax highlighting token colors adapt automatically to light/dark mode via the `.dark` class
FR33: The `--sh-*` syntax token variables and `--code-bg` are defined in `renderer.css` and removed from `apps/the-coding-vault/app/globals.css`
FR34: The package maintains a `DEFAULT_ALLOWED_MDX_COMPONENTS` set that defines the boundary for valid inline component shortcodes
FR35: Apps can only extend `DEFAULT_ALLOWED_MDX_COMPONENTS`, never reduce it
FR36: Shortcode props are JSON-validated before insertion into MDX output
FR37: Both packages are consumable via `workspace:*` Bun workspace protocol
FR38: All exported utilities and components have full TypeScript type coverage with no `any`
FR39: TypeScript declarations are provided for all EditorJS plugins that lack upstream types
FR40: All EditorJS plugin versions are managed exclusively at the package level — consuming apps declare no plugin dependencies directly
FR41: Each package ships a `README.md` with API surface documentation and an integration example

### NonFunctional Requirements

NFR1 (Performance): The live MDX preview updates within a perceptible response time as block content changes — no debounce delay that disrupts the authoring flow
NFR2 (Performance): `<MdxRenderer>` compiles and renders MDX at runtime without blocking the page — compilation errors are caught and surfaced gracefully, not thrown
NFR3 (Performance): EditorJS initializes without blocking the UI thread — initialization is deferred if needed
NFR4 (Security): No component name outside the merged allowlist can appear as a valid shortcode in serialized MDX output
NFR5 (Security): No raw brace expressions from user-authored text reach the MDX output — `escapeMdxBraces()` is applied to all text content before serialization
NFR6 (Security): Malformed or non-JSON shortcode prop strings are rejected at serialization time, not silently passed through
NFR7 (Maintainability): Both packages export only what is explicitly part of the public API — no internal implementation details are accessible to consumers
NFR8 (Maintainability): All public exports are fully typed with no `any` — TypeScript consumers get complete IntelliSense coverage including EditorJS plugin types
NFR9 (Maintainability): CSS stylesheets are importable independently — a renderer-only consumer imports no editor toolbar CSS
NFR10 (Maintainability): Plugin version updates require changes in exactly one place (the package) and propagate to all consumers without any consumer-side changes
NFR11 (Testing): The EditorJS → MDX serializer has unit test coverage for all 15 block type handlers
NFR12 (Testing): Serializer security functions (`escapeMdxBraces`, allowlist enforcement, prop JSON validation) have dedicated unit test coverage including edge cases
NFR13 (Testing): `generateSlug` has unit test coverage including special characters, unicode, and empty string inputs
NFR14 (Testing): Tests run with Vitest, consistent with the monorepo test setup

### Additional Requirements

- Both packages added to Turborepo build pipeline in `turbo.json`, consistent with existing packages
- Both packages ship `README.md`, `CHANGELOG.md`, and `documentation/` as needed (per monorepo docs policy)
- No npm publish — internal consumption only via `workspace:*` Bun workspaces
- Project context is brownfield extraction — proven implementation exists in reference projects; packaging is the primary work

### UX Design Requirements

No UX design document exists for this feature. These packages are developer tools (shared libraries); no app-facing UI screens are defined in this scope.

### FR Coverage Map

FR1–FR7: Epic 4 — Editor config, forms, imageUploader, onSuccess, edit mode, allowlist
FR8–FR12: Epic 4 — Draft autosave, restore, disable after submit, import modal
FR13–FR16: Epic 4 — Title/slug derivation, generateSlug standalone
FR17–FR19: Epic 4 — Live preview, scroll sync, block addressing
FR20–FR25: Epic 3 — Serializer, all 15 block types, security, tree-shakeable export
FR26–FR29: Epic 2 — MdxRenderer, components override, default Markdown* components, Shiki
FR30: Epic 2 (renderer.css) + Epic 4 (editor.css, preview.css)
FR31–FR32: Epic 2 + Epic 4 — CSS vars only, dark mode
FR33: Epic 2 (define --sh-* in renderer.css) + Epic 5 (remove from vault globals.css)
FR34–FR36: Epic 3 — Serializer security (allowlist, brace escaping, JSON validation)
FR37–FR41: Epic 1 — Package infra, workspace:*, TypeScript, plugin versions, README

## Epic List

### Epic 1: Package Infrastructure
Manuel kann beide Packages im Monorepo aufsetzen, bauen und testen. Vollständige Toolchain konfiguriert. Prerequisite für alles.
**FRs covered:** FR37, FR38, FR39, FR40, FR41

### Epic 2: MDX Renderer & Default Components
Manuel kann stored MDX in jeder App mit `<MdxRenderer>` rendern — standalone, null Editor-Dependency, alle Default-Komponenten mit Theming und Dark Mode.
**FRs covered:** FR26, FR27, FR28, FR29, FR30 (renderer.css), FR31, FR32, FR33

### Epic 3: EditorJS → MDX Serializer
Manuel hat einen vollständig getesteten, sicheren Serializer für alle 15 Block-Types — standalone exportierbar, security patterns vollständig.
**FRs covered:** FR20, FR21, FR22, FR23, FR24, FR25, FR34, FR35, FR36

### Epic 4: Content Authoring Editor
Manuel kann `<MarkdownEditor>` in jede App integrieren — mit Live Preview, Draft Autosave, Scroll Sync, Metadata Form, Slug-Utilities, und vollem Plugin-Set.
**FRs covered:** FR1–FR19, FR30 (editor.css, preview.css), FR31

### Epic 5: Coding Vault Migration
The Coding Vault's embedded Editor komplett entfernt — Vault wird read-only und konsumiert nur `@bubbles/markdown-renderer`.
**FRs covered:** FR33 (Migration-Teil: --sh-* aus vault globals.css entfernen)

---

## Epic 1: Package Infrastructure

Beide Packages vollständig im Monorepo aufgesetzt, gebaut und konsumierbar. Prerequisite für alle folgenden Epics.

### Story 1.1: Scaffold `@bubbles/markdown-renderer`

As a developer,
I want `@bubbles/markdown-renderer` scaffolded as a proper monorepo package,
So that I can consume it via `workspace:*` in any app without manual setup.

**Acceptance Criteria:**

**Given** the monorepo root
**When** `@bubbles/markdown-renderer` is set up
**Then** the package exists at `packages/markdown-renderer/` with `package.json` declaring `name: "@bubbles/markdown-renderer"` and `workspace:*` compatibility
**And** `tsconfig.json` extends `@bubbles/typescript-config` with strict mode
**And** `eslint.config.mjs` extends `@bubbles/eslint-config`
**And** the package is added to `turbo.json` build pipeline
**And** `README.md` and `CHANGELOG.md` exist at the package root
**And** `bun run build` completes without errors from the monorepo root

### Story 1.2: Scaffold `@bubbles/markdown-editor` with EditorJS plugin declarations

As a developer,
I want `@bubbles/markdown-editor` scaffolded with all 15 EditorJS plugins installed and typed,
So that I have a single, version-pinned source of truth for all editor dependencies.

**Acceptance Criteria:**

**Given** the monorepo root
**When** `@bubbles/markdown-editor` is set up
**Then** the package exists at `packages/markdown-editor/` with the same tooling conventions as `@bubbles/markdown-renderer` (tsconfig, eslint, turbo, README, CHANGELOG)
**And** all 15 EditorJS plugin packages are declared as dependencies with pinned versions in `package.json`
**And** custom `.d.ts` declarations exist for all plugins that lack upstream TypeScript types — no `any` in plugin type signatures
**And** no consuming app needs to declare any EditorJS plugin as a direct dependency
**And** `bun run build` completes without TypeScript errors from the monorepo root

---

## Epic 2: MDX Renderer & Default Components

Manuel kann stored MDX in jeder App mit `<MdxRenderer>` rendern — standalone, null Editor-Dependency, alle Default-Komponenten mit Theming und Dark Mode.

### Story 2.1: Default MDX block components (`Markdown*`)

As a developer,
I want a complete set of default `Markdown*` components exported from `@bubbles/markdown-renderer`,
So that stored MDX renders correctly without writing any custom components.

**Acceptance Criteria:**

**Given** `@bubbles/markdown-renderer` is installed
**When** I import the default components
**Then** `MarkdownAlerts`, `MarkdownCodeBlock`, `MarkdownChecklist`, `MarkdownImage`, `MarkdownEmbed`, `MarkdownToggle`, `MarkdownLink` are all exported individually and as a combined map
**And** `MarkdownCodeBlock` renders syntax-highlighted code using Shiki CSS Variables Mode with Catppuccin Latte (light) and Catppuccin Mocha (dark) themes
**And** `MarkdownAlerts` supports `info`, `success`, `warning`, `danger` types
**And** `MarkdownToggle` is a collapsible section
**And** all components are fully typed with no `any`

### Story 2.2: `<MdxRenderer>` component

As a developer,
I want a `<MdxRenderer>` component that compiles and renders stored MDX at runtime,
So that I can display rich content with a single import and no editor dependency.

**Acceptance Criteria:**

**Given** a stored MDX string and `<MdxRenderer>` imported from `@bubbles/markdown-renderer`
**When** I render `<MdxRenderer content={mdxString} />`
**Then** the MDX is compiled and rendered using the same runtime pipeline behavior as the designated reference implementation
**And** all default `Markdown*` components are available automatically without manual registration
**And** a developer can override or extend individual components via the `components` prop map
**And** compilation errors are caught and surfaced as an error state — never thrown to the React error boundary
**And** `@bubbles/markdown-renderer` has zero dependency on `@bubbles/markdown-editor`

### Story 2.3: Renderer CSS stylesheet (`renderer.css`)

As a developer,
I want a standalone `renderer.css` I can import to style rendered MDX content,
So that I get correct typography, block styles, and syntax highlighting without any editor CSS.

**Acceptance Criteria:**

**Given** `import '@bubbles/markdown-renderer/styles/renderer'` in an app
**When** MDX content is rendered via `<MdxRenderer>`
**Then** all block styles (typography, code blocks, alerts, toggles) are applied
**And** `--sh-*` syntax token variables and `--code-bg` are defined in `renderer.css`
**And** syntax highlighting adapts to light/dark mode via the `.dark` class on a parent element
**And** all CSS uses only `@bubbles/ui/globals.css` custom properties — no hardcoded colors
**And** importing `renderer.css` loads no editor toolbar or preview pane styles

---

## Epic 3: EditorJS → MDX Serializer

Manuel hat einen vollständig getesteten, sicheren Serializer für alle 15 Block-Types — standalone exportierbar, security patterns vollständig.

### Story 3.1: Core serializer — block type handlers

As a developer,
I want `serializeToMdx()` exported from `@bubbles/markdown-editor` covering all 15 block types,
So that EditorJS output is converted to valid MDX I can store and render.

**Acceptance Criteria:**

**Given** EditorJS `OutputData` with any combination of blocks
**When** `serializeToMdx(blocks)` is called
**Then** `paragraph`, `header`, `list` (ordered/unordered/checklist), `code`, `quote`, `alert`, `delimiter`, `toggle`, `table`, `embed`, `image`, `inlineCode`, `strikethrough`, `annotation`, `InlineHotkey` all produce correct MDX output
**And** every block is wrapped in `<div data-block-id="{blockId}">` for scroll targeting
**And** toggle blocks recursively serialize their nested child blocks
**And** table blocks produce correctly padded GFM markdown tables with optional heading separator
**And** the function is tree-shakeable — importable standalone without loading EditorJS or any React component

### Story 3.2: Serializer security patterns

As a developer,
I want the serializer to enforce security boundaries on user-authored content,
So that no JSX injection, invalid shortcodes, or malformed props reach the MDX output.

**Acceptance Criteria:**

**Given** user-authored text containing `{`, `}`, or MDX-like expressions
**When** `serializeToMdx()` processes the content
**Then** `escapeMdxBraces()` is applied to all user text before serialization — raw brace expressions never appear in output

**Given** a paragraph block containing `[[ComponentName]]` or `<ComponentName />` shortcode syntax
**When** the serializer processes it
**Then** only component names present in `DEFAULT_ALLOWED_MDX_COMPONENTS` are rendered as MDX components — all others are treated as plain text
**And** apps can extend the allowlist via `allowedComponents` — merged as a superset, never reduced

**Given** a shortcode with JSON props `[[Component {"key":"value"}]]`
**When** the serializer processes it
**Then** props are JSON-parsed and re-serialized before insertion — malformed JSON props result in plain text output, never raw string insertion

**Given** block content containing `<br>` tags
**When** serialization completes
**Then** all `<br>` occurrences are replaced with `<br />` for MDX compatibility

### Story 3.3: Serializer unit tests

As a developer,
I want comprehensive Vitest unit tests for the serializer,
So that I can refactor or extend it with confidence.

**Acceptance Criteria:**

**Given** the Vitest test suite
**When** all serializer tests run
**Then** each of the 15 block type handlers has at least one test covering expected MDX output
**And** `escapeMdxBraces()` has tests for nested braces, JSX-like content, and empty strings
**And** `tryParseInlineComponent` / allowlist enforcement has tests for: valid shortcode, blocked component name, malformed JSON props, JSX-style `<Name />` syntax
**And** toggle with nested children has a recursive serialization test
**And** `<br>` → `<br />` sanitization has a dedicated test
**And** all tests pass with `bun run test` from the monorepo root

### Story 3.4: `headingAnchorIdsByBlockId` option

As a developer,
I want `serializeToMdx()` to optionally generate heading anchor IDs keyed by block ID,
So that I can build TOC navigation that links to specific headings in rendered content.

**Acceptance Criteria:**

**Given** EditorJS output containing header blocks
**When** `serializeToMdx(blocks, { headingAnchorIdsByBlockId: map })` is called with a pre-populated map
**Then** each header block uses its mapped anchor ID as an `id` attribute in the rendered heading
**And** when the option is omitted, serializer output is identical to the base behavior — no regression
**And** the option type is fully typed with no `any`

---

## Epic 4: Content Authoring Editor

Manuel kann `<MarkdownEditor>` in jede App integrieren — mit Live Preview, Draft Autosave, Scroll Sync, Metadata Form, Slug-Utilities, und vollem Plugin-Set.

### Story 4.1: EditorJS wrapper with configurable plugin subset

As a developer,
I want `<MarkdownEditor>` with all 15 block types available and a `plugins` prop for subsetting,
So that I can activate only the blocks relevant to each use case.

**Acceptance Criteria:**

**Given** `<MarkdownEditor>` rendered without a `plugins` prop
**When** EditorJS initializes
**Then** all 15 block types are available in the toolbar
**And** EditorJS initializes without blocking the UI thread
**And** the `cleanupHasRunOnceRef` pattern prevents double-initialization under React 18 StrictMode

**Given** `<MarkdownEditor plugins={['paragraph', 'header', 'list', 'image']} />`
**When** EditorJS initializes
**Then** only the specified block types appear in the toolbar — unused plugins are not loaded

### Story 4.2: `renderForm` render prop and default `<EditorForm>`

As a developer,
I want to inject a custom metadata form via `renderForm` or fall back to the default `<EditorForm>`,
So that each product area can define its own fields without touching the package.

**Acceptance Criteria:**

**Given** `<MarkdownEditor renderForm={(props) => <MyForm {...props} />} />`
**When** the editor renders
**Then** `MyForm` receives `editorOutput`, `editorContent`, `editorReady`, `isEditMode`, `initialData` as typed props — all fully typed with no `any`

**Given** `<MarkdownEditor />` without `renderForm`
**When** the editor renders
**Then** the default `<EditorForm>` is shown with fields: title (auto from H1), slug (auto-generated, manually overridable), description, tags, and `published | unpublished` status

**Given** `<MarkdownEditor imageUploader={fn} onSuccess={fn} />`
**When** a form is submitted
**Then** `onSuccess` is called with the serialized data — the package never handles routing or navigation internally

### Story 4.3: Metadata derivation and `generateSlug`

As a developer,
I want the editor to auto-derive the title and slug from content, with manual override support,
So that authors don't need to type metadata they've already written in the editor.

**Acceptance Criteria:**

**Given** an editor with a heading level-1 block
**When** the block content changes
**Then** the title field in the form is automatically updated to the H1 text

**Given** a title that was auto-derived from the H1
**When** the title changes
**Then** the slug field is automatically updated via `generateSlug(title)`

**Given** a slug that has been manually edited by the author
**When** the title or H1 changes afterward
**Then** the slug is no longer auto-updated — the manual value is preserved

**Given** `import { generateSlug } from '@bubbles/markdown-editor'`
**When** called with any string
**Then** it returns a URL-safe slug — handles special characters, unicode, and empty string input correctly
**And** unit tests cover special characters, unicode, empty string, and German umlauts

### Story 4.4: Draft autosave and restore

As a developer (and as a content author),
I want the editor to automatically save drafts to localStorage and restore them on page load,
So that work is never lost when a tab is closed or refreshed.

**Acceptance Criteria:**

**Given** an author writing content in create mode
**When** content or form fields change
**Then** the draft is automatically saved to a create-mode localStorage key

**Given** an author editing existing content in edit mode
**When** content or form fields change
**Then** the draft is saved to a separate edit-mode localStorage key — distinct from the create-mode key

**Given** a page load when a draft exists for the current mode
**When** `<MarkdownEditor>` mounts
**Then** the draft is restored automatically — editor content and form fields reflect the saved draft

**Given** a successful form submit
**When** `onSuccess` fires
**Then** draft saving is disabled — the draft is not overwritten with stale post-submit state

### Story 4.5: Live split-pane MDX preview with scroll sync

As a developer (and as a content author),
I want a live split-pane preview with bidirectional scroll sync,
So that I can see the rendered output while writing without switching views.

**Acceptance Criteria:**

**Given** content being authored in the editor pane
**When** any block changes
**Then** the MDX preview pane updates to reflect the current content with no perceptible delay

**Given** an author scrolling in the editor pane
**When** the scroll position changes
**Then** the preview pane scrolls to the corresponding block

**Given** an author scrolling in the preview pane
**When** the scroll position changes
**Then** the editor pane scrolls to the corresponding block

**And** every block in the preview is addressable by its EditorJS block ID via `data-block-id` attribute

### Story 4.6: Import-from-Markdown modal and editor CSS

As a developer (and as a content author),
I want to import existing Markdown into the editor and have correct editor styles,
So that migrating existing content is easy and the editor looks right out of the box.

**Acceptance Criteria:**

**Given** the import modal is opened
**When** a Markdown string is pasted and confirmed
**Then** the editor content is replaced with the converted EditorJS blocks

**Given** `import '@bubbles/markdown-editor/styles/editor'` and `import '@bubbles/markdown-editor/styles/preview'` in an app
**When** `<MarkdownEditor>` renders
**Then** EditorJS toolbar, block styles, and split-pane layout are correctly styled
**And** all CSS uses only `@bubbles/ui/globals.css` custom properties — no hardcoded colors
**And** editor and preview CSS are separate files — apps can import only what they need

---

## Epic 5: Coding Vault Migration

The Coding Vault's embedded Editor komplett entfernt — Vault wird read-only und konsumiert nur `@bubbles/markdown-renderer`.

### Story 5.1: Replace Coding Vault renderer with `@bubbles/markdown-renderer`

As a developer,
I want The Coding Vault's public entry pages to use `<MdxRenderer>` from `@bubbles/markdown-renderer`,
So that the Vault has zero duplicated renderer code and automatically benefits from package improvements.

**Acceptance Criteria:**

**Given** `apps/the-coding-vault` after the migration
**When** a visitor opens a Vault entry page
**Then** the entry content is rendered via `<MdxRenderer>` from `@bubbles/markdown-renderer`
**And** the embedded MDX rendering code that previously lived in `apps/the-coding-vault` is removed entirely
**And** `--sh-*` syntax token variables and `--code-bg` are removed from `apps/the-coding-vault/app/globals.css` — they now come from `renderer.css`
**And** `import '@bubbles/markdown-renderer/styles/renderer'` is added to the Vault's app layout
**And** the Vault app declares `@bubbles/markdown-renderer` as a `workspace:*` dependency
**And** the Vault builds and renders entries correctly with no visual regression
