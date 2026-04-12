---
title: "Product Brief Distillate: @bubbles/markdown-editor & @bubbles/markdown-renderer"
type: llm-distillate
source: "product-brief-markdown-editor.md"
created: 2026-04-12
purpose: "Token-efficient context for downstream PRD creation"
---

# Distillate: @bubbles/markdown-editor & @bubbles/markdown-renderer

## Core Intent

Extract the EditorJS stack from `portal-ref` (editor + preview) and `lms-ref` (renderer) into two monorepo packages for bubbles-verse. Code is **already working** in both ref projects — this is extraction + cleanup, not a greenfield build. The more mature `portal-ref` version is the extraction baseline.

---

## Package Structure

### `@bubbles/markdown-editor`
- EditorJS wrapper + all 15 block types + live MDX preview — kept together (preview is tightly coupled to editor, not standalone)
- Default `<EditorForm>` exported but optional via `renderForm` render prop
- Apps inject their own form with full editor state access

### `@bubbles/markdown-renderer`
- Standalone MDX compiler + default block components — used for public-facing content display
- No editor dependency — blog post pages, vault entries, portfolio projects import only this

### No `@bubbles/shared-types`
- Rejected: becomes a maintenance dumping ground. Types live in the package that owns them. Revisit only if concrete cross-package domain types accumulate.

---

## Public API Contract

### `<MarkdownEditor>` props
```ts
imageUploader: (file: File) => Promise<{ success: 1; file: { url: string; ... } }>
onSuccess: (data: unknown) => void   // app handles navigation after submit
renderForm?: (props: EditorRenderFormProps) => ReactNode  // optional custom form
initialData?: TopicEditorDraft       // edit mode
isEditMode?: boolean
```
- `renderForm` receives: `editorOutput`, `editorContent`, `editorReady`, `isEditMode`, `initialData`
- No router dependency — never touches routing. `onSuccess` callback only.
- No `apiClient` dependency — image uploader is a prop, not a hardcoded endpoint

### `<EditorForm>` (default form, exported separately)
Fields kept from ref: `title` (auto from H1), `slug` (auto from title, manually overridable), `description`, `tags`, `status` (`published` | `unpublished`)

Fields **removed** vs ref (LMS-specific, not for this package):
- `level` / `difficulty` — LMS concept
- `duration` — LMS concept
- `order` — LMS sorting
- `versionBump`, `reasonType`, `reasonText`, `ticketId` — versioning/changelog workflow (explicitly out of scope)
- `published` boolean (replaced by `status: 'published' | 'unpublished'`)

### `<MdxRenderer>` props
```ts
components?: Record<string, ComponentType>  // override/extend default MDX components
```

---

## Block Types & Serializer

### All 15 block types (v1)
`header`, `list` (ordered/unordered/checklist), `code`, `quote`, `alert`, `delimiter`, `toggle`, `table`, `embed`, `image`, `inlineCode`, `strikethrough`, `annotation`, `InlineHotkey`, `paragraph`

### Serializer: merge required
`portal-ref` and `lms-ref` have **diverging serializer implementations** — must be merged:
- `portal-ref` has: all block handlers including `inlineCode`, `strikethrough`, `annotation`, `InlineHotkey`
- `lms-ref` has: `headingAnchorIdsByBlockId` option for TOC hash-link generation (useful for renderer)
- Final v1 serializer = all block handlers from `portal-ref` + `headingAnchorIdsByBlockId` option from `lms-ref`

### Serializer safety patterns (must be preserved)
- `escapeMdxBraces()` — prevents JSX injection from user content
- `ALLOWED_MDX_COMPONENTS` Set — allowlist for inline shortcodes (`[[ComponentName]]` or `<ComponentName />`)
- JSON.parse validation for shortcode props before insertion
- `<br>` → `<br />` sanitization pass at end
- `normalizeAlertMessage()` — strips EditorJS HTML artifacts from alert blocks

### Scroll targeting
Every block wrapped: `<div data-block-id="{blockId}">` — required for bidirectional scroll sync between editor and preview panes.

---

## EditorJS Dependencies (npm)

```
@editorjs/editorjs
@editorjs/header
@editorjs/list
@editorjs/image
@editorjs/embed
@editorjs/quote
@editorjs/table
@editorjs/inline-code
@calumk/editorjs-codecup          # code block with language selector
@coolbytes/editorjs-delimiter
@sotaproject/strikethrough
editorjs-alert
editorjs-annotation
editorjs-inline-hotkey
editorjs-toggle-block
```

TypeScript declarations for all plugins are custom `.d.ts` files (upstream types are incomplete/missing). These ship with the package.

### Plugin bundling
All 15 bundled by default. App passes a `plugins` config to activate a subset — unused plugins not loaded. Exact API shape TBD during implementation (enum-based `PluginKey[]` recommended by Winston for contract clarity).

### Code block languages (codecup config)
`bash`, `shell`, `powershell`, `git`, `markup`, `html`, `css`, `sass`, `scss`, `javascript`, `typescript`, `jsx`, `tsx`, `json`, `mongodb`, `sql`, `docker`, `python`, `regex`, `lua`, `none` (plain text)

---

## MDX Renderer Dependencies (npm)

```
@mdx-js/mdx          # runtime MDX compilation (evaluate())
remark-gfm
unified
shiki                # syntax highlighting in ModulesCodeBlock
```

### Default MDX components (ship with `@bubbles/markdown-renderer`)
`ModulesAlerts` (info/success/warning/danger), `ModulesCodeBlock` (Shiki, one-dark-pro theme), `ModulesChecklist`, `ModulesImage`, `ModulesEmbed` (YouTube), `ModulesDetailsToggle` (collapsible), `ModulesLink`

