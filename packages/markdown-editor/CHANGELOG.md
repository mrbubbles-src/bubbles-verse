# Changelog — @bubbles/markdown-editor

## 0.0.0 — 2026-04-12

- Initial package scaffold.
- Add the standalone `serializeToMdx()` export for core EditorJS block handling.
- Add the shared `MarkdownEditor` wrapper with the reference EditorJS tool
  configuration, plugin subsetting, and StrictMode-safe cleanup guard.
- Add the optional `headingAnchorIdsByBlockId` serializer option so heading
  wrapper elements can expose stable anchor ids for TOC hash navigation.
- Extract the reference serializer security helpers into
  `src/serializer/security.ts` and cover brace escaping, inline shortcode
  allowlisting, malformed prop fallback, and final `<br />` sanitization with
  regression tests.
- Move serializer regression coverage into `tests/serializer/` with reusable
  block fixtures and per-handler parity assertions.
- Add package-local editor wrapper tests that cover default tools, plugin
  subsets, the shared change bridge, and cleanup guard behavior.
- Add the Story 4.2 form surface: `renderForm`, exported `EditorForm`,
  edit-mode-aware `initialData`, and `onSuccess` submit payloads with serialized
  MDX output.
- Add internal title/slug helpers plus jsdom/RTL coverage for custom form
  props, default form fallback, and submit serialization behavior.
- Align Story 4.3 metadata derivation with the `to-be-integrated` reference:
  H1-driven title updates, session-scoped manual slug override preservation,
  and the public `generateSlug()` export with regression coverage.
- Add Story 4.4 draft autosave/restore parity with `to-be-integrated`,
  including mode-specific localStorage keys, mount-time draft restoration,
  and post-submit draft clearing for the shared package form surface.
- Add Story 4.5 live split-pane preview parity with `to-be-integrated`,
  including runtime MDX preview rendering, block-aware bidirectional
  scroll sync, preview stylesheet updates, and regression coverage.
- Add Story 4.6 portal-ref import parity, including the file-based markdown
  import modal, markdown-to-EditorJS conversion, shared editor styling, and
  import regression coverage.
- Rework the split-pane preview to follow the reference-style local MDX compile
  flow, keeping the last successful preview mounted during recompilation and
  driving scroll re-sync from a stable compiled version to prevent editor jump
  regressions during block insertion.
- Remove the legacy `FormBeispiel` shortcode from the shared serializer
  allowlist and align the package tests and review notes with that explicit
  removal.
- Replace the old cleanup-skip heuristic with explicit EditorJS teardown/re-init
  sequencing for real config changes, and reset `EditorForm` state explicitly
  when a new `initialData` session is loaded.
- Stop replaying the initial document into a freshly mounted EditorJS instance,
  avoiding browser-side DOM removal errors during reference app mounts while
  still re-rendering when `initialData` changes later.
- Switch the live preview to a client-safe MDX component registry so inserted
  markdown images no longer trip async server-component errors inside the
  editor pane.
- Move the default metadata form onto `react-hook-form`, add optional
  path-aware `slugStrategy` support, and keep the shared metadata surface
  package-level.
- Align the default metadata form with shadcn/ui's current `Field`
  composition model, remove the local effect-driven title state, and include
  the package test directories in TypeScript project checking so editor/test
  warnings surface correctly inside the workspace.
- Add path-aware slug helpers plus a package-owned Cloudinary upload route
  factory for Next route handlers so apps can reuse the shared upload plumbing.
- Add a lower-level `uploadCloudinaryImage` helper so apps can keep their
  Next route thin and pass the target Cloudinary folder per editor instance.
- Add a shared `createEditorImageUploader()` helper and a lower-level
  `cloudinary-upload` server module so apps can keep one thin upload route per
  app while passing `imageFolder` per editor instance.
- Normalize Blob-based image uploads into explicit `File` objects before the
  shared client helper posts them, keeping EditorJS clipboard/drag uploads
  aligned with the same multipart contract as file-picker uploads.
- Replace the shared Cloudinary SDK stream upload with the signed Upload API
  `fetch` path so Bun-based app runs no longer misclassify some valid image
  files as unsigned uploads.
- Add package-local documentation that records the image-upload debugging
  findings, the Bun/Cloudinary SDK pitfall, and the final shared route/helper
  architecture.
- Expand the package README with concrete slug-strategy patterns plus explicit
  guidance for when the shared `EditorForm` is sufficient and when apps should
  switch to `renderForm`.
