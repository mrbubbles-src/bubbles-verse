---
story_id: '4.1'
story_key: '4-1-editorjs-wrapper-with-configurable-plugin-subset'
epic: 'Epic 4 — Content Authoring Editor'
status: ready-for-dev
created: 2026-04-12
---

# Story 4.1 — EditorJS Wrapper with Configurable Plugin Subset

## User Story

As a developer,
I want `<MarkdownEditor>` with all 15 block types available and a `plugins` prop for subsetting,
So that I can activate only the blocks relevant to each use case.

---

## Context

`<MarkdownEditor>` wraps EditorJS with a React lifecycle bridge. The most critical challenge is preserving the reference implementation's initialization and cleanup behavior so EditorJS does not initialize twice or corrupt state.

The `plugins` prop controls which block types appear in the toolbar. Default: all 15. App passes a `PluginKey[]` array to activate a subset.

This behavior must be ported from `to-be-integrated/` first, otherwise from `portal-ref`.

**Prerequisite:** Story 1.2 (editor scaffold with all plugins) complete.

---

## Mandatory Implementation Contract

- Follow `AGENTS.md` for every implementation decision in this story.
- Port the existing working implementation from the designated reference source as the default path.
- Use `to-be-integrated/` first when the relevant implementation exists there.
- If the relevant implementation is not present in `to-be-integrated/`, use `portal-ref`.
- Do not rewrite, redesign, or replace a working reference implementation with a newly authored one unless this story explicitly documents an approved exception.
- If a reference implementation and this story appear to conflict, preserve the reference behavior and escalate the conflict instead of inventing a new solution.

### Primary Reference Source

`to-be-integrated/`

### Fallback Reference Source

`portal-ref`

### Reference Files / Modules

- Editor wrapper implementation in `to-be-integrated/` if present
- Equivalent editor wrapper implementation in `portal-ref`
- StrictMode lifecycle handling and plugin configuration in the same source

### Allowed Deviations

- package/file placement required by this monorepo
- import path updates
- naming changes explicitly required by package API
- strict typing and lint compliance
- documented acceptance-criteria-driven adjustments only

### Forbidden Deviations

- library swaps not present in the reference implementation
- architectural rewrites
- behavior changes not explicitly required by the story
- replacing working reference logic with newly invented logic
- omitting reference behavior because it seems unnecessary

### Reference Access Rule

If the implementation required by this story cannot be inspected in the `Primary Reference Source`, do not guess and do not invent a replacement implementation.

If the `Fallback Reference Source` is also unavailable, incomplete, or cannot be inspected sufficiently, stop and ask the user how to proceed before making any code changes.

Missing or inaccessible reference sources are a blocker for implementation, not permission to improvise.

### Deviation Approval Rule

If implementation appears to require any deviation from the reference implementation or from the agreed plan, stop before making the change and ask the user for a decision.

Present the deviation clearly using this structure:

- What is different?
- Why is the deviation being considered?
- Why can the reference or current plan not be followed as-is?
- What are the available options?
- What are the consequences or tradeoffs of each option?

Wait for explicit user approval before implementing any deviation.

## Acceptance Criteria

```gherkin
Given <MarkdownEditor> rendered without a plugins prop
When EditorJS initializes
Then all 15 block types are available in the toolbar
And EditorJS initializes without blocking the UI thread
And the designated reference implementation's lifecycle behavior prevents double-initialization and state corruption

Given <MarkdownEditor plugins={['paragraph', 'header', 'list', 'image']} />
When EditorJS initializes
Then only the specified block types appear in the toolbar — unused plugins are not loaded
```

---

## Implementation Guide

### 1. Reference-First Extraction

Inspect `to-be-integrated/` first and port the editor wrapper, tool configuration, and initialization behavior from there.

If the relevant implementation is not available there, inspect `portal-ref` and port the behavior from there.

Do not redesign the editor wrapper architecture, plugin registry, lifecycle guards, SSR strategy, or tool configuration flow unless the user explicitly approves a deviation.

### 2. File Layout and Public Surface

Use the designated reference implementation to determine:

- file layout
- internal hooks and helpers
- public component and type exports
- prop names and plugin-subset API shape

Only adapt file placement for monorepo structure.

### 3. Plugin Subset Behavior

Preserve the exact reference behavior for:

- supported plugin keys
- default plugin set
- subset filtering
- tool configuration mapping
- image uploader integration

Do not invent a new plugin registry or rename plugin keys without approval.

### 4. Editor Initialization and Cleanup

Port the exact initialization, dynamic import, mount, and cleanup behavior from the designated reference implementation.

If the reference includes lifecycle guards for React, EditorJS, or SSR quirks, preserve those guards rather than rewriting them from memory.

### 5. Plugin-Specific Configuration

Preserve plugin-specific behavior from the designated reference implementation, including any language lists, toolbar settings, uploader wiring, or plugin-local configuration.

Do not replace those values with a newly authored set in the story.

---

## Anti-Patterns to Avoid

- **Do not redesign the editor lifecycle flow** if the designated reference implementation already handles it.
- **Do not change plugin keys, default plugin set, or tool mapping** without verifying them against the designated reference implementation.
- **Do not replace reference SSR or dynamic-import handling** with a newly designed pattern.

---

## Verification Checklist

- [ ] Editor wrapper behavior matches the designated reference implementation
- [ ] Plugin subset behavior matches the designated reference implementation
- [ ] Initialization and cleanup behavior match the designated reference implementation
- [ ] Plugin-specific configuration matches the designated reference implementation
- [ ] No TypeScript errors (`any` stubs from Story 1.2 replaced with real types here)

---

## Dev Notes

_To be filled in during implementation._
