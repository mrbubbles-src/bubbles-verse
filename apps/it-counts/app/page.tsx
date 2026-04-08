import { Footer } from '@bubbles/footer';

import { BottomNav } from '@/components/dashboard/bottom-nav';
import { LevelRequirements } from '@/components/dashboard/level-requirements';
import { LevelUpIndicator } from '@/components/dashboard/level-up-indicator';
import { SessionStartMessage } from '@/components/dashboard/session-start-message';
import { XpHero } from '@/components/dashboard/xp-hero';
import { LogEntrySheet } from '@/components/logging/log-entry-sheet';

const LEGAL_LINKS = [
  { label: 'Impressum', href: 'https://mrbubbles-src.dev/de/impressum' },
  { label: 'Datenschutz', href: 'https://mrbubbles-src.dev/de/datenschutz' },
];

/**
 * Dashboard — full level overview with XP hero, weekly progress,
 * level requirements, contextual messaging, and the log CTA.
 */
export default function Home() {
  return (
    <>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 px-4 pb-8">
        <SessionStartMessage />
        <XpHero />
        <LevelUpIndicator />
        <LevelRequirements />
      </main>

      <BottomNav />
      <Footer links={LEGAL_LINKS} />
      <LogEntrySheet />
    </>
  );
}
