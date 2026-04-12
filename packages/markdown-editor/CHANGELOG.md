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
