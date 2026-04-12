# Changelog — @bubbles/markdown-editor

## 0.0.0 — 2026-04-12

- Initial package scaffold.
- Add the standalone `serializeToMdx()` export for core EditorJS block handling.
- Extract the reference serializer security helpers into
  `src/serializer/security.ts` and cover brace escaping, inline shortcode
  allowlisting, malformed prop fallback, and final `<br />` sanitization with
  regression tests.
