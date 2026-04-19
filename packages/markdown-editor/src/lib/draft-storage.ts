import type {
  MarkdownEditorContentData,
  MarkdownEditorInitialData,
} from '../types/editor';

/** Storage key for create-mode topic drafts. */
export const CREATE_DRAFT_KEY = 'topic-editor-create-draft';
/** Storage key for edit-mode topic drafts. */
export const EDIT_DRAFT_KEY = 'topic-editor-edit-draft';
/** Browser event emitted when edit draft changes. */
export const EDIT_DRAFT_UPDATED_EVENT = 'edit-draft-updated';
/** Browser event emitted when create draft changes. */
export const CREATE_DRAFT_UPDATED_EVENT = 'create-draft-updated';

/**
 * Build the final localStorage key for a package draft scope.
 *
 * The shared editor defaults to one key per mode, but apps can provide a
 * stable scope such as an entry ID so edit drafts do not leak between records.
 *
 * @param storageKey - Base key for create or edit mode.
 * @param scope - Optional app-defined suffix for per-record isolation.
 * @returns Stable localStorage key for the current editor session.
 */
function getScopedDraftStorageKey(storageKey: string, scope?: string): string {
  const normalizedScope = scope?.trim();

  if (!normalizedScope) {
    return storageKey;
  }

  return `${storageKey}:${normalizedScope}`;
}

/**
 * Internal draft payload persisted by the package.
 *
 * The shape mirrors the reference metadata envelope while storing normalized
 * EditorJS content so the editor can restore without app-specific adapters.
 */
export type MarkdownEditorDraft = Omit<MarkdownEditorInitialData, 'content'> & {
  content?: MarkdownEditorContentData;
};

/**
 * Returns whether browser storage APIs are available.
 *
 * @returns True when `window.localStorage` can be accessed.
 */
function canUseDraftStorage(): boolean {
  return typeof window !== 'undefined' && 'localStorage' in window;
}

/**
 * Persist a draft payload and notify browser listeners.
 *
 * @param storageKey - LocalStorage key for the draft mode.
 * @param eventName - Browser event emitted after storage changes.
 * @param draft - Draft payload to persist.
 */
function saveDraft(
  storageKey: string,
  eventName: string,
  draft: MarkdownEditorDraft,
  scope?: string
): void {
  if (!canUseDraftStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(
      getScopedDraftStorageKey(storageKey, scope),
      JSON.stringify(draft)
    );
    window.dispatchEvent(new Event(eventName));
  } catch {
    /* Ignore storage failures so editing stays interactive. */
  }
}

/**
 * Read a draft payload from localStorage.
 *
 * @param storageKey - LocalStorage key for the requested draft mode.
 * @returns Stored draft payload or `null` when unavailable.
 */
function loadDraft(
  storageKey: string,
  scope?: string
): MarkdownEditorDraft | null {
  if (!canUseDraftStorage()) {
    return null;
  }

  try {
    const rawDraft = window.localStorage.getItem(
      getScopedDraftStorageKey(storageKey, scope)
    );

    if (!rawDraft) {
      return null;
    }

    return JSON.parse(rawDraft) as MarkdownEditorDraft;
  } catch {
    return null;
  }
}

/**
 * Remove a stored draft payload and notify browser listeners.
 *
 * @param storageKey - LocalStorage key for the draft mode.
 * @param eventName - Browser event emitted after storage changes.
 */
function clearDraft(storageKey: string, eventName: string): void {
  if (!canUseDraftStorage()) {
    return;
  }

  try {
    window.localStorage.removeItem(storageKey);
    window.dispatchEvent(new Event(eventName));
  } catch {
    /* Ignore storage failures so clearing does not crash the editor. */
  }
}

/**
 * Persist a create-mode draft and notify listeners.
 *
 * @param draft - Draft payload for create mode.
 */
export function saveCreateDraft(
  draft: MarkdownEditorDraft,
  scope?: string
): void {
  saveDraft(CREATE_DRAFT_KEY, CREATE_DRAFT_UPDATED_EVENT, draft, scope);
}

/**
 * Read the create-mode draft payload.
 *
 * @returns Stored create-mode draft or `null`.
 */
export function loadCreateDraft(scope?: string): MarkdownEditorDraft | null {
  return loadDraft(CREATE_DRAFT_KEY, scope);
}

/**
 * Clear the create-mode draft payload.
 */
export function clearCreateDraft(scope?: string): void {
  clearDraft(
    getScopedDraftStorageKey(CREATE_DRAFT_KEY, scope),
    CREATE_DRAFT_UPDATED_EVENT
  );
}

/**
 * Persist an edit-mode draft and notify listeners.
 *
 * @param draft - Draft payload for edit mode.
 */
export function saveEditDraft(
  draft: MarkdownEditorDraft,
  scope?: string
): void {
  saveDraft(EDIT_DRAFT_KEY, EDIT_DRAFT_UPDATED_EVENT, draft, scope);
}

/**
 * Read the edit-mode draft payload.
 *
 * @returns Stored edit-mode draft or `null`.
 */
export function loadEditDraft(scope?: string): MarkdownEditorDraft | null {
  return loadDraft(EDIT_DRAFT_KEY, scope);
}

/**
 * Clear the edit-mode draft payload.
 */
export function clearEditDraft(scope?: string): void {
  clearDraft(
    getScopedDraftStorageKey(EDIT_DRAFT_KEY, scope),
    EDIT_DRAFT_UPDATED_EVENT
  );
}
