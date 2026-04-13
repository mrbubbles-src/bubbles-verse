# Markdown Packages Reference Review

Date: 2026-04-13

## Scope

Technical review of:

- `packages/markdown-editor`
- `packages/markdown-renderer`

Compared against:

- `portal-ref`
- `lms-ref`
- `to-be-integrated`

Goal of this review:

- verify whether the shared-package extraction is technically sound
- identify deviations from the references
- identify bugs that already existed in the references
- document what should be fixed before relying on these packages long-term

This document focuses on technical correctness, runtime behavior, migration parity, and package suitability. It does not focus on style or code cleanliness.

## Verification Performed

Executed during review:

- `bun run --cwd packages/markdown-editor typecheck`
- `bun run --cwd packages/markdown-renderer typecheck`
- `bun run --cwd packages/markdown-renderer test`
- `bun run --cwd apps/the-coding-vault build`
- `bun run --cwd apps/the-coding-vault typecheck`

Observed issue:

- none of the package-local verification commands above indicated a blocking
  package test-environment failure at review update time

## General Conclusion

The extraction is not fundamentally broken. `packages/markdown-editor` is
generally a plausible shared extraction of the reference editor flow.

`packages/markdown-renderer` is more divergent. It is not a pure 1:1 port of
the reference rendering pipeline. It introduces architectural changes that can
be valid, but they also create technical risks and parity gaps.

There are also a few bugs that appear to have been inherited from the reference
repos rather than introduced here.

## Important Note About `FormBeispiel`

`FormBeispiel` originated as a legacy/test artifact in the reference repos.

The correct shared-package move is to remove it entirely rather than
re-establish it as supported shared functionality. Once removed from the
serializer allowlist, the previous renderer/serializer mismatch disappears and
the shared contract becomes explicit again.

## Findings

### 1. Legacy `FormBeispiel` mismatch should be resolved by removal, not restoration

Status:

- deviation from references
- resolved intentionally by removing legacy support from the shared contract

Files:

- [`packages/markdown-editor/src/serializer/security.ts`](/Users/mrbubbles/dev/bubbles-verse/packages/markdown-editor/src/serializer/security.ts)
- [`packages/markdown-renderer/src/default-components.tsx`](/Users/mrbubbles/dev/bubbles-verse/packages/markdown-renderer/src/default-components.tsx)

What happened:

- the serializer used to allow `[[FormBeispiel]]` and `<FormBeispiel />`
- the shared renderer no longer provided that component
- that created a real shared-package mismatch

Reference behavior:

- `portal-ref` registers `FormBeispiel`
- `lms-ref` registers `FormBeispiel`

Assessment:

- this was a real technical mismatch
- the correct fix is removal, not restoration
- legacy content should be cleaned or migrated rather than keeping the demo
  component alive in the shared packages

What should be addressed:

- remove it from serializer allowlists
- remove package-level tests that still treat it as supported
- update any legacy content expectations or migration notes

### 2. External links are not scheme-sanitized

Status:

- inherited technical issue
- exists in references too

Files:

- [`packages/markdown-renderer/src/components/markdown-link.tsx`](/Users/mrbubbles/dev/bubbles-verse/packages/markdown-renderer/src/components/markdown-link.tsx)

Reference counterparts:

- [`lms-ref/components/layout/modules/modules-components/modules-link.tsx`](/Users/mrbubbles/dev/bubbles-verse/lms-ref/components/layout/modules/modules-components/modules-link.tsx)
- [`portal-ref/src/components/lms/markdown-editor/md-preview/modules/modules-components/modules-link.tsx`](/Users/mrbubbles/dev/bubbles-verse/portal-ref/src/components/lms/markdown-editor/md-preview/modules/modules-components/modules-link.tsx)

What happens:

- non-internal, non-hash links are rendered as external anchors
- there is no allowlist for safe protocols
- `javascript:` or `data:` URLs can remain clickable

Assessment:

- real security issue
- not introduced by the monorepo extraction
- the shared package should not keep inheriting this behavior

What should be addressed:

- allow only safe schemes like `http:`, `https:`, `mailto:`, `tel:`
- reject or neutralize everything else

### 3. EditorJS cleanup guard can suppress real re-initialization

Status:

- inherited logic from references
- more dangerous in shared-package form

Files:

- [`packages/markdown-editor/src/components/markdown-editor.tsx`](/Users/mrbubbles/dev/bubbles-verse/packages/markdown-editor/src/components/markdown-editor.tsx)

Reference counterparts:

