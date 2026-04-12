---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-02b-vision', 'step-02c-executive-summary', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish', 'step-12-complete']
status: complete
completedAt: '2026-04-12'
classification:
  projectType: developer_tool
  domain: general
  complexity: medium
  projectContext: brownfield
inputDocuments:
  - _bmad-output/planning-artifacts/product-brief-markdown-editor.md
  - _bmad-output/planning-artifacts/product-brief-markdown-editor-distillate.md
  - _bmad-output/planning-artifacts/product-brief-bubbles-verse-distillate.md
  - _bmad-output/planning-artifacts/product-brief-coding-vault-distillate.md
  - _bmad-output/planning-artifacts/product-brief-dashboard-distillate.md
  - docs/architecture-the-coding-vault.md
  - docs/integration-architecture.md
workflowType: 'prd'
---

# Product Requirements Document — @bubbles/markdown-editor & @bubbles/markdown-renderer

**Author:** Manuel
**Date:** 2026-04-12

---

## Executive Summary

`@bubbles/markdown-editor` and `@bubbles/markdown-renderer` are two purpose-built packages that extract a battle-tested EditorJS stack from existing reference projects into the bubbles-verse monorepo. The editor stack was originally prototyped in The Coding Vault, then matured to production quality at an external company project — and is now being back-ported as the canonical shared implementation. The primary consumers are the Dashboard (Phase 2: Vault content management) and The Coding Vault (public entry rendering), with Portfolio and a future blog following. Without these packages, Dashboard Phase 2 cannot begin.

The deeper problem being solved is not just code duplication — it is **content decoupled from deployments**. Once a custom MDX component is built and deployed, creating and publishing new content that uses it is a database operation, not a code change. These packages are the write and read surface for that entire system.

### What Makes This Special

The implementation is not speculative. Every hard problem — 15 EditorJS plugins, the EditorJS-to-MDX serializer, live split-pane preview, draft autosave, bidirectional scroll sync, MDX injection protection — is already solved in the reference project. Packaging is the unlock: it adds per-app configurability (custom metadata forms via render prop, configurable plugin subsets, overridable MDX components) on top of a proven foundation. No app ever copies editor code again; the monorepo was built specifically to make this extraction possible.

## Project Classification

| Dimension | Value |
|---|---|
| **Project Type** | Developer Tool — shared library package |
| **Domain** | General (content tooling, no regulated domain) |
| **Complexity** | Medium — proven implementation, non-trivial plugin ecosystem and React integration subtleties |
| **Project Context** | Brownfield — extraction from `to-be-integrated/` first, with `portal-ref` (editor baseline) and `lms-ref` (renderer baseline) as fallback sources; not a greenfield build |

## Reference Implementation Contract

This project is a brownfield extraction, not a greenfield rewrite.

The required implementation already exists in working reference sources. The default implementation path for every story is to port the existing working code into the monorepo package or app, preserving behavior and architecture unless an explicit exception is documented and approved by the user.

### Reference Source Priority

1. `to-be-integrated/` is the primary in-repo reference source whenever the relevant implementation exists there.
2. `portal-ref` is the fallback source of truth for editor, preview, form, autosave, import flow, slug behavior, and the serializer baseline.
3. `lms-ref` is the fallback source of truth for renderer behavior, renderer styling, and explicitly identified feature differences.

### Conflict Resolution Rules

- If `to-be-integrated/` contains the relevant implementation, it takes precedence.
- If `portal-ref` and `lms-ref` differ, the story must explicitly state which parts come from which source.
- If no story-specific exception is documented, do not invent a third implementation.

### Allowed Deviations

- package boundaries and file placement
- import path updates
- naming adjustments required by the monorepo
- strict typing improvements
- shared token or shared UI integration required by this monorepo
- explicit acceptance-criteria-driven adaptations documented in the story

### Forbidden Deviations

