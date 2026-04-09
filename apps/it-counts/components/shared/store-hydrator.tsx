'use client'

import { useEffect, useRef } from 'react'

import { useActivityStore } from '@/hooks/use-activity-store'
import { LEVEL_ONE_START_DATE_LOCK_KEY, useLevelStore } from '@/hooks/use-level-store'
import { useSettingsStore } from '@/hooks/use-settings-store'

/**
 * Hydrates activity, level, and settings stores from localStorage on mount.
 * Must be rendered as a client component inside the server layout.
 */
export function StoreHydrator() {
  const loadEntries = useActivityStore((s) => s.loadFromStorage)
  const entries = useActivityStore((s) => s.entries)
  const loadLevel = useLevelStore((s) => s.loadFromStorage)
  const currentLevel = useLevelStore((s) => s.levelState.level)
  const syncXpFromEntries = useLevelStore((s) => s.syncXpFromEntries)
  const loadSettings = useSettingsStore((s) => s.loadFromStorage)
  const levelOneStartDateLocked = useSettingsStore(
    (s) => s.settings[LEVEL_ONE_START_DATE_LOCK_KEY] === true,
  )
  const setSetting = useSettingsStore((s) => s.setSetting)
  const skipInitialEntriesSyncRef = useRef(true)

  useEffect(() => {
    loadEntries()
    loadLevel()
    loadSettings()
  }, [loadEntries, loadLevel, loadSettings])

  useEffect(() => {
    // Skip the store default `[]` snapshot on first mount so we only persist
    // level XP after the activity store has finished hydrating from storage.
    if (skipInitialEntriesSyncRef.current) {
      skipInitialEntriesSyncRef.current = false
      return
    }

    const shouldEstablishLevelOneAnchor =
      currentLevel === 1 &&
      levelOneStartDateLocked === false &&
      entries.length > 0

    syncXpFromEntries(
      entries,
      shouldEstablishLevelOneAnchor
        ? { establishLevelOneAnchor: true }
        : undefined,
    )

    if (shouldEstablishLevelOneAnchor) {
      setSetting(LEVEL_ONE_START_DATE_LOCK_KEY, true)
    }
  }, [
    currentLevel,
    entries,
    levelOneStartDateLocked,
    setSetting,
    syncXpFromEntries,
  ])

  return null
}