- [`portal-ref/src/components/lms/markdown-editor/editor/editor.tsx`](/Users/mrbubbles/dev/bubbles-verse/portal-ref/src/components/lms/markdown-editor/editor/editor.tsx)
- [`to-be-integrated/md-editor/markdown-editor/editor/editor.tsx`](/Users/mrbubbles/dev/bubbles-verse/to-be-integrated/md-editor/markdown-editor/editor/editor.tsx)

What happens:

- cleanup skips the first teardown unconditionally
- that logic is meant to avoid React StrictMode double-mount noise
- but in shared-package usage, prop changes like `plugins`, `readOnly`,
  `placeholder`, or `imageUploader` can require a real re-init
- the old instance can remain alive longer than intended

Assessment:

- this is not a new invention here; it is carried over
- in the reference app it was less exposed because the editor config was more
  fixed
- in the shared package it is more of a real risk because configurability is
  now part of the public surface

What should be addressed:

- make StrictMode protection explicit and safe
- ensure real dependency changes can destroy and recreate the editor instance

### 4. Shared renderer uses a different rendering architecture than `lms-ref`

Status:

- new architectural deviation
- not necessarily wrong, but not parity

Files:

- [`packages/markdown-renderer/src/mdx-renderer.tsx`](/Users/mrbubbles/dev/bubbles-verse/packages/markdown-renderer/src/mdx-renderer.tsx)
- [`packages/markdown-editor/src/components/preview-pane.tsx`](/Users/mrbubbles/dev/bubbles-verse/packages/markdown-editor/src/components/preview-pane.tsx)

Reference counterparts:

- `lms-ref` topic pages use server-side `MDXRemote`
- `portal-ref` preview compiles client-side for editor preview only

What happens:

- the shared `MdxRenderer` is a client component
- it compiles MDX after hydration with `evaluate()`
- this differs from the `lms-ref` public rendering model

Assessment:

- acceptable for editor preview usage
- weaker parity for server-rendered content
- can affect SSR expectations, SEO characteristics, and failure timing

What should be addressed:

- clarify intended usage of the shared renderer
- if it is meant for public SSR content too, align it more closely with the
  production reference rendering model

### 5. Image rendering is more restrictive than `portal-ref`

Status:

- deviation from references
- probably safe only under stronger data assumptions

Files:

- [`packages/markdown-renderer/src/components/markdown-image/markdown-image.tsx`](/Users/mrbubbles/dev/bubbles-verse/packages/markdown-renderer/src/components/markdown-image/markdown-image.tsx)
- [`packages/markdown-editor/src/lib/serialize-to-mdx.ts`](/Users/mrbubbles/dev/bubbles-verse/packages/markdown-editor/src/lib/serialize-to-mdx.ts)

Reference counterpart:

- [`portal-ref/src/components/lms/markdown-editor/md-preview/modules/modules-components/modules-image.tsx`](/Users/mrbubbles/dev/bubbles-verse/portal-ref/src/components/lms/markdown-editor/md-preview/modules/modules-components/modules-image.tsx)

What happens:

- the shared package is effectively Cloudinary-first
- `portal-ref` preview supports a direct `url` fallback when `public_id` is
  missing
- the shared renderer removed that fallback path

Assessment:

- if all image content is guaranteed to be Cloudinary-backed, this may be fine
- if not, image rendering can fail or degrade
- this is more of a reference mismatch than a pure bug

What should be addressed:

- decide whether non-Cloudinary image payloads must be supported
- if yes, restore fallback behavior

### 6. Blur placeholder data URL uses the wrong source type

Status:

- inherited bug from `lms-ref`

Files:

- [`packages/markdown-renderer/src/components/markdown-image/markdown-image.tsx`](/Users/mrbubbles/dev/bubbles-verse/packages/markdown-renderer/src/components/markdown-image/markdown-image.tsx)

Reference counterpart:

- `lms-ref` uses the same logic pattern

What happens:

- `response.type` is used to build the `data:` URL
- `response.type` is fetch response category, not MIME type
- resulting blur placeholder data URLs can be invalid

Assessment:

- real bug
- not unique to this repo

What should be addressed:

- read `Content-Type` from response headers

### 7. MDX attributes are interpolated without escaping quotes

Status:

- inherited serializer weakness

Files:

- [`packages/markdown-editor/src/lib/serialize-to-mdx.ts`](/Users/mrbubbles/dev/bubbles-verse/packages/markdown-editor/src/lib/serialize-to-mdx.ts)

Reference counterparts:

- `portal-ref` serializer
- `lms-ref` serializer

What happens:

- values such as `caption`, `embed`, `language`, and `url` are inserted into
  JSX-like strings
