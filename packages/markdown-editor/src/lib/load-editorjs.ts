/**
 * Load the EditorJS constructor lazily.
 *
 * The indirection keeps the runtime bundle split while giving tests a stable
 * module boundary they can mock without depending on dynamic-import behavior.
 *
 * @returns EditorJS constructor used by the shared editor wrapper.
 */
export async function loadEditorJs() {
  const module = await import('@editorjs/editorjs');

  return module.default;
}
