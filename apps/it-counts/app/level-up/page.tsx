'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { startVt } from '@bubbles/theme'
import { Button } from '@bubbles/ui/shadcn/button'

import { ConfettiBurst } from '@/components/level-up/confetti-burst'
import { useLevelStore } from '@/hooks/use-level-store'
import { LEVEL_DEFINITIONS } from '@/lib/levels'
import { getOverXpPace } from '@/lib/levels'

const PACE_LABELS = {
  'on-track': 'On track',
  'slightly-over': 'Slightly over',
  'well-over': 'Well over',
} as const

/**
 * Level-up celebration page. Accessible only when the user is eligible.
 * Ineligible visitors are redirected to the dashboard immediately.
 * Shows the completed-level summary and a single calm CTA to start the next level.
 */
export default function LevelUpPage() {
  const router = useRouter()
  const isEligible = useLevelStore((s) => s.isEligible)
  const levelState = useLevelStore((s) => s.levelState)
  const triggerLevelUp = useLevelStore((s) => s.triggerLevelUp)

  useEffect(() => {
    if (!isEligible) {
      router.replace('/')
    }
  }, [isEligible, router])

  if (!isEligible) {
    return null
  }

  const { level, xp, overXp } = levelState
  const nextLevel = level + 1
  const nextDefinition = LEVEL_DEFINITIONS.find((d) => d.level === nextLevel)
  const pace = getOverXpPace(overXp)

  /** Trigger the level-up state mutation and navigate home via View Transition. */
  function handleStartNextLevel() {
    triggerLevelUp()
    startVt(() => router.push('/'))
  }

  return (
    <div className="relative flex min-h-svh flex-col bg-background">
      <ConfettiBurst />

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center gap-6 px-4 py-12">
        <h1 className="font-heading text-3xl font-extrabold tracking-tight">
          Level {level} complete
        </h1>

        {/* Completed level summary */}
        <div className="w-full space-y-2 rounded-xl bg-muted/40 px-4 py-4 text-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Level {level} summary
          </p>
          <div className="flex items-baseline gap-1">
            <span className="font-heading text-4xl font-extrabold">{xp}</span>
            <span className="text-muted-foreground">XP total</span>
          </div>
          {overXp > 0 && (
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">+{overXp} XP over</span>
              {' · '}
              <span>{PACE_LABELS[pace]}</span>
            </p>
          )}
        </div>

        {/* Next level requirements */}
        {nextDefinition && (
          <div className="w-full space-y-3 rounded-xl bg-muted/40 px-4 py-4 text-sm">
            <p className="font-medium text-foreground">Level {nextLevel} requirements</p>
            <ul className="space-y-0.5 text-muted-foreground">
              {nextDefinition.requirements.map((req) => (
                <li key={req}>{req}</li>
              ))}
            </ul>

            <p className="font-medium text-foreground">Unlocked</p>
            <ul className="space-y-0.5 text-muted-foreground">
              {nextDefinition.unlockedAbilities.map((ability) => (
                <li key={ability}>{ability}</li>
              ))}
            </ul>
          </div>
        )}

        <Button size="lg" className="mt-4 h-12 w-full px-8 text-base font-semibold" onClick={handleStartNextLevel}>
          Start Level {nextLevel}
        </Button>
      </main>
    </div>
  )
}
