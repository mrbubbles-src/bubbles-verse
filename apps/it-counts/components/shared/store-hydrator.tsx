'use client'

import { useEffect, useRef } from 'react'

import { useActivityStore } from '@/hooks/use-activity-store'
import { useLevelStore } from '@/hooks/use-level-store'
import { useSettingsStore } from '@/hooks/use-settings-store'

/**
 * Hydrates activity, level, and settings stores from localStorage on mount.
 * Must be rendered as a client component inside the server layout.
 */
export function StoreHydrator() {
  const loadEntries = useActivityStore((s) => s.loadFromStorage)
  const entries = useActivityStore((s) => s.entries)
  const loadLevel = useLevelStore((s) => s.loadFromStorage)
  const syncXpFromEntries = useLevelStore((s) => s.syncXpFromEntries)
  const loadSettings = useSettingsStore((s) => s.loadFromStorage)
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

    syncXpFromEntries(entries)
  }, [entries, syncXpFromEntries])

  return null
}
