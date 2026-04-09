import type { ActivityEntry } from '@/types'
import { DailyGroup } from '@/components/history/daily-group'

/**
 * Formats a YYYY-MM-DD date string to a short "Mon D" label (e.g. "Apr 6").
 */
function formatShortDate(dateStr: string): string {
  const parts = dateStr.split('-')
  const year = Number(parts[0])
  const month = Number(parts[1])
  const day = Number(parts[2])
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Returns the Sunday that ends a Monday-anchored week.
 * Adds 6 days to the Monday start.
 */
function getWeekEnd(weekStart: string): string {
  const parts = weekStart.split('-')
  const year = Number(parts[0])
  const month = Number(parts[1])
  const day = Number(parts[2])
  const end = new Date(year, month - 1, day + 6)
  const y = end.getFullYear()
  const m = String(end.getMonth() + 1).padStart(2, '0')
  const d = String(end.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

type DayGroup = [date: string, entries: ActivityEntry[]]

/**
 * Renders one Monday–Sunday week section containing `DailyGroup` cards.
 * Shows the week date range and the total XP earned across all days in the week.
 *
 * @param weekStart - Monday of this week (YYYY-MM-DD).
 * @param days - `[date, entries[]]` pairs for this week, sorted chronologically.
 * @param weeklyXp - Total XP earned across all days in this week.
 */
export function WeeklyGroup({
  weekStart,
  days,
  weeklyXp,
}: {
  weekStart: string
  days: DayGroup[]
  weeklyXp: number
}) {
  const weekEnd = getWeekEnd(weekStart)

  return (
    <section aria-label={`Week of ${weekStart}`} className="w-full space-y-3">
      <div className="flex items-baseline justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {formatShortDate(weekStart)} – {formatShortDate(weekEnd)}
        </p>
        <p className="text-xs text-muted-foreground">{weeklyXp} XP</p>
      </div>

      {days.map(([date, entries]) => (
        <DailyGroup key={date} date={date} entries={entries} />
      ))}
    </section>
  )
}