- replacing a working reference implementation with a newly authored one
- changing libraries or architectural approach because it seems cleaner, newer, or more idiomatic
- redesigning data flow, rendering flow, or component boundaries without a documented requirement
- simplifying behavior that already exists in the reference implementation
- silently dropping edge-case behavior present in the reference implementation

### Reference Availability Rule

If a required reference source is unavailable, inaccessible, or incomplete, implementation must pause for user clarification.

Lack of access to the reference implementation is not a reason to invent a new solution.

### Deviation Approval Rule

If implementation would deviate from the reference behavior or the agreed plan, implementation must stop, present the deviation with rationale and options, and wait for explicit user approval before any code changes are made.

### Mandatory `AGENTS.md` Rule

All implementation work must follow `AGENTS.md` in full.

If `AGENTS.md` conflicts with examples, suggestions, or generic guidance in a story, `AGENTS.md` takes precedence.

---

## Success Criteria

### User Success

- Manuel can create and edit Vault entries entirely from the Dashboard without touching The Coding Vault app
- Any app in the monorepo can render MDX content by importing `@bubbles/markdown-renderer` and passing a `components` map — no boilerplate beyond that
- A custom MDX component built and deployed once is usable in any future entry without touching the package

### Technical Success

- `@bubbles/markdown-editor` is consumed by the Dashboard in at least two distinct product areas (Vault, Portfolio) without any copy-paste — each area configures its own plugin subset and metadata form via props
- `@bubbles/markdown-renderer` is consumed by at least two apps (The Coding Vault, Portfolio) without any copy-paste of renderer code
- The Coding Vault's embedded editor is **removed entirely** — the app becomes a read-only public surface consuming only `@bubbles/markdown-renderer`
- Apps can override or extend individual MDX components via the `components` prop without touching package source
- Serializer utilities and `generateSlug` are tree-shakeable and usable standalone
- No EditorJS plugin versions diverge between product areas or apps — version management is the package's responsibility
- Image upload is fully service-agnostic via `imageUploader` prop — no cloud provider is a package dependency
- All non-brand FontAwesome icons replaced with HugeIcons; `@fortawesome/free-brands-svg-icons` retained for brand logos (YouTube, GitHub, etc.) where no alternative exists

### Measurable Outcomes

- Zero editor-related code duplication across the monorepo after extraction
- Dashboard Phase 2 (Vault content management) can begin immediately after package delivery
- A new Dashboard product area requiring rich content editing can integrate `@bubbles/markdown-editor` without building any editor infrastructure

---

## Product Scope

### v1 — Complete Package

The package ships complete. There is no planned incremental delivery — all of the following is v1:

- EditorJS wrapper with all 15 block types, configurable per use case via plugin subset API
- `<MarkdownEditor>` with `renderForm` render prop, `imageUploader` prop, `onSuccess` callback
- Default `<EditorForm>` (title, slug, description, tags, `published` | `unpublished` status)
- `generateSlug` utility (exported, tree-shakeable)
- EditorJS → MDX serializer with MDX component allowlisting and brace escaping; `headingAnchorIdsByBlockId` option available for renderer use
- Live split-pane MDX preview (bundled with editor, not standalone)
- Draft autosave to localStorage (last-write-wins; no multi-tab conflict resolution needed)
- Bidirectional scroll sync
- Import-from-Markdown modal
- Default MDX block components shipped with `@bubbles/markdown-renderer`: alerts, code blocks (Shiki), checklists, images, embeds, collapsible toggles, links
- App-specific MDX component support via `components` override prop — apps bring their own, package provides the registry mechanism
- Editor, preview, and renderer CSS stylesheets using only `@bubbles/ui` CSS custom properties
- TypeScript declarations for all EditorJS plugins (no `any`)
- Unit tests for serializer (all 15 block handlers, edge cases, security patterns)
- README with API surface documentation and integration example per package

### Out of Scope — Not Planned

