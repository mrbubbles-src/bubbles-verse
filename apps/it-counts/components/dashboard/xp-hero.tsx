'use client';

import { XpProgressBar } from '@/components/dashboard/xp-progress-bar';
import { useLevelStore } from '@/hooks/use-level-store';

/**
 * Displays the current XP as a large typographic hero element.
 * Montserrat 800, 64–80px — the dominant visual anchor of the dashboard.
 */
export function XpHero() {
  const xp = useLevelStore((s) => s.levelState.xp);

  return (
    <div className="flex w-full flex-col items-center gap-4 py-12">
      <span
        className="font-heading text-[clamp(4rem,10vw,5rem)] font-extrabold leading-none tracking-tight"
        aria-label={`${xp} of 100 XP`}>
        {xp} / 100 XP
      </span>
      <XpProgressBar />
    </div>
  );
}
