import { getOverXpPace, type OverXpPace } from '@/lib/levels'

/** Human-readable labels mapped from domain pace values. */
const PACE_LABELS: Record<OverXpPace, string> = {
  'on-track': 'On track',
  'slightly-over': 'Slightly over',
  'well-over': 'Well over',
}

/** Tailwind classes per pace — text + background, never color alone. */
const PACE_STYLES: Record<OverXpPace, string> = {
  'on-track':
    'border-ctp-latte-green/30 bg-ctp-latte-green/10 text-ctp-latte-green dark:border-ctp-mocha-green/30 dark:bg-ctp-mocha-green/10 dark:text-ctp-mocha-green',
  'slightly-over':
    'border-ctp-latte-teal/30 bg-ctp-latte-teal/10 text-ctp-latte-teal dark:border-ctp-mocha-teal/30 dark:bg-ctp-mocha-teal/10 dark:text-ctp-mocha-teal',
  'well-over':
    'border-ctp-latte-peach/30 bg-ctp-latte-peach/10 text-ctp-latte-peach dark:border-ctp-mocha-peach/30 dark:bg-ctp-mocha-peach/10 dark:text-ctp-mocha-peach',
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
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${PACE_STYLES[pace]}`}>
      {PACE_LABELS[pace]}
    </span>
  )
}
