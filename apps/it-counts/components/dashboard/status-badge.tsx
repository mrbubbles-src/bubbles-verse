import { getOverXpPace, type OverXpPace } from '@/lib/levels'

/** Human-readable labels mapped from domain pace values. */
const PACE_LABELS: Record<OverXpPace, string> = {
  'on-track': 'On track',
  'slightly-over': 'Slightly over',
  'well-over': 'Well over',
}

/** Tailwind classes per pace — text + background, never color alone. */
const PACE_STYLES: Record<OverXpPace, string> = {
  'on-track': 'bg-muted text-muted-foreground',
  'slightly-over': 'bg-muted text-ctp-latte-teal dark:text-ctp-mocha-teal',
  'well-over': 'bg-muted text-ctp-latte-peach dark:text-ctp-mocha-peach',
}

/**
 * Displays the current overXP pace as a labeled badge.
 * Uses both text and color so meaning is never conveyed by color alone.
 *
 * @param overXp - Surplus XP above 100. Drives pace classification.
 */
export function StatusBadge({ overXp }: { overXp: number }) {
  const pace = getOverXpPace(overXp)

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-0.5 text-xs font-medium ${PACE_STYLES[pace]}`}>
      {PACE_LABELS[pace]}
    </span>
  )
}
