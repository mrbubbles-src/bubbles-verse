import type {
  MarkdownEditorContentData,
  MarkdownEditorInitialData,
} from '../types/editor';

/** Storage key for create-mode editor drafts. */
export const CREATE_DRAFT_KEY = 'editor-create-draft';
/** Storage key for edit-mode editor drafts. */
export const EDIT_DRAFT_KEY = 'editor-edit-draft';
/** Browser event emitted when edit draft changes. */
export const EDIT_DRAFT_UPDATED_EVENT = 'edit-draft-updated';
/** Browser event emitted when create draft changes. */
export const CREATE_DRAFT_UPDATED_EVENT = 'create-draft-updated';

const LEGACY_CREATE_DRAFT_KEY = 'topic-editor-create-draft';
const LEGACY_EDIT_DRAFT_KEY = 'topic-editor-edit-draft';

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
 * Stored draft payload with optional ownership scope metadata.
 *
 * Consumers can inspect the active create/edit slot without needing to parse
 * localStorage directly, while scoped loads can still reject foreign drafts.
 */
export type MarkdownEditorStoredDraft = MarkdownEditorDraft & {
  scope?: string | null;
};

/**
 * Normalize one optional draft scope for storage comparisons.
 *
 * @param scope - Optional app-defined draft scope.
 * @returns Trimmed scope string or `null` when absent.
 */
function normalizeDraftScope(scope?: string): string | null {
  const normalizedScope = scope?.trim();

  return normalizedScope ? normalizedScope : null;
}

/**
 * Returns whether browser storage APIs are available.
 *
 * @returns True when `window.localStorage` can be accessed.
 */
function canUseDraftStorage(): boolean {
  return typeof window !== 'undefined' && 'localStorage' in window;
}

/**
 * Build one persisted draft payload including its ownership scope.
 *
 * @param draft - Draft payload for the active editor session.
 * @param scope - Optional app-defined scope for this draft.
 * @returns Stored draft record written into localStorage.
 */
function buildStoredDraft(draft: MarkdownEditorDraft, scope?: string) {
  return {
    ...draft,
    scope: normalizeDraftScope(scope),
  } satisfies MarkdownEditorStoredDraft;
}

/**
 * Remove all legacy and current storage keys for one draft mode.
 *
 * @param storageKey - Current mode storage key.
 * @param legacyStorageKey - Historical mode storage key prefix.
 */
function clearDraftStorageFamily(
  storageKey: string,
  legacyStorageKey: string
): void {
  if (!canUseDraftStorage()) {
    return;
  }

  const keysToRemove = new Set<string>();

  keysToRemove.add(storageKey);
  keysToRemove.add(legacyStorageKey);

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const localStorageKey = window.localStorage.key(index);

    if (
      localStorageKey?.startsWith(`${legacyStorageKey}:`) ||
      localStorageKey === storageKey ||
      localStorageKey === legacyStorageKey
    ) {
      keysToRemove.add(localStorageKey);
    }
  }

  for (const key of keysToRemove) {
    window.localStorage.removeItem(key);
  }
}

/**
 * Persist a draft payload and notify browser listeners.
 *
 * @param storageKey - LocalStorage key for the draft mode.
 * @param legacyStorageKey - Historical localStorage key prefix for cleanup.
 * @param eventName - Browser event emitted after storage changes.
 * @param draft - Draft payload to persist.
 * @param scope - Optional app-defined scope for the active draft.
 */
function saveDraft(
  storageKey: string,
  legacyStorageKey: string,
  eventName: string,
  draft: MarkdownEditorDraft,
  scope?: string
): void {
  if (!canUseDraftStorage()) {
    return;
  }

  try {
    clearDraftStorageFamily(storageKey, legacyStorageKey);
    window.localStorage.setItem(
      storageKey,
      JSON.stringify(buildStoredDraft(draft, scope))
    );
    window.dispatchEvent(new Event(eventName));
  } catch {
    /* Ignore storage failures so editing stays interactive. */
  }
}

/**
 * Parse one raw localStorage draft value into the current storage shape.
 *
 * @param rawDraft - Raw JSON payload read from localStorage.
 * @param fallbackScope - Optional scope inferred from a legacy storage key.
 * @returns Normalized stored draft record or `null`.
 */
function parseStoredDraft(
  rawDraft: string,
  fallbackScope?: string
): MarkdownEditorStoredDraft | null {
  try {
    const parsedDraft = JSON.parse(rawDraft) as MarkdownEditorStoredDraft;

    return {
      ...parsedDraft,
      scope: normalizeDraftScope(parsedDraft.scope ?? fallbackScope),
    };
  } catch {
    return null;
  }
}

/**
 * Drop the internal scope marker before returning one draft to consumers.
 *
 * @param storedDraft - Stored draft record with optional scope metadata.
 * @returns Public draft payload without storage-only fields.
 */
function toPublicDraft(
  storedDraft: MarkdownEditorStoredDraft
): MarkdownEditorDraft {
  const { scope, ...draft } = storedDraft;

  void scope;

  return draft;
}