- Versioning / changelog workflow
- Status model beyond `published` | `unpublished`
- `@bubbles/shared-types` package
- Cloudinary as a bundled dependency (image upload always via `imageUploader` prop)
- Multi-tab draft conflict resolution (last-write-wins is sufficient)
- App-specific MDX components bundled inside the package (stay per-app, passed via prop)

---

## User Journeys

### Journey 1: Integrating the Editor for a Feature-Rich Use Case (Vault)

Manuel is building the Vault content management area in the Dashboard. He installs `@bubbles/markdown-editor`, imports `<MarkdownEditor>`, and passes a `renderForm` render prop with a Vault-specific metadata form — title, slug, description, tags, category, publish status. He configures the full plugin set (all 15 block types). He wires up the `imageUploader` prop to the Vault's Cloudinary upload endpoint and provides an `onSuccess` callback that navigates to the entry list after save.

The editor renders in split-pane mode: EditorJS on the left, live MDX preview on the right. He writes a test entry, watches the preview update in real time, saves a draft, closes the tab, returns — the draft is still there. He submits, `onSuccess` fires, he's redirected. No editor infrastructure was built — only integration work.

**Capabilities revealed:** `renderForm` render prop, plugin subset configuration, `imageUploader` prop, `onSuccess` callback, draft autosave, live preview, full block type set.

---

### Journey 2: Integrating the Editor for a Lightweight Use Case (Portfolio)

Manuel is building the Portfolio project management area in the Dashboard. Projects have a title, description, tech stack tags, links, and a short rich-text body — no heading anchors, no code blocks, no embeds needed. He imports `<MarkdownEditor>` again, passes a Portfolio-specific `renderForm`, and sets a `plugins` config that activates only `paragraph`, `list`, `header`, and `image`. The toolbar is minimal. The form is different. But the core editor, preview, autosave, and serializer are identical to the Vault integration — no code was duplicated, only configured differently.

**Capabilities revealed:** Plugin subset API, per-use-case form customization via render prop, same package — different experience.

---

### Journey 3: Writing and Publishing a Vault Entry

Manuel opens the Vault section of the Dashboard. He starts a new entry. The editor is empty, the slug field is blank. He types a heading — the title field auto-populates, the slug auto-generates. He writes the entry using a mix of paragraphs, code blocks, and alert blocks. The alert block renders automatically in the live preview via `MarkdownAlerts` — no manual shortcode needed. Halfway through, he's interrupted. He closes the tab. The next day he returns — the draft is waiting exactly as he left it.

He finishes, sets status to `published`, submits. The EditorJS output is serialized to MDX, saved to the database. The Vault app picks it up on next render. No deploy was needed to publish new content.

**Capabilities revealed:** Auto title/slug derivation, `generateSlug`, draft autosave and restore, automatic block component rendering (no shortcodes for default blocks), serializer, publish status, content-as-data workflow.

---

### Journey 4: Reading Rendered Content (Public Reader)

A visitor opens a Vault entry page. The Coding Vault app fetches the stored MDX string from the database and passes it to `<MdxRenderer>`. The renderer compiles the MDX at runtime, maps block output to the registered default components (`MarkdownCodeBlock` with Shiki highlighting, `MarkdownAlerts`, `MarkdownToggle`), and renders the page. The visitor sees a syntax-highlighted code block, an expandable toggle section, and a styled alert — all from the stored MDX. No editor code was loaded; the renderer has no dependency on `@bubbles/markdown-editor`.

**Capabilities revealed:** `<MdxRenderer>` standalone consumption, `components` prop registry, default block components (`MarkdownAlerts`, `MarkdownCodeBlock`, `MarkdownChecklist`, `MarkdownImage`, `MarkdownEmbed`, `MarkdownToggle`, `MarkdownLink`), renderer CSS, editor/renderer separation.

---

### Journey Requirements Summary

