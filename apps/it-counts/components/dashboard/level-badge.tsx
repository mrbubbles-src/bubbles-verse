'use client'

import { useLevelStore } from '@/hooks/use-level-store'

/**
 * Inline badge showing the user's current level number.
 * Renders as a small, muted pill — secondary to the XP hero.
 */
export function LevelBadge() {
  const level = useLevelStore((s) => s.levelState.level)

  return (
    <span className="inline-flex items-center rounded-full bg-muted px-3 py-0.5 text-xs font-medium text-muted-foreground">
      Level {level}
    </span>
  )
}
