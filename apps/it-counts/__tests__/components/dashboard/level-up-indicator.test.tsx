import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

const mockPush = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock('@bubbles/theme', () => ({
  startVt: vi.fn((cb: () => void) => cb()),
}))

vi.mock('@/hooks/use-level-store', () => ({
  useLevelStore: vi.fn((selector) =>
    selector({
      levelState: { level: 3, startDate: '2025-12-01', xp: 112, overXp: 12 },
      isEligible: true,
    })
  ),
}))

import { useLevelStore } from '@/hooks/use-level-store'
import { startVt } from '@bubbles/theme'
import { LevelUpIndicator } from '@/components/dashboard/level-up-indicator'

describe('LevelUpIndicator', () => {
  it('renders the CTA button when eligible', () => {
    render(<LevelUpIndicator />)
    expect(
      screen.getByRole('button', { name: /level 4 ready — level up/i })
    ).toBeInTheDocument()
  })

  it('shows the correct next level number', () => {
    render(<LevelUpIndicator />)
    expect(screen.getByText(/Level 4 ready/)).toBeInTheDocument()
  })

  it('is the only indicator — no banner, toast, or pulse', () => {
    const { container } = render(<LevelUpIndicator />)
    // No role=alert (toast/banner)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    // No animation classes that indicate urgency
    const button = container.querySelector('button')
    expect(button?.className).not.toMatch(/pulse|flash|blink/)
  })

  it('navigates to /level-up via startVt on click', () => {
    render(<LevelUpIndicator />)
    const button = screen.getByRole('button', { name: /level 4 ready/i })
    fireEvent.click(button)
    expect(startVt).toHaveBeenCalled()
    expect(mockPush).toHaveBeenCalledWith('/level-up')
  })

  it('renders nothing when not eligible', () => {
    vi.mocked(useLevelStore).mockImplementation((selector) =>
      selector({
        levelState: { level: 1, startDate: '2026-03-01', xp: 80, overXp: 0 },
        isEligible: false,
      })
    )
    const { container } = render(<LevelUpIndicator />)
    expect(container.firstChild).toBeNull()
  })

  it('shows no placeholder or hint when ineligible', () => {
    vi.mocked(useLevelStore).mockImplementation((selector) =>
      selector({
        levelState: { level: 1, startDate: '2026-03-01', xp: 50, overXp: 0 },
        isEligible: false,
      })
    )
    render(<LevelUpIndicator />)
    expect(screen.queryByText(/level up/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/ready/i)).not.toBeInTheDocument()
  })
})
