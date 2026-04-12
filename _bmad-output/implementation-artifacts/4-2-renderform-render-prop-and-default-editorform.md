---
story_id: "4.2"
story_key: "4-2-renderform-render-prop-and-default-editorform"
epic: "Epic 4 — Content Authoring Editor"
status: ready-for-dev
created: 2026-04-12
---

# Story 4.2 — `renderForm` Render Prop and Default `<EditorForm>`

## User Story

As a developer,
I want to inject a custom metadata form via `renderForm` or fall back to the default `<EditorForm>`,
So that each product area can define its own fields without touching the package.

---

## Context

Different apps need different metadata forms — Vault entries have categories, Portfolio projects have tech stack tags, etc. The `renderForm` render prop lets each app define its own form while receiving full editor state as typed props. When no `renderForm` is provided, the default `<EditorForm>` renders instead.

**Critical:** The package never handles navigation. `onSuccess` is the only post-submit hook. No router calls anywhere in this package.

**Fields in `<EditorForm>`:** `title` (auto-derived from H1 — Story 4.3), `slug` (auto-generated — Story 4.3), `description`, `tags`, `status` (`published` | `unpublished`).

**Fields NOT in `<EditorForm>` (explicitly removed from lms-ref):** `level`, `difficulty`, `duration`, `order`, `versionBump`, `reasonType`, `reasonText`, `ticketId` — all LMS-specific.

**Prerequisite:** Story 4.1 (editor wrapper) complete.

---

## Mandatory Implementation Directives

- Follow `AGENTS.md` for every implementation decision in this story.
- If relevant code already exists in `portal-ref` or `lms-ref`, reuse that working code first and port it cleanly into the target package or app.
- Adapt reference code only as needed for this monorepo plan, package boundaries, typing, naming, and acceptance criteria.
- Do not rewrite or redesign working reference code unnecessarily when a clean extraction or transfer is sufficient.

## Acceptance Criteria

```gherkin
Given <MarkdownEditor renderForm={(props) => <MyForm {...props} />} />
When the editor renders
Then MyForm receives editorOutput, editorContent, editorReady, isEditMode, initialData
     as typed props — all fully typed with no any

Given <MarkdownEditor /> without renderForm
When the editor renders
Then the default <EditorForm> is shown with fields:
     title (auto from H1), slug (auto-generated, manually overridable),
     description, tags, and published | unpublished status

Given <MarkdownEditor imageUploader={fn} onSuccess={fn} />
When a form is submitted
Then onSuccess is called with the serialized data
And the package never handles routing or navigation internally
```

---

## Implementation Guide

### 1. `EditorRenderFormProps` — Full Typed Interface

```ts
// types/editor-types.ts
import type { OutputData } from '@editorjs/editorjs';

export interface TopicEditorDraft {
  content: OutputData;
  title: string;
  slug: string;
  description?: string;
  tags?: string[];
  status: 'published' | 'unpublished';
}

export interface EditorRenderFormProps {
  /** Current EditorJS block output. null until editor is ready. */
  editorOutput: OutputData | null;
  /** Serialized MDX content from the editor. Empty string until editor is ready. */
  editorContent: string;
  /** True once EditorJS has fully initialized. */
  editorReady: boolean;
  /** True when editing existing content. */
  isEditMode: boolean;
  /** The initial data passed to the editor in edit mode. Undefined in create mode. */
  initialData?: TopicEditorDraft;
}
```

No `any` anywhere.

### 2. Render Prop Integration in `<MarkdownEditor>`

```tsx
// markdown-editor.tsx
function MarkdownEditor({
  renderForm,
  onSuccess,
  imageUploader,
  isEditMode = false,
  initialData,
}: MarkdownEditorProps) {
  const [editorOutput, setEditorOutput] = useState<OutputData | null>(null);
  const [editorReady, setEditorReady] = useState(false);
  
  const editorContent = useMemo(
    () => editorOutput ? serializeToMdx(editorOutput) : '',
    [editorOutput]
  );
  
  const formProps: EditorRenderFormProps = {
    editorOutput,
    editorContent,
    editorReady,
    isEditMode,
    initialData,
  };

  return (
    <div className="markdown-editor-root">
      <div className="editor-pane">
        {/* EditorJS mount point */}
      </div>
      <div className="form-pane">
        {renderForm ? renderForm(formProps) : <EditorForm {...formProps} onSuccess={onSuccess} />}
      </div>
    </div>
  );
}
```

### 3. Default `<EditorForm>`

```tsx
// components/editor-form.tsx
interface EditorFormProps extends EditorRenderFormProps {
  onSuccess: (data: unknown) => void;
}

export function EditorForm({ editorOutput, editorContent, editorReady, isEditMode, initialData, onSuccess }: EditorFormProps) {
  // Title and slug managed by Story 4.3 hooks
  // Draft autosave managed by Story 4.4 hook

  async function handleSubmit(formData: FormValues) {
    const payload = {
      ...formData,
      content: editorOutput,
      mdxContent: editorContent,
    };
    onSuccess(payload);  // app handles navigation — never call router here
  }

  return (
    <form onSubmit={...}>
      <input name="title" /* auto-populated from H1 in Story 4.3 */ />
      <input name="slug"  /* auto-generated in Story 4.3 */ />
      <textarea name="description" />
      <input name="tags" /* comma-separated or multi-select */ />
      <select name="status">
        <option value="published">Published</option>
        <option value="unpublished">Unpublished</option>
      </select>
      <button type="submit" disabled={!editorReady}>Submit</button>
    </form>
  );
}
```

**Form libraries:** Use `react-hook-form` + `zod` for validation — both are already in `@bubbles/ui` and available via workspace.

### 4. No Router — Ever

```ts
// NEVER DO THIS in any file in @bubbles/markdown-editor:
import { useRouter } from 'next/navigation';  // ❌
router.push('/some-path');                     // ❌
window.location.href = '...';                  // ❌

// ALWAYS DO THIS:
onSuccess(payload);  // ✅ — app decides what happens next
```

### 5. Exported `<EditorForm>`

`<EditorForm>` is exported as a named export from `src/index.ts` so apps can use it as a standalone starting point for custom forms:

```ts
export { EditorForm } from './components/editor-form';
export type { EditorRenderFormProps, TopicEditorDraft } from './types/editor-types';
```

---

## Anti-Patterns to Avoid

- **Never add routing inside this package.** `onSuccess` only.
- **No `any` in `EditorRenderFormProps`** or any prop type.
- **Do not include LMS-specific fields** (`level`, `duration`, `order`, `versionBump`, etc.) in `<EditorForm>`.
- **Do not use `lucide-react`** for form icons. HugeIcons only.

---

## Verification Checklist

- [ ] `renderForm` receives all 5 typed props
- [ ] Default `<EditorForm>` renders when `renderForm` not provided
- [ ] `<EditorForm>` has exactly: title, slug, description, tags, status fields
- [ ] `onSuccess` called on submit — no router/navigation calls anywhere
- [ ] `EditorForm`, `EditorRenderFormProps`, `TopicEditorDraft` exported from `src/index.ts`
- [ ] `bun run typecheck` passes (no `any`)

---

## Dev Notes

_To be filled in during implementation._