Custom example component: `FormBeispiel` — stays as example/reference, not in default export

Apps override via `components` prop map — no package modification needed.

### MDX security note
`evaluate()` runs at runtime. Allowlist (`ALLOWED_MDX_COMPONENTS`) is the security boundary. Keep it tight. JSON prop validation prevents injection via shortcode props.

---

## React Integration

### StrictMode cleanup (already solved)
`cleanupHasRunOnceRef` pattern is in `portal-ref/editor.tsx:175`. Skip first cleanup call due to React 18 StrictMode double-mount. Must be preserved exactly as-is in extracted package.

### Autosave
localStorage-based. Two separate draft keys: create mode draft, edit mode draft. `draftDisabledRef` prevents saving after successful submit. No conflict resolution for multi-tab (explicitly out of scope v1).

### Scroll sync
Bidirectional editor ↔ preview. Relies on stable `data-block-id` attributes. Uses `useScrollSync`, `useDraftAutosave`, `usePreviewScroll` hooks — all ship with the package.

### Title/slug derivation
`getHeaderLevelOneTitle(content)` — reads first H1 block from EditorJS output. `slugify(title)` — auto-generates slug, user can manually override. `slugManuallyEdited` flag prevents auto-overwrite after manual edit.

---

## CSS Strategy

### File layout
```
packages/markdown-editor/src/styles/
├── editor.css     # EditorJS toolbar, block styles, split-pane layout
└── preview.css    # Preview pane, scroll-sync wrapper

packages/markdown-renderer/src/styles/
└── renderer.css   # MDX rendered content typography and block styles
```

### Theming approach
- All CSS uses only custom properties from `@bubbles/ui/globals.css`: `--primary`, `--background`, `--foreground`, `--border`, `--muted`, `--card`, `--ctp-mocha-*`, `--ctp-latte-*`
- No hardcoded colors — full Catppuccin Latte/Mocha integration automatically
- No import of `@bubbles/ui` as a CSS dependency — just references shared CSS vars (requires app to load `@bubbles/ui/globals.css` first, which all apps already do)
- CSS lives in the package, NOT in `@bubbles/ui/src/styles/` (would invert dependency hierarchy)

### App import pattern
```ts
import '@bubbles/markdown-editor/styles/editor';
import '@bubbles/markdown-editor/styles/preview';
import '@bubbles/markdown-renderer/styles/renderer';
```

---

## What Gets Stripped During Extraction

Items present in ref projects that do NOT go into the package:

| Removed | Reason |
|---------|--------|
| `@tanstack/react-router` + `router.navigate()` | monorepo uses Next.js only; navigation via `onSuccess` callback |
| `apiClient` (axios instance) | replaced by `imageUploader` prop |
| `useAuth()` / PDL role logic | app concern |
| `TicketReferencePanel` + ticket hooks | LMS-specific feature |
| `TopicHistoryCard` + versioning UI | explicitly out of scope |
| `level`, `duration`, `order` form fields | LMS-specific metadata |
| `versionBump`, `reasonType`, `reasonText`, `ticketId` | versioning/changelog workflow |
| Brand-specific strings ("novari-brand-text", etc.) | app-specific CSS classes |
| German hardcoded UI strings | acceptable for v1; i18n not in scope |
| `ArrowRight` from `lucide-react` | portal-ref used Lucide; monorepo uses HugeIcons |
| `@fortawesome/free-solid-svg-icons` (non-brand) | brand icons only; replace any UI icons with HugeIcons |

### Icons clarification
- `@fortawesome/free-brands-svg-icons` — **kept** (brand logos in icon-map, no alternative)
- `@fortawesome/free-solid-svg-icons` — **replace** with HugeIcons
- `lucide-react` — **remove** entirely (monorepo standard is HugeIcons)

---

## Testing Requirements

### Serializer unit tests (highest priority)
- All 15 block type handlers → expected MDX output
- `escapeMdxBraces` edge cases (nested braces, JSX-like content)
- `tryParseInlineComponent` allowlist enforcement (valid, blocked, malformed)
- Toggle block with nested children (recursive conversion)
- Table with/without headings
- `<br>` sanitization pass
- `headingAnchorIdsByBlockId` option

### Additional test coverage
- Autosave: create vs edit draft keys, `draftDisabledRef` prevents post-submit saves
- Scroll sync: DOM-based integration test (jsdom + `@testing-library/react`)
- `generateSlug`: special characters, unicode, empty string, collisions

### Framework
Vitest (consistent with monorepo). `@testing-library/react` + jsdom for component/hook tests.

---

## Monorepo Integration Notes

- Package names: `@bubbles/markdown-editor`, `@bubbles/markdown-renderer`
- Bun workspaces with `workspace:*` protocol
- Turborepo build pipeline — add to `turbo.json` like existing packages
- Internal consumption only — no npm publish
- TypeScript: strict, no `any`, extends `@bubbles/typescript-config`
- ESLint: extends `@bubbles/eslint-config`
- Each package needs own `CHANGELOG.md` and `README.md` (per monorepo docs policy)

---

## Open Questions

- Exact `plugins` config API shape — enum `PluginKey[]` vs string array vs object map (decision deferred to implementation)
- Shiki theme — currently `one-dark-pro`; may change to a Catppuccin variant once the design system settles
- `headingAnchorIdsByBlockId` — generated by the renderer or passed from the app? (TOC use case may be app-specific)
- `FormBeispiel` custom example component — keep as documented example or remove from package entirely?
