# Markdown Packages Capability Audit

Datum: 2026-04-16

Scope:
- `packages/markdown-editor`
- `packages/markdown-renderer`
- Referenzabgleich gegen `portal-ref`, `lms-ref`, `to-be-integrated`, `apps/the-coding-vault`

Method:
- local repo only
- code, tests, docs, and reference parity
- no implementation changes

## Read First

This audit splits the markdown packages into three buckets:

- `feature-complete`: the capability is implemented, documented, and covered by tests well enough that it behaves as intended in the current repo state.
- `partially complete`: the capability works, but the contract is still broader, thinner, or less aligned with the repo/reference standard than it should be.
- `still open`: the current code does not yet match the expected target behavior.

The key point from the repo state is that the markdown packages are already strong on the core runtime/editor flow. The remaining gaps are mostly around integration shape and standards, not the core content pipeline itself.

## Feature-Complete Already

| Capability | Status | Evidence | Match vs user observation |
| --- | --- | --- | --- |
| Editor shell | `feature-complete` | [packages/markdown-editor/src/components/markdown-editor.tsx](./packages/markdown-editor/src/components/markdown-editor.tsx:46), [packages/markdown-editor/tests/editor/markdown-editor.test.tsx](./packages/markdown-editor/tests/editor/markdown-editor.test.tsx:198), [packages/markdown-editor/src/types/editor.ts](./packages/markdown-editor/src/types/editor.ts:183) | Matches. The shell exists, mounts EditorJS, restores drafts, supports custom forms, and exposes the shared wrapper API. |
| Live preview | `feature-complete` | [packages/markdown-editor/src/components/preview-pane.tsx](./packages/markdown-editor/src/components/preview-pane.tsx:44), [packages/markdown-editor/tests/editor/preview-pane.test.tsx](./packages/markdown-editor/tests/editor/preview-pane.test.tsx:99) | Matches. Preview is compiled locally, keeps the last successful render mounted, and no longer relies on the old collapsing behavior. |
| Scroll sync | `feature-complete` | [packages/markdown-editor/src/hooks/use-scroll-sync.ts](./packages/markdown-editor/src/hooks/use-scroll-sync.ts:219), [packages/markdown-editor/tests/editor/use-scroll-sync.test.tsx](./packages/markdown-editor/tests/editor/use-scroll-sync.test.tsx:165) | Matches. Block-aware, bidirectional sync is implemented and tested. |
| Rendering editor-produced markdown | `feature-complete` | [packages/markdown-editor/src/lib/serialize-to-mdx.ts](./packages/markdown-editor/src/lib/serialize-to-mdx.ts:99), [packages/markdown-renderer/src/mdx-renderer.tsx](./packages/markdown-renderer/src/mdx-renderer.tsx:46), [packages/markdown-editor/tests/serializer/serialize-to-mdx.test.ts](./packages/markdown-editor/tests/serializer/serialize-to-mdx.test.ts:22) | Matches. The editor output is serialized and rendered through the shared MDX pipeline. |
| Markdown import (`.md`, `.mdx`, `.markdown`) | `feature-complete` | [packages/markdown-editor/src/components/import-markdown-modal.tsx](./packages/markdown-editor/src/components/import-markdown-modal.tsx:39), [packages/markdown-editor/src/lib/convert-markdown-to-editor-js.ts](./packages/markdown-editor/src/lib/convert-markdown-to-editor-js.ts:267), [packages/markdown-editor/tests/editor/markdown-editor.test.tsx](./packages/markdown-editor/tests/editor/markdown-editor.test.tsx:256) | Matches. File validation, drag/drop, replacement flow, warnings, and conversion are all present. |
| Tool subset handling | `feature-complete` | [packages/markdown-editor/src/lib/editor-tools.ts](./packages/markdown-editor/src/lib/editor-tools.ts:121), [packages/markdown-editor/src/lib/editor-tools.ts](./packages/markdown-editor/src/lib/editor-tools.ts:144), [packages/markdown-editor/tests/editor/markdown-editor.test.tsx](./packages/markdown-editor/tests/editor/markdown-editor.test.tsx:211) | Matches. `plugins` acts as an allowlist, preserves canonical order, and falls back to a safe default block. |
| Image rendering | `feature-complete` | [packages/markdown-renderer/src/components/markdown-image/markdown-image.tsx](./packages/markdown-renderer/src/components/markdown-image/markdown-image.tsx:43), [packages/markdown-renderer/src/components/markdown-image/markdown-preview-image.tsx](./packages/markdown-renderer/src/components/markdown-image/markdown-preview-image.tsx:16), [packages/markdown-renderer/__tests__/markdown-image.test.tsx](./packages/markdown-renderer/__tests__/markdown-image.test.tsx:22) | Matches. Cloudinary-backed and direct-URL images both render, and the preview-safe variant exists for client compilation. |
| Component registry behavior | `feature-complete` | [packages/markdown-renderer/src/default-components.tsx](./packages/markdown-renderer/src/default-components.tsx:47), [packages/markdown-renderer/src/default-components.tsx](./packages/markdown-renderer/src/default-components.tsx:119), [apps/the-coding-vault/mdx-components.tsx](./apps/the-coding-vault/mdx-components.tsx:19), [portal-ref/src/mdx-components.tsx](./portal-ref/src/mdx-components.tsx:19), [lms-ref/mdx-components.tsx](./lms-ref/mdx-components.tsx:23) | Matches. Package defaults, preview registry, and app-level overrides all exist. |

