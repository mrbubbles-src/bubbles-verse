# Markdown Packages vs References Audit

Local-only audit of `packages/markdown-editor` and `packages/markdown-renderer`
against the repo references in `portal-ref`, `lms-ref`, `to-be-integrated`, and
`apps/the-coding-vault`.

## Executive Summary

The package direction is clearly more reusable and safer in a few spots, but it
also moves a lot more responsibility into the shared layer than the references
do. The biggest behavior shifts are:

- the package ships a generic default metadata form instead of the reference
  app-specific RHF forms
- image upload is a callback contract, not a package-owned route/helper
- live preview uses a client-safe MDX component split that the references do
  not need in the same shape
- the package removed `FormBeispiel`, while the reference component registries
  still expose it
- the package adds a runtime MDX render path, while the reference apps mostly
  render final content with app-level MDX integration

Net: the package is better as a library boundary. It is worse as a turnkey
drop-in for the reference apps unless each consumer recreates the missing app
policy around forms, uploads, and persistence.

## 1. EditorForm / Form Handling

Where:
[packages/markdown-editor/src/components/editor-form.tsx:60](./packages/markdown-editor/src/components/editor-form.tsx#L60),
[packages/markdown-editor/src/components/markdown-editor.tsx:336](./packages/markdown-editor/src/components/markdown-editor.tsx#L336),
[portal-ref/src/components/lms/markdown-editor/editor/editor-form.tsx:77](./portal-ref/src/components/lms/markdown-editor/editor/editor-form.tsx#L77),
[to-be-integrated/md-editor/markdown-editor/editor/editor-form.tsx:77](./to-be-integrated/md-editor/markdown-editor/editor/editor-form.tsx#L77),
[apps/the-coding-vault/components/layout/admin/editor/editor-form.tsx:41](./apps/the-coding-vault/components/layout/admin/editor/editor-form.tsx#L41)

What differs:
The package default form is a small, package-scoped metadata form built with
manual React state. It only owns `title`, `slug`, `description`, `tags`, and
`status`, derives the title from the first H1, and clears drafts after success.
The reference forms are app forms: they use `react-hook-form`, have field-level
validation, and carry a much wider workflow surface such as `duration`, `level`,
`submodule`, `ticketId`, review status, version bump, topic fork rules, or
category/author/order fields. In the reference apps, the editor wrapper usually
renders a custom form via `renderForm` or a dedicated app editor component, not
the shared fallback.

Likely motivation:
The package wants an app-agnostic metadata layer that can work for simple
content apps without dragging in the LMS domain model.

Pros:
Small API, lower coupling, and easier reuse across apps that only need entry
title/slug/description/tags/status.

Cons:
Less validation structure, more local state bookkeeping, and no parity with the
reference workflows that rely on RHF plus domain-specific fields.

Verdict:
Better for a generic shared package. Worse if the goal is parity with the
reference editors.

## 2. `renderForm` API vs App-Owned Forms

Where:
[packages/markdown-editor/src/components/markdown-editor.tsx:336](./packages/markdown-editor/src/components/markdown-editor.tsx#L336),
[portal-ref/src/components/lms/self-learning-editor/self-learning-editor.tsx:181](./portal-ref/src/components/lms/self-learning-editor/self-learning-editor.tsx#L181),
[to-be-integrated/md-editor/markdown-editor/editor/editor.tsx:554](./to-be-integrated/md-editor/markdown-editor/editor/editor.tsx#L554),
[apps/the-coding-vault/components/layout/admin/editor/editor.tsx:189](./apps/the-coding-vault/components/layout/admin/editor/editor.tsx#L189)

What differs:
The package exposes `renderForm` as a public render prop and falls back to its
own `EditorForm` only when no override is given. The reference implementations
mostly embed the form at the app layer and wire their own save/mutation logic,
which keeps the editor wrapper and the domain form tightly paired.

Likely motivation:
The package is trying to stay reusable and avoid coupling the editor shell to
any one app's persistence model.

Pros:
Consumers can swap in their own form without forking the editor shell.

Cons:
The default path is easier to use, but it is also easier for the package to
drift away from the exact behavior of the reference apps.

Verdict:
Neutral on architecture, worse on reference parity.

## 3. Preview Behavior and MDX Runtime

Where:
[packages/markdown-editor/src/components/preview-pane.tsx:44](./packages/markdown-editor/src/components/preview-pane.tsx#L44),
[packages/markdown-renderer/src/mdx-renderer.tsx:46](./packages/markdown-renderer/src/mdx-renderer.tsx#L46),
[portal-ref/src/components/lms/markdown-editor/md-preview/md-preview-render.tsx:1](./portal-ref/src/components/lms/markdown-editor/md-preview/md-preview-render.tsx#L1),
[to-be-integrated/md-editor/markdown-editor/md-preview/md-preview-render.tsx:1](./to-be-integrated/md-editor/markdown-editor/md-preview/md-preview-render.tsx#L1),
[lms-ref/app/modules/[module]/[submodule]/[slug]/page.tsx:1](</Users/mrbubbles/dev/bubbles-verse/lms-ref/app/modules/[module]/[submodule]/[slug]/page.tsx:1>)

What differs:
The package preview compiles MDX in the client with `@mdx-js/mdx/evaluate`,
uses a separate `previewComponents` registry, and keeps a stable
`compiledVersion` for scroll sync. The generic `MdxRenderer` also compiles at
runtime, but it returns `null` while compiling. The reference preview renderers
also compile at runtime, but the public pages in `lms-ref` use Next-oriented
MDX rendering with `next-mdx-remote-client/rsc` rather than a reusable client
renderer.

Likely motivation:
The package needs a live editor preview, not just final article rendering.
That makes client-safe compilation and a preview-specific component registry
necessary.

Pros:
Good fit for live editing, stable scroll sync, and fewer server-only component
surprises in preview mode.

Cons:
Runtime compilation is heavier than build-time or server-rendered MDX, and the
package now has two rendering paths to maintain.

Verdict:
Better for editor preview UX. Worse if you want a single final-render pipeline
like the reference apps.

## 4. MDX Component Registry Split

Where:
[packages/markdown-renderer/src/default-components.tsx:47](./packages/markdown-renderer/src/default-components.tsx#L47),
[packages/markdown-renderer/src/components/markdown-image/markdown-preview-image.tsx:1](./packages/markdown-renderer/src/components/markdown-image/markdown-preview-image.tsx#L1),
[portal-ref/src/mdx-components.tsx:23](./portal-ref/src/mdx-components.tsx#L23),
[lms-ref/mdx-components.tsx:42](./lms-ref/mdx-components.tsx#L42)

What differs:
The package splits the registry into `defaultComponents` and
`previewComponents`. `defaultComponents` keeps the async server-side image path
and `useMDXComponents()` returns that map for Next integration. The preview map
swaps in a synchronous client-safe image component. The reference apps keep a
single component registry per app. They also still expose the demo shortcode
`FormBeispiel`.

Likely motivation:
The split exists because the package has to work both for server-rendered MDX
and for a client-side live preview inside the editor.

Pros:
Cleaner boundary between server-only and client-safe rendering. The preview no
longer trips over async client components.

Cons:
More surface area, more duplication, and one more place where package behavior
can drift from the reference registry.

Verdict:
Better for Next.js client/server correctness. Slightly worse for maintenance
cost.

## 5. Image Rendering and Cloudinary

Where:
[packages/markdown-renderer/src/components/markdown-image/markdown-image.tsx:43](./packages/markdown-renderer/src/components/markdown-image/markdown-image.tsx#L43),
[packages/markdown-renderer/src/components/markdown-image/markdown-preview-image.tsx:1](./packages/markdown-renderer/src/components/markdown-image/markdown-preview-image.tsx#L1),
[portal-ref/src/components/lms/markdown-editor/md-preview/modules/modules-components/modules-image.tsx:1](./portal-ref/src/components/lms/markdown-editor/md-preview/modules/modules-components/modules-image.tsx#L1),
[lms-ref/components/layout/modules/modules-components/modules-image/modules-image.tsx:1](./lms-ref/components/layout/modules/modules-components/modules-image/modules-image.tsx#L1),
[to-be-integrated/md-editor/markdown-editor/md-preview/modules/modules-components/modules-image.tsx:1](./to-be-integrated/md-editor/markdown-editor/md-preview/modules/modules-components/modules-image.tsx#L1)

What differs:
The package image component is async and supports both Cloudinary-backed
`public_id` and plain `url` payloads. It builds a blur placeholder from the
Cloudinary asset and uses the response `content-type`. The reference image
components are more app-specific: they either use `AdvancedImage` with
`@cloudinary/react` or a Next Cloudinary wrapper, and they generally assume the
reference app's own MDX component registry plus Suspense. Some reference code
paths also fetch a blur asset and use `response.type` for the data URL MIME.

Likely motivation:
The package wants one normalized image contract for editor content, while the
reference apps keep their own rendering flavor and Cloudinary helper stack.

Pros:
The package contract is clearer: `public_id` for Cloudinary, `url` for direct
fallback. It is also more forgiving when content only has a direct URL.

Cons:
Async server image rendering and a separate preview-safe image component are
more complex than a single component map. The split also makes package and
reference behavior easier to desync.

Verdict:
Better on the content contract. Worse on simplicity.

## 6. Image Upload Path and Route Responsibility

Where:
[packages/markdown-editor/src/types/editor.ts:127](./packages/markdown-editor/src/types/editor.ts#L127),
[packages/markdown-editor/src/lib/editor-tools.ts:341](./packages/markdown-editor/src/lib/editor-tools.ts#L341),
[apps/the-coding-vault/app/api/vault/image-upload/route.ts:1](./apps/the-coding-vault/app/api/vault/image-upload/route.ts#L1),
[apps/the-coding-vault/components/layout/admin/editor/editor.tsx:116](./apps/the-coding-vault/components/layout/admin/editor/editor.tsx#L116),
[to-be-integrated/md-editor/markdown-editor/editor/editor.tsx:329](./to-be-integrated/md-editor/markdown-editor/editor/editor.tsx#L329),
[portal-ref/src/hooks/useLmsTopics.ts:154](./portal-ref/src/hooks/useLmsTopics.ts#L154)

What differs:
The package does not own an upload route. It exposes an `imageUploader`
callback contract and injects it into the EditorJS image tool when provided.
Consumers must supply the route, folder policy, Cloudinary config, and error
mapping themselves. The reference apps keep upload responsibility in the app or
backend layer: `the-coding-vault` has a local Next route under `/api/vault`,
while `portal-ref` goes through an API client to a backend path. The package
never tells the caller where the file should live in Cloudinary.

Likely motivation:
Strict library boundary. The package wants to stay agnostic about auth, folder
layout, and deployment model.

Pros:
Maximum flexibility. Each app can point at its own backend or upload policy.

Cons:
Every consumer has to rebuild the same Cloudinary route glue, which is exactly
why the implementation feels fragmented across apps.

Verdict:
Better as a reusable library boundary. Worse for turnkey DX and consistency
across apps.

## 7. Cloudinary Env and Config Contract

Where:
[apps/the-coding-vault/app/api/vault/image-upload/route.ts:5](./apps/the-coding-vault/app/api/vault/image-upload/route.ts#L5),
[apps/the-coding-vault/README.md:53](./apps/the-coding-vault/README.md#L53),
[apps/the-coding-vault/documentation/overview.md:58](./apps/the-coding-vault/documentation/overview.md#L58),
[lms-ref/documentation/configuration.md:20](./lms-ref/documentation/configuration.md#L20),
[portal-ref/.env.example:9](./portal-ref/.env.example#L9)

What differs:
The reference apps do not agree on a single Cloudinary env contract. The Vault
docs mention `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`,
`NEXT_PUBLIC_CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`. The LMS docs
only call out the public cloud name. Portal uses a Vite-style public cloud name
env. The package docs do not standardize any upload env contract because the
package does not own uploads.

Likely motivation:
Each app evolved around its own deployment and rendering model.

Pros:
Flexibility for different app types and render stacks.

Cons:
This is a real source of confusion. The same content flow can fail for reasons
that look like editor bugs but are really env/config mismatch.

Verdict:
Neutral in the abstract, worse operationally because there is no single shared
contract.

## 8. Serializer and Parser Stack

Where:
[packages/markdown-editor/src/lib/convert-markdown-to-editor-js.ts:267](./packages/markdown-editor/src/lib/convert-markdown-to-editor-js.ts#L267),
[packages/markdown-editor/package.json:35](./packages/markdown-editor/package.json#L35),
[to-be-integrated/md-editor/markdown-editor/lib/convert-markdown-to-editor-js.ts:1](./to-be-integrated/md-editor/markdown-editor/lib/convert-markdown-to-editor-js.ts#L1),
[portal-ref/src/components/lms/markdown-editor/lib/convert-markdown-to-editor-js.ts:1](./portal-ref/src/components/lms/markdown-editor/lib/convert-markdown-to-editor-js.ts#L1)

What differs:
`mdast`, `unified`, `remark-parse`, and `remark-gfm` are parser/import
dependencies, not MDX render dependencies. The package uses them in
`convertMarkdownToEditorJs()` to parse Markdown into an AST and then rebuild
EditorJS blocks. The reference implementations use the same parser family, but
they import the `mdast` types explicitly and keep the conversion code in the app
trees. In the package, the AST shapes are re-declared locally, and `mdast`
appears to be a runtime dependency without a direct source import.

Likely motivation:
Keep the markdown import flow portable and self-contained in the shared
package.

Pros:
The converter can be reused by any consumer without copying the parsing logic.
The package is not locked to one app's type layout.

Cons:
More duplicated AST typing, and the unused-looking `mdast` dependency is easy to
question during reviews.

Verdict:
Functionally aligned with the references. Slightly worse on maintainability due
to local type duplication.

## 9. `FormBeispiel` and Legacy Shortcodes

Where:
[packages/markdown-editor/src/serializer/security.ts:7](./packages/markdown-editor/src/serializer/security.ts#L7),
[packages/markdown-renderer/src/default-components.tsx:47](./packages/markdown-renderer/src/default-components.tsx#L47),
[portal-ref/src/mdx-components.tsx:5](./portal-ref/src/mdx-components.tsx#L5),
[lms-ref/mdx-components.tsx:3](./lms-ref/mdx-components.tsx#L3)

What differs:
The package intentionally removes `FormBeispiel` from the serializer allowlist
and from the package MDX registry. The reference component registries still
export it, which means reference content can still render or at least still
expects that shortcode to exist.

Likely motivation:
The package is tightening the security boundary and removing a legacy demo
component that does not belong in a shared contract.

Pros:
Smaller attack surface, cleaner serializer contract, less legacy baggage.

Cons:
Possible compatibility break for old content that still contains the shortcut.

Verdict:
Better if the goal is to retire the demo component. Worse if you need strict
parity with old reference content.

## 10. Bootstrap / Initial Data Normalization

Where:
[packages/markdown-editor/src/lib/editor-content.ts:55](./packages/markdown-editor/src/lib/editor-content.ts#L55),
[packages/markdown-editor/src/types/editor.ts:29](./packages/markdown-editor/src/types/editor.ts#L29),
[portal-ref/src/components/lms/markdown-editor/editor/types.ts:1](./portal-ref/src/components/lms/markdown-editor/editor/types.ts#L1),
[to-be-integrated/md-editor/markdown-editor/editor/types.ts:1](./to-be-integrated/md-editor/markdown-editor/editor/types.ts#L1)

What differs:
The package accepts a broader bootstrap surface: raw EditorJS content, JSON
strings, or a wrapper object with metadata. It then normalizes that input into
editor data and form data before rendering. The reference implementations are
much more domain-shaped and generally hydrate their forms from app-specific
draft/data types directly.

Likely motivation:
Make the shared editor easier to drop into multiple apps without forcing a
single draft schema.

Pros:
Flexible bootstrap contract and fewer consumer-side parsing helpers.

Cons:
More normalization logic in the package, more branches, and more room for
surprising resets if the input shape changes.

Verdict:
Better for reusability. Neutral to slightly worse for simplicity.

## 11. Plugin Subsets and Default Block Logic

Where:
[packages/markdown-editor/src/lib/editor-tools.ts:32](./packages/markdown-editor/src/lib/editor-tools.ts#L32),
[packages/markdown-editor/src/lib/editor-tools.ts:144](./packages/markdown-editor/src/lib/editor-tools.ts#L144),
[apps/the-coding-vault/components/layout/admin/editor/editor.tsx:116](./apps/the-coding-vault/components/layout/admin/editor/editor.tsx#L116),
[portal-ref/src/components/lms/markdown-editor/editor/editor.tsx:329](./portal-ref/src/components/lms/markdown-editor/editor/editor.tsx#L329)

What differs:
The package supports `plugins` as an allowlist and computes `defaultBlock`
from the active subset. The reference editors hardcode the full toolset and do
not need a subset-aware `defaultBlock` resolver.

Likely motivation:
Let consumers ship a smaller or different tool palette without forking the
editor shell.

Pros:
Better shared-package ergonomics and less unused tool registration.

Cons:
Another place where the package must protect itself from invalid tool mixes.

Verdict:
Better for a reusable package, neutral for the reference apps.

## Bottom Line

The package is not just a straight port of the reference apps. It is a library
layer that deliberately trades reference parity for reusability and safety in a
few key places. The most important meaningful differences are the default form
architecture, the upload contract, the runtime MDX preview split, and the
removal of `FormBeispiel`. If you want strict parity, the package currently
needs more app-owned behavior. If you want a shared editor core, the package is
moving in the right direction, but it should probably standardize the upload
contract and document the Cloudinary/env policy much more explicitly.
