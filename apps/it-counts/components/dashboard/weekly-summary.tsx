'use client'

import { useMemo } from 'react'

import { useActivityStore } from '@/hooks/use-activity-store'
import { getTodayString, getWeekStart } from '@/lib/dates'
import { calculateDailyXp } from '@/lib/xp'

/** Weekly XP target used for the motivational "Goal" display. */
const WEEKLY_XP_GOAL = 10

/**
 * Shows the weekly XP total alongside the motivational 10 XP goal.
 * Intentionally calm: no warning language when below target.
 */
export function WeeklySummary() {
  const entries = useActivityStore((s) => s.entries)

  const today = getTodayString()
  const weekStart = getWeekStart(today)
  const weeklyXp = useMemo(() => {
    const minutesByDate = new Map<string, number>()
    for (const entry of entries) {
      if (getWeekStart(entry.date) !== weekStart) continue
      minutesByDate.set(entry.date, (minutesByDate.get(entry.date) ?? 0) + entry.durationMin)
    }

    let sum = 0
    for (const minutes of minutesByDate.values()) {
      sum += calculateDailyXp(minutes)
    }
    return sum
  }, [entries, weekStart])

  const xpToTarget = Math.max(0, WEEKLY_XP_GOAL - weeklyXp)
  const targetLabel = xpToTarget === 0 ? 'Goal reached' : `${xpToTarget} more to target`

  return (
    <div className="w-full space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        This week
      </p>
      <div className="flex items-end justify-between gap-3">
        <p className="font-heading text-[2rem] font-extrabold leading-none text-foreground">
          {weeklyXp}
          <span className="ml-1 text-xs font-medium text-muted-foreground">
            / {WEEKLY_XP_GOAL} XP target
          </span>
        </p>
        <span className="inline-flex items-center rounded-full border border-border/70 bg-muted/60 px-3 py-1 text-xs font-medium text-muted-foreground">
          {targetLabel}
        </span>
      </div>
    </div>
  )
}
