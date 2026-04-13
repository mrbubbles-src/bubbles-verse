# Markdown Packages Remediation Plan

Date: 2026-04-13

## Scope

This plan covers the follow-up work for:

- `packages/markdown-editor`
- `packages/markdown-renderer`

It is based on:

- the review in [`markdown-packages-reference-review-2026-04-13.md`](./markdown-packages-reference-review-2026-04-13.md)
- current package code in this repo
- working reference behavior in:
  - `to-be-integrated`
  - `portal-ref`
  - `lms-ref`

Goal:

- restore reference-level editor behavior first
- remove known legacy mismatch (`FormBeispiel`) instead of preserving it
- then harden the shared packages where the references are also weak

## Ground Rules

1. Prefer proven reference behavior over new abstractions for editor UX.
2. Fix visible runtime/editor regressions before deeper hardening.
3. Remove `FormBeispiel` entirely; do not reintroduce it as shared functionality.
4. Keep changes split into focused PRs so regressions are easier to isolate.

## Priority Order

1. Restore reference-style editor preview behavior and remove the scroll jump.
2. Remove `FormBeispiel` from the serializer contract and tests.
3. Restore image/rendering parity where required, then harden links and serializer output.
4. Tighten shared-package-only robustness issues such as invalid plugin subsets and cleanup behavior.

## PR 1

Title:

`fix: restore reference-style editor preview behavior`

Goal:

- remove the editor scroll jump when adding blocks
- make live preview behavior match the reference flow again

### Why this goes first

The most visible regression is the editor pane jumping when a new block is added.
The likely root cause is that the shared editor preview currently recompiles MDX
through the generic runtime renderer and temporarily drops rendered output during
updates, while scroll sync reacts to unstable preview geometry.

The working references use a dedicated preview flow that:

- compiles MDX locally inside the editor preview
- keeps the last successful preview mounted
- increments a stable `compiledVersion` only after successful compile
- drives scroll resync from that stable version

### File-by-file plan

#### [`packages/markdown-editor/src/components/preview-pane.tsx`](../packages/markdown-editor/src/components/preview-pane.tsx)

- Remove the current live-preview dependency on `@bubbles/markdown-renderer` `MdxRenderer`.
- Replace it with a reference-style preview flow using:
  - local `evaluate(...)`
  - `react/jsx-runtime`
  - `remark-gfm`
  - the shared MDX component map
- Keep local state for:
  - compiled component
  - compile error
  - `compiledVersion`
- Recompile when serialized MDX changes.
- Only replace the rendered preview after a successful compile.
- Keep the previous successful preview visible while the next compile is in flight.

#### Scroll sync inside [`preview-pane.tsx`](../packages/markdown-editor/src/components/preview-pane.tsx)

- Stop using raw `mdxContent` as `contentVersion`.
- Drive `useScrollSync(...)` with stable `compiledVersion`.
- Keep the editor as the dominant source of truth for sync.
- If needed during stabilization, temporarily reduce sync to `editor-to-preview` and only re-enable bidirectional sync after manual verification.

#### [`packages/markdown-renderer/src/mdx-renderer.tsx`](../packages/markdown-renderer/src/mdx-renderer.tsx)

- Do not use this component for the editor live preview anymore.
- Leave it as the generic shared runtime renderer for non-editor usage.
- Optional later hardening: keep last successful render here too, but this is not required to fix the editor regression.

### Tests

#### [`packages/markdown-editor/tests/editor/markdown-editor-form.test.tsx`](../packages/markdown-editor/tests/editor/markdown-editor-form.test.tsx)

- Stop asserting preview behavior through a mocked `MdxRenderer`.
- Update tests to assert actual visible preview output from the dedicated preview component.

#### New or expanded editor tests

- Add a regression test that confirms the preview does not disappear between content updates.
- Add a regression test that `compiledVersion` advances only after successful compile.
- If practical in JSDOM, add a focused scroll stability test around block insertion.

### Manual verification

- Open the editor UI.
- Add new blocks near the bottom of the editor pane.
- Confirm:
  - no short jump to the top and back
  - preview stays visible during updates
  - scroll sync remains stable

## PR 2

Title:

`refactor: remove legacy FormBeispiel shortcode support`

Goal:

- remove `FormBeispiel` completely from the shared package contract
- stop carrying a dead reference artifact in serializer logic and tests

### Why this is the right move

`FormBeispiel` exists in the references as a legacy/demo artifact, but the shared
renderer no longer registers it. Re-adding it would preserve the mismatch and keep
dead surface area alive. The correct shared-package move is to remove it fully.

### File-by-file plan

#### [`packages/markdown-editor/src/serializer/security.ts`](../packages/markdown-editor/src/serializer/security.ts)