| Capability | Revealed By |
|---|---|
| `renderForm` render prop + typed props | Journeys 1, 2 |
| Plugin subset configuration API | Journeys 1, 2 |
| `imageUploader` prop (service-agnostic) | Journey 1 |
| `onSuccess` callback (no internal routing) | Journey 1 |
| Auto title/slug derivation + `generateSlug` | Journey 3 |
| Draft autosave (localStorage, per-mode keys) | Journeys 1, 3 |
| Live split-pane MDX preview | Journeys 1, 3 |
| Automatic block component rendering (default blocks, no shortcodes) | Journey 3 |
| Custom component shortcode mechanism (situational, custom-example-components only) | — |
| EditorJS → MDX serializer | Journeys 1, 3 |
| `<MdxRenderer>` standalone (no editor dep) | Journey 4 |
| `components` override prop | Journey 4 |
| Default block components (`Markdown*` naming convention) | Journey 4 |
| Renderer CSS independent of editor CSS | Journey 4 |

---

## Developer Tool Specific Requirements

### Monorepo Integration

Two internal packages consumed exclusively within bubbles-verse. No npm publish. Bun workspaces with `workspace:*` protocol. Turborepo build pipeline — added to `turbo.json` like existing packages. TypeScript strict, no `any`, extends `@bubbles/typescript-config`. ESLint extends `@bubbles/eslint-config`. Each package ships `README.md`, `CHANGELOG.md`, and `documentation/` as needed.

### Public API Surface

#### `@bubbles/markdown-editor`

```ts
// Primary component
<MarkdownEditor
  imageUploader: (file: File) => Promise<{ success: 1; file: { url: string } }>
  onSuccess: (data: unknown) => void
  renderForm?: (props: EditorRenderFormProps) => ReactNode
  initialData?: TopicEditorDraft
  isEditMode?: boolean
  plugins?: PluginKey[]          // subset of available plugins; defaults to all 15
  allowedComponents?: string[]   // extends DEFAULT_ALLOWED_MDX_COMPONENTS; apps add, never remove
/>

// Default form — exported separately, optional
<EditorForm />

// Utilities — exported, tree-shakeable
generateSlug(text: string): string
DEFAULT_ALLOWED_MDX_COMPONENTS: Set<string>
serializeToMdx(blocks: OutputData, options?: { headingAnchorIdsByBlockId?: Record<string, string> }): string
```

**Internal only (not exported):** `useScrollSync`, `useDraftAutosave`, `usePreviewScroll`

#### `@bubbles/markdown-renderer`

```ts
// Primary component
<MdxRenderer
  content: string                              // stored MDX string
  components?: Record<string, ComponentType>  // extends/overrides default Markdown* components
/>

// Default block components — exported individually and as a map
MarkdownAlerts
MarkdownCodeBlock    // Shiki CSS Variables Mode, Catppuccin Latte/Mocha dual-theme
MarkdownChecklist
MarkdownImage
MarkdownEmbed        // YouTube, iframe
MarkdownToggle       // collapsible
MarkdownLink
```

### CSS Imports

App-level, import only what's needed:

```ts
import '@bubbles/markdown-editor/styles/editor';
import '@bubbles/markdown-editor/styles/preview';
import '@bubbles/markdown-renderer/styles/renderer';
```

### CSS & Theming

All package stylesheets reference only CSS custom properties from `@bubbles/ui/globals.css` — no hardcoded colors. `renderer.css` defines the `--sh-*` syntax token variables and `--code-bg`, extracted from `apps/the-coding-vault/app/globals.css`. `MarkdownCodeBlock` uses Shiki in CSS Variables Mode; light/dark switching works via the existing `.dark` class.

