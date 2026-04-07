'use client'

import { useLevelStore } from '@/hooks/use-level-store'

const LEVEL_CAP = 100

/**
 * Linear progress toward 100 XP for the current level using `levelState.xp`
 * (aggregated daily XP across days in the level window). Fill caps at 100%.
 */
export function XpProgressBar() {
  const xp = useLevelStore((s) => s.levelState.xp)
  const clampedXp = Math.min(LEVEL_CAP, Math.max(0, xp))

  return (
    <div
      className="h-2 w-full max-w-[min(100%,20rem)] overflow-hidden rounded-full bg-muted"
      role="progressbar"
      aria-valuenow={clampedXp}
      aria-valuemin={0}
      aria-valuemax={LEVEL_CAP}
      aria-label={`Level progress, ${clampedXp} of ${LEVEL_CAP} XP`}>
      <div
        className="h-full rounded-full motion-safe:transition-[width] motion-safe:duration-300 motion-safe:ease-out"
        style={{
          width: `${clampedXp}%`,
          background: 'linear-gradient(to right, oklch(0.6 0.15 240), oklch(0.65 0.12 280))',
        }}
      />
    </div>
  )
}