- Remove `FormBeispiel` from `DEFAULT_ALLOWED_MDX_COMPONENTS`.
- Keep the shortcode parser itself, but with no legacy demo component in the allowlist.
- Ensure unsupported inline component syntax falls back to normal text behavior.

#### [`packages/markdown-editor/tests/serializer/security.test.ts`](../packages/markdown-editor/tests/serializer/security.test.ts)

- Remove all positive `FormBeispiel` expectations.
- Replace them with negative contract tests:
  - unknown shortcode does not expand
  - unknown JSX-like component does not expand
  - malformed JSON props remain plain text

#### Repo-wide references

- Remove or update all remaining `FormBeispiel` mentions in package-level tests and documentation.
- Keep historical mention only where useful in review notes.

#### [`documentation/markdown-packages-reference-review-2026-04-13.md`](./markdown-packages-reference-review-2026-04-13.md)

- Update the finding from “missing registration mismatch” to “legacy component intentionally removed from the shared contract”.
- Adjust the summary section so it no longer treats this as an unresolved package bug.

### Manual verification

- Confirm `serializeToMdx(...)` no longer emits `<FormBeispiel />`.
- Confirm the renderer package has no remaining responsibility for that component.

## PR 3

Title:

`fix: restore image parity and harden markdown rendering`

Goal:

- restore missing reference behavior where needed
- harden known correctness and security weaknesses

### Part A: image behavior

#### [`packages/markdown-renderer/src/components/markdown-image/markdown-image.tsx`](../packages/markdown-renderer/src/components/markdown-image/markdown-image.tsx)

- Decide the data contract explicitly.
- Preferred direction for reference parity:
  - support Cloudinary-backed images when `public_id` exists
  - support direct `url` fallback when `public_id` is missing
- Split the logic accordingly instead of always assuming Cloudinary preview generation.
- Replace `response.type` with the actual `Content-Type` response header when building blur data URLs.

#### [`packages/markdown-renderer/__tests__/markdown-image.test.tsx`](../packages/markdown-renderer/__tests__/markdown-image.test.tsx)

- Add coverage for:
  - Cloudinary-backed rendering
  - `url`-only rendering
  - correct blur data URL MIME handling

### Part B: link sanitization

#### [`packages/markdown-renderer/src/components/markdown-link.tsx`](../packages/markdown-renderer/src/components/markdown-link.tsx)

- Add explicit scheme sanitization.
- Allow:
  - internal paths
  - hash links
  - `http:`
  - `https:`
  - `mailto:`
  - `tel:`
- Neutralize anything else such as `javascript:` or `data:`.

#### Link tests

- Add tests for safe and unsafe schemes.

### Part C: serializer hardening

#### [`packages/markdown-editor/src/lib/serialize-to-mdx.ts`](../packages/markdown-editor/src/lib/serialize-to-mdx.ts)

- Replace raw MDX attribute interpolation with safe serialization helpers.
- Cover all affected block serializers:
  - code / codeBox
  - toggle
  - embed
  - image
- Escape or normalize table cell content before constructing GFM rows.

#### Serializer tests

- Add regression tests for:
  - quotes in serialized string props
  - problematic embed/image values
  - table cells with `|`
  - table cells with newlines

### Part D: plugin subset robustness

#### [`packages/markdown-editor/src/lib/editor-tools.ts`](../packages/markdown-editor/src/lib/editor-tools.ts)

- Restrict `defaultBlock` resolution to true block tools.
- Prevent inline-only subsets from producing invalid EditorJS `defaultBlock` values.

#### [`packages/markdown-editor/tests/editor/markdown-editor.test.tsx`](../packages/markdown-editor/tests/editor/markdown-editor.test.tsx)

- Add tests for invalid or inline-only plugin subsets.

## Later follow-up

These are worth doing, but after the three PRs above:

- tighten the EditorJS cleanup/re-init lifecycle in [`packages/markdown-editor/src/components/markdown-editor.tsx`](../packages/markdown-editor/src/components/markdown-editor.tsx)
- make `EditorForm` reset behavior explicit instead of relying on a heuristic remount key
- optionally harden the generic shared `MdxRenderer` to keep the last successful render mounted during recompilation too

## Verification Checklist

After the three planned PRs:

- `bun run --cwd packages/markdown-editor test`
- `bun run --cwd packages/markdown-renderer test`
- manual editor verification for:
  - adding new blocks without jumpy scroll behavior
  - stable preview updates
  - safe external link handling
  - image rendering with and without `public_id`
  - serializer handling of quotes and problematic table cells

## Expected End State

- editor live preview behaves like the references again
- `FormBeispiel` is fully removed from the shared contract
- image behavior is explicit and reference-aligned
- external links are no longer unsafe by default
- serializer output is harder to break with normal content
- shared-package-only edge cases are covered by tests instead of assumptions