- embedded quotes can break MDX generation

Assessment:

- real correctness issue
- inherited from reference behavior

What should be addressed:

- escape attribute values before interpolation

### 8. GFM table serialization does not escape dangerous cell content

Status:

- inherited serializer weakness

Files:

- [`packages/markdown-editor/src/lib/serialize-to-mdx.ts`](/Users/mrbubbles/dev/bubbles-verse/packages/markdown-editor/src/lib/serialize-to-mdx.ts)

What happens:

- table cells are concatenated into Markdown rows directly
- `|`, newlines, and similar content can corrupt the table

Assessment:

- real data-shape bug
- also present in reference-style logic

What should be addressed:

- escape or normalize cell text before constructing GFM rows

### 9. `plugins` subset API is not fully robust

Status:

- new shared-package issue

Files:

- [`packages/markdown-editor/src/lib/editor-tools.ts`](/Users/mrbubbles/dev/bubbles-verse/packages/markdown-editor/src/lib/editor-tools.ts)

What happens:

- `resolveDefaultBlock()` falls back to the first active plugin when
  `paragraph` is absent
- some valid subsets can yield inline-only tools as `defaultBlock`
- that is not a valid block default for EditorJS

Assessment:

- this issue belongs to the new reusable package surface
- references did not expose this generalized subset model in the same way

What should be addressed:

- ensure `defaultBlock` resolves only to real block tools

### 10. Default `EditorForm` remount logic is weaker than the reference reset flow

Status:

- new shared-package simplification

Files:

- [`packages/markdown-editor/src/components/markdown-editor.tsx`](/Users/mrbubbles/dev/bubbles-verse/packages/markdown-editor/src/components/markdown-editor.tsx)

What happens:

- `EditorForm` remounting depends on a synthetic key
- the key is based on a small subset of values
- stale form state is possible when different drafts resolve to similar key data

Assessment:

- not obviously catastrophic
- weaker than the reference app form-reset behavior
- worth correcting because this package is meant to be reusable

What should be addressed:

- make form state reset explicit rather than relying on partial remount keys

### 11. Package test coverage cannot currently validate the editor package end-to-end

Status:

- new package verification problem

Files:

- [`packages/markdown-editor/tests/editor/markdown-editor-form.test.tsx`](/Users/mrbubbles/dev/bubbles-verse/packages/markdown-editor/tests/editor/markdown-editor-form.test.tsx)
- [`packages/markdown-editor/tests/editor/editor-form-metadata.test.tsx`](/Users/mrbubbles/dev/bubbles-verse/packages/markdown-editor/tests/editor/editor-form-metadata.test.tsx)
- [`packages/markdown-editor/vitest.setup.ts`](/Users/mrbubbles/dev/bubbles-verse/packages/markdown-editor/vitest.setup.ts)

What happens:

- multiple tests fail before meaningful assertions run
- reason is broken `localStorage` assumptions in the current test environment

Assessment:

- not a direct production bug
- but it weakens confidence in the extracted package significantly

What should be addressed:

- make the editor package test environment stable again

## Summary: New vs Inherited

Clearly new or primarily created by the shared-package extraction:

- the original `FormBeispiel` serializer/renderer mismatch before removal
- non-robust `plugins` subset / `defaultBlock` behavior
- weaker shared `EditorForm` state reset model
- broken `markdown-editor` test setup
- client-only shared renderer architecture diverging from `lms-ref`

Clearly inherited from the references:

- unsafe external link scheme handling
- serializer attribute escaping weaknesses
- table serialization weaknesses
- StrictMode cleanup guard pattern
- incorrect blur placeholder MIME derivation

Reference mismatch rather than simple bug:

- Cloudinary-only image assumptions in the shared renderer versus
  `portal-ref`'s direct-URL fallback support

## What Should Be Fixed

Everything listed in this document should be treated as real technical debt or
technical correctness work.

The most important concrete corrections are:

1. complete the intentional removal of `FormBeispiel` from shared-package expectations
2. sanitize rendered link schemes
3. fix EditorJS cleanup/re-init behavior
4. decide and enforce the intended image source model
5. escape serialized MDX attributes safely
6. escape table cell content safely
7. harden `defaultBlock` for plugin subsets
8. restore reliable `markdown-editor` package test execution

## Final Assessment

The current implementation is workable, but not yet a clean technical
equivalent of the references.

It is good enough to continue building on, but not good enough to treat as
fully settled infrastructure.

Before these packages become long-term foundation code, the issues documented
here should be addressed deliberately rather than left to accumulate.
