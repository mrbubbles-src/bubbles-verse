import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/hooks/use-level-store', () => ({
  useLevelStore: vi.fn((selector) =>
    selector({
      levelState: { level: 1, startDate: '2026-04-01', xp: 45, overXp: 0 },
      isEligible: false,
    })
  ),
}))

import { XpProgressBar } from '@/components/dashboard/xp-progress-bar'
import { XpHero } from '@/components/dashboard/xp-hero'

describe('XP Progress Bar — accessibility', () => {
  it('has role="progressbar"', () => {
    render(<XpProgressBar />)
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('has aria-valuenow matching current XP', () => {
    render(<XpProgressBar />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '45')
  })

  it('has aria-valuemin of 0 and aria-valuemax of 100', () => {
    render(<XpProgressBar />)
    const pb = screen.getByRole('progressbar')
    expect(pb).toHaveAttribute('aria-valuemin', '0')
    expect(pb).toHaveAttribute('aria-valuemax', '100')
  })

  it('has an accessible label', () => {
    render(<XpProgressBar />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-label')
  })

  it('inner fill uses motion-safe for transition to respect prefers-reduced-motion', () => {
    const { container } = render(<XpProgressBar />)
    const fill = container.querySelector('[style]')
    // The transition classes should only apply when motion is safe
    expect(fill?.className).toMatch(/motion-safe/)
  })
})

describe('XP Hero — accessibility', () => {
  it('has an aria-label on the XP number element', () => {
    const { container } = render(<XpHero />)
    const xpEl = container.querySelector('[aria-label]')
    expect(xpEl?.getAttribute('aria-label')).toMatch(/45 of 100 XP/i)
  })
})
