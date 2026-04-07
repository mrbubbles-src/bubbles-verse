'use client'

import { useLevelStore } from '@/hooks/use-level-store'

const LEVEL_CAP = 100

/**
 * Linear progress toward 100 XP for the current level using `levelState.xp`
 * (aggregated daily XP across days in the level window). Fill caps at 100%.
 */
export function XpProgressBar() {
  const xp = useLevelStore((s) => s.levelState.xp)
  const fillPercent = Math.min(LEVEL_CAP, Math.max(0, xp))

  return (
    <div
      className="h-2 w-full max-w-[min(100%,20rem)] overflow-hidden rounded-full bg-muted"
      role="progressbar"
      aria-valuenow={xp}
      aria-valuemin={0}
      aria-valuemax={LEVEL_CAP}
      aria-label={`Level progress, ${xp} of ${LEVEL_CAP} XP`}>
      <div
        className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
        style={{ width: `${fillPercent}%` }}
      />
    </div>
  )
}
