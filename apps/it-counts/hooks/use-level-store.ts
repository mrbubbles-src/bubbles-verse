import { create } from 'zustand'

import type { ActivityEntry, LevelState } from '@/types'
import { loadCurrentLevel, saveCurrentLevel } from '@/lib/storage'
import { getTodayString, getWeeksElapsedInLevel } from '@/lib/dates'
import { calculateOverXp, isLevelUpEligible } from '@/lib/levels'
import { sumLevelXpFromEntries } from '@/lib/xp'

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

interface LevelStoreState {
  levelState: LevelState
  /**
   * Recomputes persisted level XP from activity entries: sum of daily XP for
   * each day in `[levelState.startDate, today]` (device-local dates).
   */
  syncXpFromEntries: (entries: ActivityEntry[]) => void
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

  syncXpFromEntries: (entries) => {
    const current = get().levelState
    const today = getTodayString()
    const nextXp = sumLevelXpFromEntries(
      entries,
      current.startDate,
      today,
      current.levelStartAt,
    )
    const weeksElapsed = getWeeksElapsedInLevel(current.startDate, today)
    const next: LevelState = {
      ...current,
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
      levelStartAt: state.levelStartAt ?? `${state.startDate}T00:00:00.000Z`,
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
