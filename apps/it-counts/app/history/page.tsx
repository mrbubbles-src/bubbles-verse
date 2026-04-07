'use client'

import { useMemo } from 'react'

import { BottomNav } from '@/components/dashboard/bottom-nav'
import { WeeklyGroup } from '@/components/history/weekly-group'
import { useActivityStore } from '@/hooks/use-activity-store'
import { getWeekStart } from '@/lib/dates'
import { calculateDailyXp } from '@/lib/xp'
import type { ActivityEntry } from '@/types'

type DayGroup = [date: string, entries: ActivityEntry[]]
type WeekData = { days: DayGroup[]; weeklyXp: number }

/**
 * Activity history page: entries grouped by week then by day.
 * Weeks are shown newest-first; days within a week oldest-first; entries within a day oldest-first.
 * Days with no entries are omitted. Empty state is shown when there are no entries at all.
 */
export default function HistoryPage() {
  const entries = useActivityStore((s) => s.entries)

  const groupedWeeks = useMemo(() => {
    // 1. Group entries by date, sort entries within a day chronologically
    const byDate = new Map<string, ActivityEntry[]>()
    for (const entry of entries) {
      const day = byDate.get(entry.date) ?? []
      day.push(entry)
      byDate.set(entry.date, day)
    }
    for (const day of byDate.values()) {
      day.sort((a, b) => a.loggedAt.localeCompare(b.loggedAt))
    }

    // 2. Group dates by week start (Monday)
    const byWeek = new Map<string, DayGroup[]>()
    for (const [date, dayEntries] of byDate.entries()) {
      const weekStart = getWeekStart(date)
      const week = byWeek.get(weekStart) ?? []
      week.push([date, dayEntries])
      byWeek.set(weekStart, week)
    }

    // 3. Sort days within each week reverse-chronologically (newest first)
    for (const week of byWeek.values()) {
      week.sort(([a], [b]) => b.localeCompare(a))
    }

    // 4. Sort weeks reverse-chronologically (newest first) and compute weekly XP
    return [...byWeek.entries()]
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([weekStart, days]): [string, WeekData] => {
        const weeklyXp = days.reduce((sum, [, dayEntries]) => {
          const minutes = dayEntries.reduce((m, e) => m + e.durationMin, 0)
          return sum + calculateDailyXp(minutes)
        }, 0)
        return [weekStart, { days, weeklyXp }]
      })
  }, [entries])

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-8">
        <h1 className="font-heading text-2xl font-extrabold tracking-tight">History</h1>

        {groupedWeeks.length === 0 ? (
          <p className="text-muted-foreground">
            Nothing logged yet. Your history will appear here.
          </p>
        ) : (
          groupedWeeks.map(([weekStart, { days, weeklyXp }]) => (
            <WeeklyGroup
              key={weekStart}
              weekStart={weekStart}
              days={days}
              weeklyXp={weeklyXp}
            />
          ))
        )}
      </main>

      <BottomNav />
    </div>
  )
}
