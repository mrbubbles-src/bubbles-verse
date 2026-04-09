'use client'

import { useEffect } from 'react'

import { useActivityStore } from '@/hooks/use-activity-store'
import { useLevelStore } from '@/hooks/use-level-store'
import { useSettingsStore } from '@/hooks/use-settings-store'

/**
 * Hydrates activity, level, and settings stores from localStorage on mount.
 * Must be rendered as a client component inside the server layout.
 */
export function StoreHydrator() {
  const loadEntries = useActivityStore((s) => s.loadFromStorage)
  const loadLevel = useLevelStore((s) => s.loadFromStorage)
  const syncXpFromEntries = useLevelStore((s) => s.syncXpFromEntries)
  const loadSettings = useSettingsStore((s) => s.loadFromStorage)

  useEffect(() => {
    loadEntries()
    loadLevel()
    loadSettings()
    syncXpFromEntries(useActivityStore.getState().entries)
  }, [loadEntries, loadLevel, loadSettings, syncXpFromEntries])

  return null
}
