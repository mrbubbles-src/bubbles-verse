<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

## General

- Be extremely concise. Sacrifice grammar for the sake of concision.
- Avoid overly clever or abstract solutions unless clearly justified.
- Write code for humans: it must be easy to read, understand, and maintain, while remaining efficient.
- If you would signifiicantly change a file, always ask for confirmation first before proceeding.
- Subagents should be used when appropriate to prevent context snowballing, even if the user does not explicitly request it. Usecases for subagents are for example code analysis, checking documentation, reviewing code etc.
- Always run formatting, linting and typechecking before finishing a task.
- Add concise JSDoc comments that explain what the function or component is for, how to use it, what it expects, and what it returns — even if the implementation seems obvious.
- Avoid comments that merely restate the function name or implementation.
- Always assume your knowledge is outdated, verify it with all your available tooling, such as the codebase, documentation via MCP Servers, Skills, Plugins, etc.
- Use the `init` command first once in a new NextDevTools session to initialize the MCP.
- When writing german text, always use umlauts instead of "ae", "oe", "ue".
- When creating new components, libraries, hooks, etc., think about grouping it into a folder structure that makes sense; don't just throw it into the respective resources folder.

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

## TypeScript

- Do not use `any`, `unknown` or `never` unless there's absolutely no other way.

## Large File & Module Structure Policy

- Avoid excessively large files.
- Prefer cohesive modules over splitting by size.
- ~400+ lines: briefly check if the file is still clear and focused.
- ~800+ lines: strong signal to consider splitting.
- Split when responsibilities diverge or navigation becomes difficult.
- Do not split tightly coupled logic just to reduce size.
- If unsure: keep the current structure.

## Documentation

- Always update documentation, README.md, and CHANGELOG.md.
- Documentation and changelogs must live close to the code they describe.
- Keep docs concise, human readable, and aligned with the codebase.
- Prefer small, focused files over large ones.
- Document anything that improves human onboarding or understanding.
- Root:
  - documents the monorepo as a whole (architecture, setup, tooling).
  - only global changes.
  - `README.md` (overview, setup, structure)
  - optional `documentation/`
  - `CHANGELOG.md` (only cross-cutting changes)
- Apps/Packages:
  - document their own logic, usage, and changes.
  - scoped changes only.
  - own `README.md`
  - own `CHANGELOG.md`
  - own `documentation/` (e.g. `apps/*/documentation/`, `packages/*/documentation/`)
- Do not mix scopes.
