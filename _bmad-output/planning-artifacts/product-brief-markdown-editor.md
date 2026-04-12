---
title: "Product Brief: @bubbles/markdown-editor & @bubbles/markdown-renderer"
status: complete
created: 2026-04-11
updated: 2026-04-12
inputs:
  - _bmad-output/planning-artifacts/product-brief-bubbles-verse.md
  - _bmad-output/planning-artifacts/product-brief-coding-vault-distillate.md
  - docs/architecture-the-coding-vault.md
  - to-be-integrated/md-editor/ (code analysis)
  - to-be-integrated/lms-mdrender/ (code analysis)
---

# Product Brief: @bubbles/markdown-editor & @bubbles/markdown-renderer

## Executive Summary

Every rich-text editing feature in bubbles-verse needs the same EditorJS infrastructure: a configurable block-based editor, an EditorJS-to-MDX serializer, and a safe MDX renderer. Today that infrastructure is embedded in The Coding Vault — hand-adapted from a more mature company reference project, and silently blocking the Dashboard from being built.

This brief proposes extracting that infrastructure into two purpose-built packages: `@bubbles/markdown-editor`, a full authoring suite (EditorJS wrapper, metadata form, live MDX preview, draft autosave), and `@bubbles/markdown-renderer`, a standalone renderer for public-facing content pages. Once extracted, every current and future app in bubbles-verse can write and display rich content without duplicating a single line of editor logic.

The Dashboard depends on this. So does the Portfolio. So, eventually, does the blog.

---

## The Problem

The EditorJS stack — 15+ plugins, a block-to-MDX serializer, a live preview, and a set of custom MDX rendering components — currently lives inside The Coding Vault. It works, but:

**Duplication is already compounding.** A more mature version of the same editor exists in a company reference project. Adapting that work into the Vault means manual copying. Doing it again for the Dashboard means copying twice. Doing it for Portfolio and the blog means doing it four times — and maintaining four diverging implementations forever.

**The Dashboard is blocked.** Phase 2 of the Dashboard requires moving Vault admin screens (content creation, editing) into the central admin app. Without a shared editor package, this cannot happen without copy-paste engineering that immediately creates a maintenance liability.

**Future apps inherit the problem by default.** Every new content-heavy app that has to reinvent the editor stack adds plugin version drift, diverging serializer logic, and upgrade debt across the monorepo. The status quo isn't neutral — it's compounding.

---

## The Solution

Extract the EditorJS stack into two packages with clear, separate responsibilities:

### `@bubbles/markdown-editor`

A complete content authoring suite. Includes EditorJS initialized with 15 block types, a metadata form (title, description, tags, publication status, slug utility), live split-pane MDX preview, draft autosave to localStorage, bidirectional scroll sync, an import-from-Markdown modal, and the EditorJS-to-MDX serializer with component allowlisting and MDX injection protection.

This is the **write surface** — used wherever content is created or edited (Dashboard Vault admin, future blog editor).

### `@bubbles/markdown-renderer`

A standalone MDX rendering engine for public-facing content. Includes `@mdx-js/mdx`-based compilation, a default set of custom block components (alerts, code blocks with Shiki, checklists, images, embeds, collapsible toggles, links), and a component registry that apps can extend or override per-app.

This is the **read surface** — used wherever stored MDX content is displayed (Vault entry pages, Portfolio project pages, blog posts).

---

## Technical Approach

- **Block types (v1):** Header, List (ordered / unordered / checklist), Code, Quote, Alert, Delimiter, Toggle, Table, Embed, Image, Inline Code, Strikethrough, Annotation, Inline Hotkey — all available, but **configurable per app**. Apps declare which plugins they activate; unused plugins are not loaded. Full set ships as default.
- **Public API surface:**
  - `<MarkdownEditor>` accepts a `renderForm` render prop — apps inject their own metadata form, receiving editor state via typed props (`editorOutput`, `editorContent`, `editorReady`, `isEditMode`, `initialData`). A default `<EditorForm>` is exported for apps that don't need customization.
  - Image upload is configurable via `imageUploader: (file: File) => Promise<UploadResult>` prop — no hardcoded endpoint or HTTP client.
  - Post-submit navigation is the app's responsibility via `onSuccess: (data) => void` callback — the package never touches routing.
