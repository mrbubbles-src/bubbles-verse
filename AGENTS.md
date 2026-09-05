<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

## General

- Avoid overly clever or abstract solutions unless clearly justified.
- Write code for humans: it must be easy to read, understand, and maintain, while remaining efficient.
- Follow the global review and verification cadence: use focused checks during
  implementation and the full relevant project checks on the final candidate,
  not after every intermediate fix. Read-only tasks do not authorize formatting
  or other edits.
- Add concise JSDoc comments that explain what the function or component is for, how to use it, what it expects, and what it returns — even if the implementation seems obvious.
- Avoid comments that merely restate the function name or implementation.
- Verify task-relevant assumptions against the codebase and installed versions.
  Use current official documentation or suitable tools for version-sensitive
  behavior or material uncertainty; do not use every available tool by default.
- When writing german text, always use umlauts instead of "ae", "oe", "ue".
- When creating new components, libraries, hooks, etc., think about grouping it into a folder structure that makes sense; don't just throw it into the respective resources folder.
- Always run `bun install` and `bun add` from the repository root. For workspace
  dependencies, use `bun add <dependency> --filter=<workspace-name>` or
  `bun add -d <dependency> --filter=<workspace-name>`.

## UI/UX

- Always check first if there's a shadcn component already available in the @bubbles/ui package.
  - If not, check if there's a component for that need in the shadcn registry and install it via the official shadcn CLI if it's available.
- Never edit the shadcn component files directly, unless there is a good reason to do so, e.g. to add a new variant or to fix a bug.
- Always build new components, using the shadcn components as a base.
- A component / package should be adjusatable on a viusal level to the needs of the app it is used in, so it does not break other apps that are using it.
- For UI/UX relevant tasks, always use frontent-design, userinterface-wiki and shadcn skills.
- Avoid unnecessary wrapper elements.
- Always design mobile-first.
- Keep skeletons in separate files.

## Testing

- Keep tests up to date and accurate.
- Update or add tests with every functional change.
- Keep test files in their own directory; do not mix them with the source code.

## Caching

- Follow the dashboard caching pattern for Next.js data reads: auth/session
  checks use request-scoped React `cache()`, stable database reads use Cache
  Components with `use cache`, `cacheLife`, and `cacheTag`.
- Mutations must invalidate the matching dashboard tags with `updateTag` in
  Server Actions or `revalidateTag(..., { expire: 0 })` in Route Handlers.
- Never put `cookies()`, `headers()`, session checks, or authorization checks
  inside `use cache`.

## TypeScript

- Use precise domain and interface types. Prefer concrete types, generics,
  schemas, and discriminated unions over `any`. If an unavoidable external
  boundary requires `any`, isolate and explain the exception.
- Use `unknown` for genuinely untrusted or not-yet-known values, then validate or
  narrow them before use. Do not replace known domain types with `unknown`.
- Use `never` for impossible states and exhaustiveness where appropriate. Do not
  use blanket assertions or `as unknown as` to bypass missing types or validation.

## Large File & Module Structure Policy

- Avoid excessively large files.
- Prefer cohesive modules over splitting by size.
- ~400+ lines: briefly check if the file is still clear and focused.
- ~800+ lines: strong signal to consider splitting.
- Split when responsibilities diverge or navigation becomes difficult.
- Do not split tightly coupled logic just to reduce size.
- If unsure: keep the current structure.

## Documentation

- At the end of a coherent slice or feature, update the relevant documentation
  so developers can understand the changed system, its contracts, and its usage.
  Update README and CHANGELOG where appropriate. Batch related documentation
  changes rather than updating every document after each intermediate fix.
  Do not expand this into unrelated documentation work.
- Documentation and changelogs must live close to the code they describe.
- Keep docs concise, human readable, and aligned with the codebase.
- Prefer small, focused files over large ones.
- Root:
  - `docs/` documents only monorepo-wide architecture, setup, tooling, and cross-cutting contracts.
  - `docs/README.md` is the navigation entrypoint.
  - explicitly approved repository planning artifacts may live under `docs/superpowers/`.
  - `README.md` (overview, setup, structure)
  - `CHANGELOG.md` (only cross-cutting changes)
- Apps/Packages:
  - document their own logic, usage, and changes.
  - scoped changes only.
  - own `README.md`
  - own `CHANGELOG.md`
  - own `docs/` (e.g. `apps/*/docs/`, `packages/*/docs/`)
- Inside a `docs/` folder, use stable topic folders such as `contracts/`,
  `architecture/`, `design/`, `development/`, `operations/`, or `archive/` only when
  current content needs them. Do not create empty taxonomy folders.
- New or renamed documentation folders must be named `docs/`, never
  `documentation/`.
- Do not mix scopes.
