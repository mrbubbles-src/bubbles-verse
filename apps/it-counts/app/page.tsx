import { ThemeToggle } from '@bubbles/theme';

import { BottomNav } from '@/components/dashboard/bottom-nav';
import { LogEntrySheet } from '@/components/logging/log-entry-sheet';
import { SessionStartMessage } from '@/components/dashboard/session-start-message';
import { XpHero } from '@/components/dashboard/xp-hero';

/**
 * Dashboard shell — typography-led hero layout.
 * Shows the XP number prominently, a single "Log Activity" CTA,
 * and a bottom navigation pinned via flex layout.
 */
export default function Home() {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="flex items-center justify-end px-4 py-3">
        <ThemeToggle />
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4">
        <XpHero />
        <SessionStartMessage />
        <LogEntrySheet />
      </main>

      <BottomNav />
    </div>
  );
}
