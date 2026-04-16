# Changelog — @bubbles/markdown-renderer

## 0.0.0 — 2026-04-12

- Initial package scaffold.
- Port default `Markdown*` MDX block components and `defaultComponents`.
- Add runtime `<MdxRenderer>` with package defaults, component overrides, and
  local compilation error handling.
- Add standalone `renderer.css` with renderer-scoped Shiki token variables and
  inline-code styling.
- Restore direct-url fallback support in `MarkdownImage`, fix blur placeholder
  MIME handling, and restrict external markdown links to safe protocols only.
- Add `previewComponents` so client-side MDX preview flows can render markdown
  images without hitting async server-component restrictions.
- Align `MarkdownCodeBlock` with the repo Catppuccin Shiki themes by using
  `catppuccin-latte` for light mode and `catppuccin-mocha` for dark mode.
