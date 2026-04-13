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
