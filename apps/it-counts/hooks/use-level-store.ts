import { create } from 'zustand'

import type { ActivityEntry, LevelState } from '@/types'
import { loadCurrentLevel, saveCurrentLevel } from '@/lib/storage'
import { getTodayString, getWeeksElapsedInLevel, parseLocalDate } from '@/lib/dates'
import { calculateOverXp, isLevelUpEligible } from '@/lib/levels'
import { sumLevelXpFromEntries } from '@/lib/xp'

export const LEVEL_ONE_START_DATE_LOCK_KEY = 'levelOneStartDateLocked'

export type SyncXpFromEntriesOptions = {
  /** Establishes and freezes the Level-1 anchor from the earliest known entry. */
  establishLevelOneAnchor?: boolean
}

/**
 * Builds a fresh default level state using today's date at call time,
 * avoiding a stale module-level constant.
 */
function createDefaultLevelState(): LevelState {
  return {
    level: 1,
    startDate: getTodayString(),
    levelStartAt: new Date().toISOString(),
    xp: 0,
    overXp: 0,
  }
}

/**
 * Returns the oldest logged calendar day, or `null` when there are no entries.
 */
function getEarliestEntryDate(entries: readonly ActivityEntry[]): string | null {
  let earliestDate: string | null = null

  for (const entry of entries) {
    if (earliestDate === null || entry.date < earliestDate) {
      earliestDate = entry.date
    }
  }

  return earliestDate
}

/**
 * Returns the device-local start of a persisted calendar day as an ISO string.
 */
function getLocalDayStartIso(date: string): string {
  return parseLocalDate(date).toISOString()
}

/**
 * Establishes the Level-1 anchor once from the earliest known entry when asked.
 * Later levels always keep the explicit level-up boundary unchanged.
 */
function getAnchoredLevelState(
  current: LevelState,
  entries: readonly ActivityEntry[],
  options?: SyncXpFromEntriesOptions,
): LevelState {
  if (current.level !== 1 || options?.establishLevelOneAnchor !== true) {
    return current
  }

  const earliestEntryDate = getEarliestEntryDate(entries)
  if (earliestEntryDate === null) {
    return current
  }

  const anchoredLevelStartAt = getLocalDayStartIso(earliestEntryDate)
  if (
    earliestEntryDate === current.startDate &&
    current.levelStartAt === anchoredLevelStartAt
  ) {
    return current
  }

  return {
    ...current,
    startDate: earliestEntryDate,
    levelStartAt: anchoredLevelStartAt,
  }
}

interface LevelStoreState {
  levelState: LevelState
  /**
   * Recomputes persisted level XP from activity entries: sum of daily XP for
   * each day in `[levelState.startDate, today]` (device-local dates).
   */
  syncXpFromEntries: (
    entries: ActivityEntry[],
    options?: SyncXpFromEntriesOptions,
  ) => void
  loadFromStorage: () => void
  triggerLevelUp: () => void
  isEligible: boolean
}

/**
 * Manages the current level progress.
 * `isEligible` is derived on every state change from XP + weeks elapsed.
 * Every mutation writes through to `lib/storage.ts` immediately.
 */
export const useLevelStore = create<LevelStoreState>()((set, get) => ({
  levelState: createDefaultLevelState(),
  isEligible: false,

  syncXpFromEntries: (entries, options) => {
    const current = get().levelState
    const normalized = getAnchoredLevelState(current, entries, options)
    const today = getTodayString()
    const nextXp = sumLevelXpFromEntries(
      entries,
      normalized.startDate,
      today,
      normalized.levelStartAt,
    )
    const weeksElapsed = getWeeksElapsedInLevel(normalized.startDate, today)
    const next: LevelState = {
      ...normalized,
      xp: nextXp,
      overXp: calculateOverXp(nextXp),
    }

    saveCurrentLevel(next)
    set({
      levelState: next,
      isEligible: isLevelUpEligible(nextXp, weeksElapsed),
    })
  },

  loadFromStorage: () => {
    const loaded = loadCurrentLevel()
    const state = loaded ?? createDefaultLevelState()
    const migratedState: LevelState = {
      ...state,
      levelStartAt: state.levelStartAt ?? getLocalDayStartIso(state.startDate),
    }
    const weeksElapsed = getWeeksElapsedInLevel(state.startDate, getTodayString())

    set({
      levelState: migratedState,
      isEligible: isLevelUpEligible(migratedState.xp, weeksElapsed),
    })
  },

  triggerLevelUp: () => {
    const current = get().levelState
    const today = getTodayString()
    const next: LevelState = {
      level: current.level + 1,
      startDate: today,
      levelStartAt: new Date().toISOString(),
      xp: 0,
      overXp: 0,
    }

    saveCurrentLevel(next)
    set({
      levelState: next,
      isEligible: false,
    })
  },
}))
