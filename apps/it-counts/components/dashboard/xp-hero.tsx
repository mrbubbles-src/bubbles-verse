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
import type { ActivityEntry } from '@/types';

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

  const todayRows = useMemo(() => {
    const todayEntries = entries
      .filter((entry) => entry.date === today)
      .sort((a, b) => a.loggedAt.localeCompare(b.loggedAt));

    let runningMinutes = 0;
    let previousXp = 0;

    return todayEntries.map((entry): { entry: ActivityEntry; gainedXp: number } => {
      runningMinutes += entry.durationMin;
      const currentXp = calculateDailyXp(runningMinutes);
      const gainedXp = Math.max(0, currentXp - previousXp);
      previousXp = currentXp;
      return { entry, gainedXp };
    });
  }, [entries, today]);

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
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Today
        </p>

        {todayRows.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No entries yet today.</p>
        ) : (
          <ul className="mt-2 space-y-3">
            {todayRows.map(({ entry, gainedXp }) => (
              <li key={entry.id} className="flex items-center justify-between">
                <div>
                  <p className="text-base font-semibold text-foreground">{entry.durationMin} min</p>
                  <p className="text-sm text-muted-foreground">{formatTime(entry.loggedAt)}</p>
                </div>
                <p className="text-sm font-semibold text-ctp-latte-blue dark:text-ctp-mocha-blue">
                  +{gainedXp} XP
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