- **Routing:** This monorepo uses Next.js only. No TanStack Router. Any future non-Next.js app that needs routing integration will handle it at the app level via the `onSuccess` callback — no router library is a dependency of this package.
- **Status model:** `published` / `unpublished` only — no versioning, no changelog workflow
- **Slug handling:** `generateSlug(text)` utility exported from `@bubbles/markdown-editor`; path depth and routing structure are entirely the consuming app's responsibility
- **Image uploads:** Configurable via props (upload endpoint / handler function); no hardcoded service or Cloudinary dependency
- **MDX components:** Default implementations shipped with `@bubbles/markdown-renderer`; apps pass a `components` override map to customize, extend, or replace individual components
- **CSS strategy:** Each package ships its own stylesheets — `editor.css` and `preview.css` in `@bubbles/markdown-editor`, `renderer.css` in `@bubbles/markdown-renderer`. Styles live in the package, not in `@bubbles/ui/src/styles/` (which would invert the dependency hierarchy). All CSS uses only the custom properties already defined by `@bubbles/ui/globals.css` (`--primary`, `--background`, `--border`, `--muted`, `--ctp-mocha-*`, `--ctp-latte-*`, etc.) — no hardcoded colors, full Catppuccin theme integration without a hard import dependency. Apps import only what they use (`@bubbles/markdown-editor/styles/editor`, `@bubbles/markdown-renderer/styles/renderer`). EditorJS-specific and preview styles are separate files so renderer-only consumers don't load editor toolbar CSS.
- **TypeScript:** Full type coverage including plugin declarations; no `any`
- **Plugin ecosystem risk:** 15 plugins from different authors; EditorJS core updates can break multiple simultaneously. Version pins are managed at the package level — consuming apps do not manage plugin versions directly.
- **Shared types:** Defined within each package; no premature `@bubbles/shared-types` — extracted only if genuine cross-package need emerges

---

## Who This Serves

**The Dashboard** is the primary consumer and the immediate blocker. Vault admin screens (create / edit entries) move here in Phase 2. Without `@bubbles/markdown-editor`, Phase 2 cannot begin.

**The Coding Vault** replaces its current embedded editor with the package, eliminating the copy — and gains the more mature implementation from the reference project for free. Public entry pages consume `@bubbles/markdown-renderer`.

**Portfolio & Blog (future)** inherit a working content stack without building from scratch. The blog will likely use both packages; Portfolio may need only the renderer.

**Manuel (sole developer)** gets a single maintenance point for the entire editor stack. Fix a serializer edge case, update a plugin version, or refine a default component once — all consuming apps benefit. Critically, The Coding Vault also gets a **free upgrade**: the reference project's implementation is more mature (better scroll sync, richer UX, polished draft handling) and becomes the extraction baseline.

---

## Success Criteria

- `@bubbles/markdown-editor` is consumed by at least two apps without any copy-paste of editor code
- Dashboard Phase 2 can begin with no remaining editor infrastructure work
- The Coding Vault's embedded editor is fully replaced by the package
- Apps can override individual MDX components without touching the package source
- Serializer utilities and `generateSlug` are usable standalone (tree-shakeable)
- No EditorJS plugin versions diverge between consuming apps

---

## Scope

**In for v1:**
- EditorJS wrapper with all 15 current block types
- Metadata form: title, description, tags, status (`published` / `unpublished`)
- Slug utility (`generateSlug`)
- EditorJS → MDX serializer with MDX component allowlisting and brace escaping
- Live split-pane MDX preview
- Draft autosave (localStorage)
- Bidirectional scroll sync
- Import-from-Markdown modal
- Default MDX block components (full set from reference project)
- Editor and renderer CSS stylesheets
- TypeScript plugin declarations for all EditorJS plugins
- Package-level README with API surface documentation and integration example
- Unit tests for EditorJS → MDX serializer (conversion logic is complex and high-value to test)

**Out for v1:**
- Versioning / changelog workflow
- Status model beyond `published` / `unpublished`
- `@bubbles/shared-types` package (revisit if need becomes concrete)
- App-specific MDX components (remain per-app)
- Cloudinary as a bundled dependency
- FontAwesome → Lucide icon migration (kept as-is; flagged for v2 cleanup)
- Multi-tab draft conflict resolution

---

## Roadmap Thinking

Once both packages are stable and consumed by two apps, the natural next steps emerge: Lucide icon migration (replacing FontAwesome for consistency with the rest of the monorepo), a `@bubbles/shared-types` split if cross-package domain types accumulate, and potentially richer image handling (Cloudinary opt-in, lazy loading, blur placeholders as a configurable feature). The packages are not designed to anticipate this future — only to not prevent it.
