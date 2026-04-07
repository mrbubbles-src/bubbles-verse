/**
 * Represents one logged movement activity persisted for a calendar day.
 * Use `date` for device-local day grouping and `loggedAt` for precise ordering.
 */
export type ActivityEntry = {
  id: string
  date: string
  durationMin: number
  loggedAt: string
}

/**
 * Captures the user's current level progress and any surplus XP carried
 * beyond the unlock threshold.
 */
export type LevelState = {
  level: number
  startDate: string
  xp: number
  overXp: number
}

/**
 * Stores app-level preferences that need persistence.
 * The MVP intentionally keeps this shape open until settings stories land.
 */
export type AppSettings = Record<string, string | number | boolean | null>
