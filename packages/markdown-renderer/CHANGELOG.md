# Changelog — @bubbles/markdown-renderer

All notable changes to `@bubbles/markdown-renderer` are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

- Render the `MarkdownCodeBlock` copy action as a direct button trigger instead
  of an outer wrapper span, avoiding intermittent browser `removeChild` errors
  in client-rendered edit previews with many code blocks.
- Add visible line numbers to `MarkdownCodeBlock` while preserving Shiki token
  markup and the repo-standard Catppuccin light/dark themes.

## [1.0.0] - 2026-04-17

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
- Switch runtime `<MdxRenderer>` defaults to the same client-safe preview
  registry so saved MDX strings no longer trip async `MarkdownImage` errors in
  client-rendered preview routes.
- Align `MarkdownCodeBlock` with the repo Catppuccin Shiki themes by using
  `catppuccin-latte` for light mode and `catppuccin-mocha` for dark mode.
