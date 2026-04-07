import { ThemeToggle } from '@bubbles/theme';

import { BottomNav } from '@/components/dashboard/bottom-nav';
import { LevelRequirements } from '@/components/dashboard/level-requirements';
import { SessionStartMessage } from '@/components/dashboard/session-start-message';
import { WeeklySummary } from '@/components/dashboard/weekly-summary';
import { XpHero } from '@/components/dashboard/xp-hero';
import { LogEntrySheet } from '@/components/logging/log-entry-sheet';

/**
 * Dashboard — full level overview with XP hero, weekly progress,
 * level requirements, contextual messaging, and the log CTA.
 */
export default function Home() {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="flex items-center justify-end px-4 py-3">
        <ThemeToggle />
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center gap-6 px-4 py-8">
        <XpHero />
        <WeeklySummary />
        <LevelRequirements />
        <SessionStartMessage />
        <LogEntrySheet />
      </main>

      <BottomNav />
    </div>
  );
}
