'use client'

import { useLevelStore } from '@/hooks/use-level-store'
import { LEVEL_DEFINITIONS } from '@/lib/levels'

/**
 * Displays the requirements and unlocked abilities for the user's current level.
 * Reads level definitions from the static `LEVEL_DEFINITIONS` array.
 */
export function LevelRequirements() {
  const level = useLevelStore((s) => s.levelState.level)
  const definition = LEVEL_DEFINITIONS.find((d) => d.level === level)

  if (!definition) {
    return null
  }

  return (
    <div className="w-full space-y-3 text-sm">
      <div>
        <p className="font-medium text-foreground">Requirements</p>
        <ul className="mt-1 space-y-0.5 text-muted-foreground">
          {definition.requirements.map((req) => (
            <li key={req}>{req}</li>
          ))}
        </ul>
      </div>
      <div>
        <p className="font-medium text-foreground">Unlocked</p>
        <ul className="mt-1 space-y-0.5 text-muted-foreground">
          {definition.unlockedAbilities.map((ability) => (
            <li key={ability}>{ability}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
