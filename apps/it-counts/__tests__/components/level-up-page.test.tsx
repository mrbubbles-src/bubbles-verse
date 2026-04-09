import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'

const mockPush = vi.fn()
const mockReplace = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}))

vi.mock('@bubbles/theme', () => ({
  startVt: vi.fn((cb: () => void) => cb()),
}))

const mockTriggerLevelUp = vi.fn()

vi.mock('@/hooks/use-level-store', () => ({
  useLevelStore: vi.fn((selector) =>
    selector({
      levelState: { level: 2, startDate: '2025-12-01', xp: 115, overXp: 15 },
      isEligible: true,
      triggerLevelUp: mockTriggerLevelUp,
    })
  ),
}))

import { useLevelStore } from '@/hooks/use-level-store'
import { startVt } from '@bubbles/theme'
import LevelUpPage from '@/app/level-up/page'

const eligibleState = {
  levelState: { level: 2, startDate: '2025-12-01', xp: 115, overXp: 15 },
  isEligible: true,
  triggerLevelUp: mockTriggerLevelUp,
}

describe('LevelUpPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useLevelStore).mockImplementation((selector) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      selector(eligibleState as any)
    )
  })

  it('redirects to dashboard when not eligible', () => {
    vi.mocked(useLevelStore).mockImplementation((selector) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      selector({ levelState: { level: 1, startDate: '2026-03-01', xp: 80, overXp: 0 }, isEligible: false, triggerLevelUp: mockTriggerLevelUp } as any)
    )
    render(<LevelUpPage />)
    expect(mockReplace).toHaveBeenCalledWith('/')
  })

  it('renders the completed level summary when eligible', () => {
    render(<LevelUpPage />)
    expect(screen.getByRole('heading', { name: /Level 2 complete/i })).toBeInTheDocument()
  })

  it('shows total XP earned', () => {
    render(<LevelUpPage />)
    expect(screen.getByText(/115/)).toBeInTheDocument()
  })

  it('shows OverXP amount', () => {
    render(<LevelUpPage />)
    expect(screen.getByText(/\+15/)).toBeInTheDocument()
  })

  it('shows pace indicator', () => {
    render(<LevelUpPage />)
    // overXp: 15 → "Slightly over"
    expect(screen.getByText(/Slightly over/i)).toBeInTheDocument()
  })

  it('shows next level requirements', () => {
    render(<LevelUpPage />)
    // Level 3 requirements from LEVEL_DEFINITIONS
    expect(screen.getByText(/12 XP per week/i)).toBeInTheDocument()
  })

  it('shows next level unlocked abilities', () => {
    render(<LevelUpPage />)
    expect(screen.getByText(/Higher weekly target/i)).toBeInTheDocument()
  })

  it('renders the Start Level CTA button with correct label', () => {
    render(<LevelUpPage />)
    expect(
      screen.getByRole('button', { name: /start level 3/i })
    ).toBeInTheDocument()
  })

  it('calls triggerLevelUp and navigates to dashboard on CTA click', () => {
    render(<LevelUpPage />)
    const btn = screen.getByRole('button', { name: /start level 3/i })
    fireEvent.click(btn)
    expect(mockTriggerLevelUp).toHaveBeenCalledTimes(1)
    expect(startVt).toHaveBeenCalled()
    expect(mockPush).toHaveBeenCalledWith('/')
  })
})
