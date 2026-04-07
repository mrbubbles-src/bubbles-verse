'use client'

import { useActivityStore } from '@/hooks/use-activity-store'
import { useLevelStore } from '@/hooks/use-level-store'
import { getTodayString, getWeekStart, getWeeksElapsedInLevel } from '@/lib/dates'

/** Weekly XP target used for the motivational "Goal" display. */
const WEEKLY_XP_GOAL = 10

/**
 * Shows weeks elapsed in the current level and the weekly XP total
 * alongside the motivational 10 XP goal.
 *
 * Intentionally calm: no warning language when below target.
 */
export function WeeklySummary() {
  const startDate = useLevelStore((s) => s.levelState.startDate)
  const getWeeklyXp = useActivityStore((s) => s.getWeeklyXp)

  const today = getTodayString()
  const weekStart = getWeekStart(today)
  const weeksElapsed = getWeeksElapsedInLevel(startDate, today)
  const weeklyXp = getWeeklyXp(weekStart)

  return (
    <div className="flex w-full flex-col items-center gap-1 text-center">
      <p className="text-sm font-medium text-foreground">
        Week {weeksElapsed + 1} of 4+
      </p>
      <p className="text-sm text-muted-foreground">
        {weeklyXp} XP · Goal: {WEEKLY_XP_GOAL} XP
      </p>
    </div>
  )
}