/**
 * Read the current mode draft slot without applying a scope filter.
 *
 * @param storageKey - Current localStorage key for the draft mode.
 * @param legacyStorageKey - Historical fallback key for migration reads.
 * @returns Active stored draft record or `null`.
 */
function peekStoredDraft(
  storageKey: string,
  legacyStorageKey: string
): MarkdownEditorStoredDraft | null {
  if (!canUseDraftStorage()) {
    return null;
  }

  try {
    const rawDraft = window.localStorage.getItem(storageKey);

    if (rawDraft) {
      return parseStoredDraft(rawDraft);
    }

    const legacyRawDraft = window.localStorage.getItem(legacyStorageKey);

    if (legacyRawDraft) {
      return parseStoredDraft(legacyRawDraft);
    }
  } catch {
    /* Fall through to the exact-scope legacy lookup below. */
  }

  return null;
}

/**
 * Read a draft payload from localStorage for one expected scope.
 *
 * @param storageKey - LocalStorage key for the requested draft mode.
 * @param legacyStorageKey - Historical fallback key prefix for migration reads.
 * @param scope - Optional app-defined scope for the current editor session.
 * @returns Stored draft payload or `null` when unavailable or foreign.
 */
function loadDraft(
  storageKey: string,
  legacyStorageKey: string,
  scope?: string
): MarkdownEditorDraft | null {
  if (!canUseDraftStorage()) {
    return null;
  }

  const normalizedScope = normalizeDraftScope(scope);
  const activeDraft = peekStoredDraft(storageKey, legacyStorageKey);

  if (activeDraft) {
    if (
      normalizedScope &&
      activeDraft.scope &&
      activeDraft.scope !== normalizedScope
    ) {
      return null;
    }

    if (normalizedScope && !activeDraft.scope) {
      return null;
    }

    return toPublicDraft(activeDraft);
  }

  if (!normalizedScope) {
    return null;
  }

  try {
    const legacyScopedDraft = window.localStorage.getItem(
      `${legacyStorageKey}:${normalizedScope}`
    );

    if (!legacyScopedDraft) {
      return null;
    }

    const parsedDraft = parseStoredDraft(legacyScopedDraft, normalizedScope);

    if (!parsedDraft) {
      return null;
    }

    return toPublicDraft(parsedDraft);
  } catch {
    return null;
  }
}

/**
 * Remove a stored draft payload and notify browser listeners.
 *
 * @param storageKey - Current localStorage key for the draft mode.
 * @param legacyStorageKey - Historical localStorage key prefix for cleanup.
 * @param eventName - Browser event emitted after storage changes.
 */
function clearDraft(
  storageKey: string,
  legacyStorageKey: string,
  eventName: string
): void {
  if (!canUseDraftStorage()) {
    return;
  }

  try {
    clearDraftStorageFamily(storageKey, legacyStorageKey);
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
  saveDraft(
    CREATE_DRAFT_KEY,
    LEGACY_CREATE_DRAFT_KEY,
    CREATE_DRAFT_UPDATED_EVENT,
    draft,
    scope
  );
}

/**
 * Read the create-mode draft payload.
 *
 * @returns Stored create-mode draft or `null`.
 */
export function loadCreateDraft(scope?: string): MarkdownEditorDraft | null {
  return loadDraft(CREATE_DRAFT_KEY, LEGACY_CREATE_DRAFT_KEY, scope);
}

/**
 * Clear the create-mode draft payload.
 */
export function clearCreateDraft(scope?: string): void {
  void scope;

  clearDraft(
    CREATE_DRAFT_KEY,
    LEGACY_CREATE_DRAFT_KEY,
    CREATE_DRAFT_UPDATED_EVENT
  );
}

/**
 * Read the active create-mode draft regardless of the current route scope.
 *
 * @returns Stored create-mode draft record with optional scope metadata.
 */
export function peekCreateDraft(): MarkdownEditorStoredDraft | null {
  return peekStoredDraft(CREATE_DRAFT_KEY, LEGACY_CREATE_DRAFT_KEY);
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
  saveDraft(
    EDIT_DRAFT_KEY,
    LEGACY_EDIT_DRAFT_KEY,
    EDIT_DRAFT_UPDATED_EVENT,
    draft,
    scope
  );
}

/**
 * Read the edit-mode draft payload.
 *
 * @returns Stored edit-mode draft or `null`.
 */
export function loadEditDraft(scope?: string): MarkdownEditorDraft | null {
  return loadDraft(EDIT_DRAFT_KEY, LEGACY_EDIT_DRAFT_KEY, scope);
}

/**
 * Clear the edit-mode draft payload.
 */
export function clearEditDraft(scope?: string): void {
  void scope;

  clearDraft(EDIT_DRAFT_KEY, LEGACY_EDIT_DRAFT_KEY, EDIT_DRAFT_UPDATED_EVENT);
}

/**
 * Read the active edit-mode draft regardless of the current route scope.
 *
 * @returns Stored edit-mode draft record with optional scope metadata.
 */
export function peekEditDraft(): MarkdownEditorStoredDraft | null {
  return peekStoredDraft(EDIT_DRAFT_KEY, LEGACY_EDIT_DRAFT_KEY);
}
