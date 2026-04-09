import type { ActivityEntry } from '@/types'
import { calculateDailyXp } from '@/lib/xp'

/**
 * Renders one calendar day's worth of activity entries.
 * Entries are displayed in the order passed (caller ensures chronological).
 * Shows the date, individual entry durations, and the daily total.
 *
 * @param date - The calendar date string (YYYY-MM-DD) for this group's heading.
 * @param entries - All entries for this date, sorted chronologically by the caller.
 */
export function DailyGroup({ date, entries }: { date: string; entries: ActivityEntry[] }) {
  const totalMinutes = entries.reduce((sum, e) => sum + e.durationMin, 0)
  const dailyXp = calculateDailyXp(totalMinutes)

  return (
    <article className="w-full space-y-2 rounded-xl bg-muted/40 px-4 py-3 text-sm">
      <p className="font-medium text-foreground">{date}</p>

      <ul className="space-y-1">
        {entries.map((entry) => (
          <li key={entry.id} className="flex items-center justify-between text-muted-foreground">
            <span>{entry.durationMin} min</span>
            <span className="text-xs">{formatTime(entry.loggedAt)}</span>
          </li>
        ))}
      </ul>

      <p className="text-xs text-muted-foreground">
        {totalMinutes} min total · {dailyXp} XP
      </p>
    </article>
  )
}

/**
 * Formats an ISO timestamp to a local HH:MM time string.
 */
function formatTime(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
