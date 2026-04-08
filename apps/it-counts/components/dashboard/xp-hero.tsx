'use client';

import { useMemo } from 'react';

import { useActivityStore } from '@/hooks/use-activity-store';
import { OverXpSection } from '@/components/dashboard/over-xp-section';
import { WeeklySummary } from '@/components/dashboard/weekly-summary';
import { XpProgressBar } from '@/components/dashboard/xp-progress-bar';
import { useLevelStore } from '@/hooks/use-level-store';
import { getTodayString, getWeeksElapsedInLevel } from '@/lib/dates';
import { calculateDailyXp } from '@/lib/xp';
import { StatusBadge } from '@/components/dashboard/status-badge';

/**
 * Displays the primary "Typography Hero" dashboard composition:
 * level context, dominant XP number, progress bar, and immediate meta context.
 * Keeps key progress signals visually adjacent so users parse state at a glance.
 */
export function XpHero() {
  const xp = useLevelStore((s) => s.levelState.xp);
  const overXp = useLevelStore((s) => s.levelState.overXp);
  const level = useLevelStore((s) => s.levelState.level);
  const startDate = useLevelStore((s) => s.levelState.startDate);
  const entries = useActivityStore((s) => s.entries);
  const xpToGo = Math.max(0, 100 - xp);
  const today = getTodayString();
  const weeksElapsed = getWeeksElapsedInLevel(startDate, today);

  const todayEntries = useMemo(() => {
    return entries
      .filter((entry) => entry.date === today)
      .sort((a, b) => a.loggedAt.localeCompare(b.loggedAt));
  }, [entries, today]);

  const todayTotalMin = todayEntries.reduce((sum, e) => sum + e.durationMin, 0);
  const todayXp = calculateDailyXp(todayTotalMin);

  return (
    <section className="w-full">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        Level {level} · Week {weeksElapsed + 1} of 4
      </p>

      <div className="mt-2 flex items-baseline gap-2" aria-label={`${xp} of 100 XP`}>
        <span className="font-heading text-[clamp(4rem,11vw,5rem)] font-extrabold leading-[0.95] tracking-tight text-foreground">
          {xp}
        </span>
        <span className="text-base font-medium text-muted-foreground">
          / 100 XP
        </span>
      </div>

      <div className="mt-3">
        <XpProgressBar />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center rounded-full border border-border/70 bg-muted/60 px-3 py-1 text-xs font-medium text-muted-foreground">
          {xpToGo} XP to go
        </span>
        <StatusBadge overXp={overXp} />
      </div>

      <div className="mt-6">
        <OverXpSection />
        <WeeklySummary />
      </div>

      <div className="mt-6">
        <div className="flex items-baseline justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Today
          </p>
          {todayEntries.length > 0 && (
            <p className="text-sm font-semibold text-primary">
              {todayTotalMin} min · {todayXp} XP
            </p>
          )}
        </div>

        {todayEntries.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No entries yet today.</p>
        ) : (
          <div className="mt-2 grid grid-cols-3 gap-2">
            {todayEntries.map((entry) => (
              <span
                key={entry.id}
                className="inline-flex items-center justify-center gap-1.5 rounded-full border border-border/70 bg-muted/40 px-3 py-1 text-xs font-medium text-foreground">
                {entry.durationMin} min
                <span className="text-muted-foreground">{formatTime(entry.loggedAt)}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