## Partially Complete

| Capability | Status | Evidence | Why partial |
| --- | --- | --- | --- |
| Slug helpers | `partially complete` | [packages/markdown-editor/src/lib/slug-utils.ts](./packages/markdown-editor/src/lib/slug-utils.ts:23), [packages/markdown-editor/tests/editor/generate-slug.test.ts](./packages/markdown-editor/tests/editor/generate-slug.test.ts:5), [packages/markdown-editor/src/components/editor-form.tsx](./packages/markdown-editor/src/components/editor-form.tsx:82) | The low-level slug normalization is solid, but the package does not yet provide a real app-strategy layer for paths like `YYYY/MM/DD/...` vs `main/sub/title`. |
| Default metadata form | `partially complete` | [packages/markdown-editor/src/components/editor-form.tsx](./packages/markdown-editor/src/components/editor-form.tsx:60), [packages/markdown-editor/tests/editor/editor-form-metadata.test.tsx](./packages/markdown-editor/tests/editor/editor-form-metadata.test.tsx:66), [portal-ref/src/components/lms/markdown-editor/editor/editor-form.tsx](./portal-ref/src/components/lms/markdown-editor/editor/editor-form.tsx:1), [apps/the-coding-vault/components/layout/admin/editor/editor-form.tsx](./apps/the-coding-vault/components/layout/admin/editor/editor-form.tsx:1) | The form works, but it is still `useState`-based in the package while the repo references use `react-hook-form`. This is functional, but not yet aligned with the repo standard you want. |
| Upload plumbing | `partially complete` | [packages/markdown-editor/src/types/editor.ts](./packages/markdown-editor/src/types/editor.ts:148), [packages/markdown-editor/src/lib/editor-tools.ts](./packages/markdown-editor/src/lib/editor-tools.ts:341), [apps/the-coding-vault/app/api/vault/image-upload/route.ts](./apps/the-coding-vault/app/api/vault/image-upload/route.ts:11) | The callback contract and tool wiring are there, but the shared package still does not own a reusable upload factory/route helper. Today the apps still carry the route logic. |

## Still Open

| Capability / concern | Status | Evidence | Why open |
| --- | --- | --- | --- |
| Catppuccin Shiki theme for code blocks | `still open` | [packages/markdown-renderer/src/components/markdown-code/markdown-code-block.tsx](./packages/markdown-renderer/src/components/markdown-code/markdown-code-block.tsx:31), [packages/markdown-renderer/src/styles/renderer.css](./packages/markdown-renderer/src/styles/renderer.css:2) | The CSS tokens are Catppuccin-aware, but the renderer still hardcodes `theme: 'one-dark-pro'`. That matches your observation: the styling system is prepared, the theme choice is not yet aligned. |
| RHF rewrite for the default metadata form | `still open` | [packages/markdown-editor/src/components/editor-form.tsx](./packages/markdown-editor/src/components/editor-form.tsx:60), [portal-ref/src/components/lms/markdown-editor/editor/editor-form.tsx](./portal-ref/src/components/lms/markdown-editor/editor/editor-form.tsx:1) | This is the concrete next step if the package is supposed to match repo conventions instead of merely functioning. |
| Shared Cloudinary route/helper factory | `still open` | [packages/markdown-editor/src/types/editor.ts](./packages/markdown-editor/src/types/editor.ts:155), [apps/the-coding-vault/app/api/vault/image-upload/route.ts](./apps/the-coding-vault/app/api/vault/image-upload/route.ts:11) | The repo still duplicates route ownership per app. The package can drive the upload callback, but not yet the route shape itself. |

## User Observations vs Code

- Your note that the editor shell, preview, scroll sync, markdown rendering, and markdown import are already working matches the current code/tests.
- Your note that `FormBeispiel` can be removed matches the package contract: the allowlist is empty and tests assert that legacy shortcodes are not expanded anymore.
- Your note that `mdx-components.tsx` should exist per app also matches the repo shape. `apps/the-coding-vault`, `portal-ref`, and `lms-ref` all maintain their own MDX registry layer.
- Your note about hugeicons is only partly mirrored in the markdown packages. The import surface uses Hugeicons in the editor modal, but the renderer components still use `lucide-react` where the reference implementations do.
- Your note about Catppuccin syntax highlighting is correct: the package has Catppuccin CSS variables, but the Shiki theme selection still needs to be switched from `one-dark-pro`.

## Bottom Line

If we freeze the repo state as-is, the following are already strong enough to call feature-complete:

- editor shell
- live preview
- scroll sync
- rendering editor-produced markdown
- markdown import
- tool subset handling
- image rendering
- component registry behavior

The following are real follow-up areas, not just polish:

- slug strategy beyond low-level slug normalization
- default metadata form alignment with `react-hook-form`
- upload plumbing centralization
- Shiki/Catppuccin theme alignment

That is the current local truth, based on code, tests, docs, and the reference parity visible in the repo.
