'use client'

import { useLevelStore } from '@/hooks/use-level-store'
import { OverXpIndicator } from '@/components/dashboard/over-xp-indicator'
import { StatusBadge } from '@/components/dashboard/status-badge'

/**
 * Shows the OverXP amount and pace label only when the user has exceeded the
 * 100-XP level threshold. Returns null when overXp is 0 to hide the section.
 */
export function OverXpSection() {
  const overXp = useLevelStore((s) => s.levelState.overXp)

  if (overXp <= 0) {
    return null
  }

  return (
    <div className="flex items-center gap-2">
      <OverXpIndicator overXp={overXp} />
      <StatusBadge overXp={overXp} />
    </div>
  )
}
