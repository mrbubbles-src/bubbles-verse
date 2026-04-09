import { describe, expect, it } from 'vitest'

import { sumLevelXpFromEntries } from '@/lib/xp'
import type { ActivityEntry } from '@/types'

describe('sumLevelXpFromEntries', () => {
  it('sums one daily XP per calendar day from aggregated minutes', () => {
    const entries: ActivityEntry[] = [
      {
        id: '1',
        date: '2026-04-07',
        durationMin: 10,
        loggedAt: '2026-04-07T08:00:00Z',
      },
      {
        id: '2',
        date: '2026-04-07',
        durationMin: 5,
        loggedAt: '2026-04-07T09:00:00Z',
      },
      {
        id: '3',
        date: '2026-04-07',
        durationMin: 15,
        loggedAt: '2026-04-07T10:00:00Z',
      },
    ]

    expect(
      sumLevelXpFromEntries(entries, '2026-04-07', '2026-04-07'),
    ).toBe(5)
  })

  it('adds XP across multiple days in the window', () => {
    const entries: ActivityEntry[] = [
      {
        id: 'a',
        date: '2026-04-06',
        durationMin: 30,
        loggedAt: '2026-04-06T08:00:00Z',
      },
      {
        id: 'b',
        date: '2026-04-07',
        durationMin: 10,
        loggedAt: '2026-04-07T08:00:00Z',
      },
    ]

    expect(
      sumLevelXpFromEntries(entries, '2026-04-06', '2026-04-07'),
    ).toBe(7)
  })

  it('excludes entries outside the inclusive date range', () => {
    const entries: ActivityEntry[] = [
      {
        id: 'old',
        date: '2026-04-05',
        durationMin: 120,
        loggedAt: '2026-04-05T08:00:00Z',
      },
      {
        id: 'in',
        date: '2026-04-07',
        durationMin: 30,
        loggedAt: '2026-04-07T08:00:00Z',
      },
    ]

    expect(
      sumLevelXpFromEntries(entries, '2026-04-07', '2026-04-07'),
    ).toBe(5)
  })
})