| Variable | Light (`--ctp-latte-*`) | Dark (`--ctp-mocha-*`) |
|---|---|---|
| `--sh-class` | yellow | yellow |
| `--sh-identifier` | red | red |
| `--sh-sign` | mauve | mauve |
| `--sh-property` | peach | peach |
| `--sh-entity` | blue | blue |
| `--sh-string` | green | green |
| `--sh-keyword` | mauve | mauve |
| `--sh-number` | peach | peach |
| `--sh-comment` | subtext-0 | subtext-0 |
| `--code-bg` | base | base |

### Security Model

`DEFAULT_ALLOWED_MDX_COMPONENTS` is the security boundary for inline component shortcodes. Apps extend it via `allowedComponents` — merged as `new Set([...DEFAULT_ALLOWED_MDX_COMPONENTS, ...allowedComponents])`. Apps can only add to the set, never remove. `escapeMdxBraces()` is applied to all user-authored text before serialization. Shortcode props are JSON-validated before insertion; malformed strings are rejected.

### Migration

The embedded EditorJS implementation in `apps/the-coding-vault` is replaced entirely: `@bubbles/markdown-editor` moves to the Dashboard (write surface); `@bubbles/markdown-renderer` stays in the Vault (read surface). The `--sh-*` and `--code-bg` variables are removed from `apps/the-coding-vault/app/globals.css` after extraction into `renderer.css`. No data migration required — the Vault has no production content.

---

## Project Scoping & Risk

### Approach

Complete extraction — the package ships fully featured from day one. No phased feature rollout. The implementation exists and is proven; packaging is the only remaining work. The package is fully DB-agnostic: it receives content via `initialData` and returns it via `onSuccess`. The consuming app handles persistence — Supabase, Drizzle/PostgreSQL, or anything else.

### Risk Mitigation

**EditorJS Plugin Ecosystem:** 15 plugins from multiple authors — a core EditorJS update can break several simultaneously. All plugin versions are pinned at the package level. Consuming apps declare no plugin dependencies directly; updates propagate automatically.

**React StrictMode Double-Mount:** The `cleanupHasRunOnceRef` pattern in portal-ref solves React 18's double-invoke issue. Must be extracted verbatim — not reimplemented.

---

## Functional Requirements

### Content Authoring

- **FR1:** A developer can initialize `<MarkdownEditor>` with a configurable subset of block type plugins
- **FR2:** A developer can provide a custom metadata form via the `renderForm` render prop, receiving full editor state as typed props
- **FR3:** A developer can use the default `<EditorForm>` without providing a custom form
- **FR4:** A developer can configure a service-agnostic image upload handler via the `imageUploader` prop
- **FR5:** A developer can define post-submit behavior via the `onSuccess` callback — the package never handles navigation internally
- **FR6:** A developer can initialize the editor in edit mode with existing content via `initialData` and `isEditMode`
- **FR7:** A developer can extend the MDX component allowlist with app-specific component names via `allowedComponents` — the default allowlist cannot be reduced

### Draft & Session Management

- **FR8:** The editor automatically saves draft content to localStorage during authoring
- **FR9:** The editor maintains separate localStorage keys for create mode and edit mode drafts
- **FR10:** Draft content is restored on page load if a draft exists for the current mode
- **FR11:** Draft saving is disabled after a successful submit to prevent stale draft restoration
- **FR12:** The editor supports import of existing Markdown content via an import modal

### Metadata & Slug

- **FR13:** The editor automatically derives the entry title from the first H1 block in the editor content
- **FR14:** The editor automatically generates a URL slug from the derived title
- **FR15:** A content author can manually override the auto-generated slug; after manual edit the slug is no longer auto-updated
- **FR16:** The `generateSlug` utility is available as a standalone export for use outside the editor component

### Live Preview & Scroll Sync

- **FR17:** The editor renders a live split-pane MDX preview that updates as content is authored
- **FR18:** Scrolling in the editor pane scrolls the preview pane to the corresponding block, and vice versa
- **FR19:** Every rendered block in the preview is addressable by block ID for scroll targeting

### Content Serialization

