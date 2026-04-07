'use client'

import { useRouter } from 'next/navigation'

import { startVt } from '@bubbles/theme'
import { Button } from '@bubbles/ui/shadcn/button'

import { useLevelStore } from '@/hooks/use-level-store'

/**
 * Renders a calm level-up CTA button when the user is eligible to advance.
 * Eligibility is derived from the level store (`isEligible`).
 * Returns null when the user is not yet eligible — no placeholder or hint.
 */
export function LevelUpIndicator() {
  const router = useRouter()
  const isEligible = useLevelStore((s) => s.isEligible)
  const level = useLevelStore((s) => s.levelState.level)

  if (!isEligible) {
    return null
  }

  /** Navigate to the level-up page inside a View Transition. */
  function handleClick() {
    startVt(() => router.push('/level-up'))
  }

  return (
    <Button variant="outline" size="lg" onClick={handleClick}>
      Level {level + 1} ready — Level Up →
    </Button>
  )
}
