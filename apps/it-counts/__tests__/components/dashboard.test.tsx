import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('@bubbles/theme', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  ThemeToggle: () => <button aria-label="Toggle theme">theme</button>,
  useTheme: () => ({ resolvedTheme: 'dark', theme: 'dark', setTheme: vi.fn(), isHydrated: true }),
  startVt: vi.fn((cb: () => void) => cb()),
}))

vi.mock('@/hooks/use-level-store', () => ({
  useLevelStore: vi.fn((selector) =>
    selector({
      levelState: { level: 1, startDate: '2026-04-07', xp: 0, overXp: 0 },
      isEligible: false,
      syncXpFromEntries: vi.fn(),
      loadFromStorage: vi.fn(),
      triggerLevelUp: vi.fn(),
    })
  ),
}))

vi.mock('@/hooks/use-activity-store', () => ({
  useActivityStore: vi.fn((selector) =>
    selector({
      entries: [],
      addEntry: vi.fn(),
      addDurationEntry: vi.fn(() => ({
        entry: {
          id: 'entry-1',
          date: '2026-04-07',
          durationMin: 30,
          loggedAt: '2026-04-07T10:00:00.000Z',
        },
        xpEarned: 5,
        dailyXpToday: 5,
      })),
      loadFromStorage: vi.fn(),
      getDailyEntries: () => [],
      getDailyTotalMinutes: () => 0,
      getWeeklyEntries: () => [],
      getWeeklyXp: () => 0,
    })
  ),
}))

vi.mock('@/hooks/use-settings-store', () => ({
  useSettingsStore: vi.fn((selector) =>
    selector({
      settings: {},
      loadFromStorage: vi.fn(),
      getSetting: vi.fn(() => undefined),
      setSetting: vi.fn(),
    })
  ),
}))

vi.mock('@/lib/messages', () => ({
  getRandomMessage: vi.fn((context: string) =>
    context === 'session-start' ? 'Everything you logged before still counts today.' : 'That counted.'
  ),
}))

import Home from '@/app/page'

describe('Dashboard Shell', () => {
  it('renders the XP hero number', () => {
    render(<Home />)
    expect(screen.getByText(/0\s*\/\s*100\s*XP/)).toBeInTheDocument()
  })

  it('renders the Log Activity CTA', () => {
    render(<Home />)
    expect(
      screen.getByRole('button', { name: /log activity/i })
    ).toBeInTheDocument()
  })

  it('renders the bottom navigation with 3 items', () => {
    render(<Home />)
    const nav = screen.getByRole('navigation', { name: /main/i })
    const links = nav.querySelectorAll('a, button')
    expect(links.length).toBe(3)
  })

  it('renders Dashboard nav item', () => {
    render(<Home />)
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument()
  })

  it('renders History nav item', () => {
    render(<Home />)
    expect(screen.getByText(/history/i)).toBeInTheDocument()
  })

  it('uses single-column mobile layout with max-w-md on desktop', () => {
    const { container } = render(<Home />)
    const main = container.querySelector('main')
    expect(main?.className).toMatch(/max-w-md/)
  })
})
