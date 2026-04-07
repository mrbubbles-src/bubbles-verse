import type { ActivityEntry, AppSettings, LevelState } from '@/types'

const ENTRIES_KEY = 'it-counts:entries'
const CURRENT_LEVEL_KEY = 'it-counts:current-level'
const SETTINGS_KEY = 'it-counts:settings'

type StorageKey = typeof ENTRIES_KEY | typeof CURRENT_LEVEL_KEY | typeof SETTINGS_KEY
type JsonPrimitive = string | number | boolean | null
type JsonArray = JsonValue[]
type JsonObject = { [key: string]: JsonValue }
type JsonValue = JsonPrimitive | JsonArray | JsonObject
type JsonInput = JsonValue | undefined

/**
 * Reads from browser storage only when it is available.
 * Returns `null` during server rendering or when the storage API is blocked.
 */
function getStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    return window.localStorage
  } catch {
    return null
  }
}

/**
 * Parses a JSON storage payload and falls back to the provided default value
 * whenever the key is empty, malformed, or structurally invalid.
 */
function readJson<T extends JsonValue | null>(
  key: StorageKey,
  fallback: T,
  isValid: (value: JsonInput) => value is T,
): T {
  const storage = getStorage()

  if (!storage) {
    return fallback
  }

  let raw: string | null

  try {
    raw = storage.getItem(key)
  } catch {
    return fallback
  }

  if (raw === null) {
    return fallback
  }

  try {
    const parsed = JSON.parse(raw) as JsonValue
    return isValid(parsed) ? parsed : fallback
  } catch {
    return fallback
  }
}

/**
 * Persists a typed JSON payload for one app-owned storage key.
 * Silently skips writes when browser storage is unavailable.
 */
function writeJson<T>(key: StorageKey, value: T): void {
  const storage = getStorage()

  if (!storage) {
    return
  }

  try {
    storage.setItem(key, JSON.stringify(value))
  } catch {
    return
  }
}

/**
 * Checks whether a value is a plain object record.
 */
function isObjectRecord(value: JsonInput): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Validates a device-local calendar date stored as `YYYY-MM-DD`.
 */
function isLocalDateString(value: JsonInput): value is string {
  if (typeof value !== 'string' || /^\d{4}-\d{2}-\d{2}$/.test(value) === false) {
    return false
  }

  const parts = value.split('-')
  if (parts.length !== 3) {
    return false
  }

  const [yearString, monthString, dayString] = parts
  if (!yearString || !monthString || !dayString) {
    return false
  }

  const year = Number(yearString)
  const month = Number(monthString)
  const day = Number(dayString)

  if (
    Number.isInteger(year) === false ||
    Number.isInteger(month) === false ||
    Number.isInteger(day) === false
  ) {
    return false
  }

  const normalized = new Date(Date.UTC(year, month - 1, day))

  return (
    normalized.getUTCFullYear() === year &&
    normalized.getUTCMonth() === month - 1 &&
    normalized.getUTCDate() === day
  )
}

/**
 * Validates an ISO 8601 timestamp.
 */
function isIsoDateTimeString(value: JsonInput): value is string {
  return (
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})$/.test(
      value,
    ) &&
    Number.isNaN(Date.parse(value)) === false &&
    value.includes('T')
  )
}

/**
 * Validates one persisted activity entry.
 */
function isActivityEntry(value: JsonInput): value is ActivityEntry {
  if (!isObjectRecord(value)) {
    return false
  }

  return (
    typeof value.id === 'string' &&
    isLocalDateString(value.date) &&
    typeof value.durationMin === 'number' &&
    Number.isFinite(value.durationMin) &&
    value.durationMin >= 0 &&
    isIsoDateTimeString(value.loggedAt)
  )
}

/**
 * Validates the persisted collection of activity entries.
 */
function isActivityEntryArray(value: JsonInput): value is ActivityEntry[] {
  return Array.isArray(value) && value.every((entry) => isActivityEntry(entry))
}

/**
 * Validates one persisted level snapshot.
 */
function isLevelState(value: JsonInput): value is LevelState {
  if (!isObjectRecord(value)) {
    return false
  }

  return (
    typeof value.level === 'number' &&
    Number.isInteger(value.level) &&
    value.level >= 1 &&
    isLocalDateString(value.startDate) &&
    typeof value.xp === 'number' &&
    Number.isFinite(value.xp) &&
    value.xp >= 0 &&
    typeof value.overXp === 'number' &&
    Number.isFinite(value.overXp) &&
    value.overXp >= 0
  )
}

/**
 * Validates the MVP settings payload.
 */
function isAppSettings(value: JsonInput): value is AppSettings {
  if (!isObjectRecord(value)) {
    return false
  }

  return Object.values(value).every((entry) => {
    return (
      typeof entry === 'string' ||
      typeof entry === 'number' ||
      typeof entry === 'boolean' ||
      entry === null
    )
  })
}

/**
 * Loads all persisted activity entries.
 * Returns an empty array for first-run or malformed payloads.
 */
export function loadEntries(): ActivityEntry[] {
  return readJson(ENTRIES_KEY, [], isActivityEntryArray)
}

/**
 * Persists the full activity entry collection under the app namespace.
 */
export function saveEntries(entries: ActivityEntry[]): void {
  writeJson(ENTRIES_KEY, entries)
}

/**
 * Loads the current level state.
 * Returns `null` until the user has started a level or when stored data is invalid.
 */
export function loadCurrentLevel(): LevelState | null {
  return readJson<LevelState | null>(
    CURRENT_LEVEL_KEY,
    null,
    (value): value is LevelState | null => value === null || isLevelState(value),
  )
}

/**
 * Persists the current level state snapshot for later hydration.
 */
export function saveCurrentLevel(levelState: LevelState | null): void {
  writeJson(CURRENT_LEVEL_KEY, levelState)
}

/**
 * Loads persisted app settings.
 * Returns an empty object for first-run or malformed payloads.
 */
export function loadSettings(): AppSettings {
  return readJson(SETTINGS_KEY, {}, isAppSettings)
}

/**
 * Persists the app settings payload.
 */
export function saveSettings(settings: AppSettings): void {
  writeJson(SETTINGS_KEY, settings)
}
