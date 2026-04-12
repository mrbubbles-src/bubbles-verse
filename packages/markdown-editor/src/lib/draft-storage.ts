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
  draft: MarkdownEditorDraft
): void {
  if (!canUseDraftStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(draft));
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
function loadDraft(storageKey: string): MarkdownEditorDraft | null {
  if (!canUseDraftStorage()) {
    return null;
  }

  try {
    const rawDraft = window.localStorage.getItem(storageKey);

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
export function saveCreateDraft(draft: MarkdownEditorDraft): void {
  saveDraft(CREATE_DRAFT_KEY, CREATE_DRAFT_UPDATED_EVENT, draft);
}

/**
 * Read the create-mode draft payload.
 *
 * @returns Stored create-mode draft or `null`.
 */
export function loadCreateDraft(): MarkdownEditorDraft | null {
  return loadDraft(CREATE_DRAFT_KEY);
}

/**
 * Clear the create-mode draft payload.
 */
export function clearCreateDraft(): void {
  clearDraft(CREATE_DRAFT_KEY, CREATE_DRAFT_UPDATED_EVENT);
}

/**
 * Persist an edit-mode draft and notify listeners.
 *
 * @param draft - Draft payload for edit mode.
 */
export function saveEditDraft(draft: MarkdownEditorDraft): void {
  saveDraft(EDIT_DRAFT_KEY, EDIT_DRAFT_UPDATED_EVENT, draft);
}

/**
 * Read the edit-mode draft payload.
 *
 * @returns Stored edit-mode draft or `null`.
 */
export function loadEditDraft(): MarkdownEditorDraft | null {
  return loadDraft(EDIT_DRAFT_KEY);
}

/**
 * Clear the edit-mode draft payload.
 */
export function clearEditDraft(): void {
  clearDraft(EDIT_DRAFT_KEY, EDIT_DRAFT_UPDATED_EVENT);
}
