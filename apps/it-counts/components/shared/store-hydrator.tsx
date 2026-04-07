'use client'

import { useEffect } from 'react'

import { useActivityStore } from '@/hooks/use-activity-store'
import { useLevelStore } from '@/hooks/use-level-store'

/**
 * Hydrates activity and level stores from localStorage on mount.
 * Must be rendered as a client component inside the server layout.
 */
export function StoreHydrator() {
  const loadEntries = useActivityStore((s) => s.loadFromStorage)
  const loadLevel = useLevelStore((s) => s.loadFromStorage)

  useEffect(() => {
    loadEntries()
    loadLevel()
  }, [loadEntries, loadLevel])

  return null
}