- **FR20:** The editor serializes EditorJS block output to a valid MDX string covering all 15 supported block types
- **FR21:** The serializer escapes MDX brace expressions in user content to prevent JSX injection
- **FR22:** The serializer validates inline component shortcodes against an allowlist before including them in MDX output
- **FR23:** The serializer sanitizes HTML artifacts in block content (e.g. `<br>` → `<br />`)
- **FR24:** The serializer optionally generates heading anchor IDs for TOC use cases, keyed by block ID
- **FR25:** The serializer is available as a standalone tree-shakeable export

### Content Rendering

- **FR26:** A developer can render stored MDX content via `<MdxRenderer>` without any dependency on `@bubbles/markdown-editor`
- **FR27:** A developer can override or extend any default block component via the `components` prop map
- **FR28:** The renderer provides default implementations for all standard block types: alerts, code blocks, checklists, images, embeds, collapsible toggles, links
- **FR29:** `MarkdownCodeBlock` renders syntax-highlighted code using Catppuccin Latte (light) and Catppuccin Mocha (dark) themes via Shiki CSS Variables Mode

### Theming & Styling

- **FR30:** Editor, preview, and renderer styles are available as separate importable CSS files
- **FR31:** All package styles reference only CSS custom properties from `@bubbles/ui/globals.css` — no hardcoded colors
- **FR32:** Syntax highlighting token colors adapt automatically to light/dark mode via the `.dark` class
- **FR33:** The `--sh-*` syntax token variables and `--code-bg` are defined in `renderer.css` and removed from `apps/the-coding-vault/app/globals.css`

### Security

- **FR34:** The package maintains a `DEFAULT_ALLOWED_MDX_COMPONENTS` set that defines the boundary for valid inline component shortcodes
- **FR35:** Apps can only extend `DEFAULT_ALLOWED_MDX_COMPONENTS`, never reduce it
- **FR36:** Shortcode props are JSON-validated before insertion into MDX output

### Package & Integration

- **FR37:** Both packages are consumable via `workspace:*` Bun workspace protocol
- **FR38:** All exported utilities and components have full TypeScript type coverage with no `any`
- **FR39:** TypeScript declarations are provided for all EditorJS plugins that lack upstream types
- **FR40:** All EditorJS plugin versions are managed exclusively at the package level — consuming apps declare no plugin dependencies directly
- **FR41:** Each package ships a `README.md` with API surface documentation and an integration example

---

## Non-Functional Requirements

### Performance

- The live MDX preview updates within a perceptible response time as block content changes — no debounce delay that disrupts the authoring flow
- `<MdxRenderer>` compiles and renders MDX at runtime without blocking the page — compilation errors are caught and surfaced gracefully, not thrown
- EditorJS initializes without blocking the UI thread — initialization is deferred if needed

### Security

- No component name outside the merged allowlist can appear as a valid shortcode in serialized MDX output
- No raw brace expressions from user-authored text reach the MDX output — `escapeMdxBraces()` is applied to all text content before serialization
- Malformed or non-JSON shortcode prop strings are rejected at serialization time, not silently passed through

### Maintainability & Developer Experience

- Both packages export only what is explicitly part of the public API — no internal implementation details are accessible to consumers
- All public exports are fully typed with no `any` — TypeScript consumers get complete IntelliSense coverage including EditorJS plugin types
- CSS stylesheets are importable independently — a renderer-only consumer imports no editor toolbar CSS
- Plugin version updates require changes in exactly one place (the package) and propagate to all consumers without any consumer-side changes

### Testing

- The EditorJS → MDX serializer has unit test coverage for all 15 block type handlers
- Serializer security functions (`escapeMdxBraces`, allowlist enforcement, prop JSON validation) have dedicated unit test coverage including edge cases
- `generateSlug` has unit test coverage including special characters, unicode, and empty string inputs
- Tests run with Vitest, consistent with the monorepo test setup
