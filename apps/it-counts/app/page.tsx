import { LevelRequirements } from '@/components/dashboard/level-requirements';
import { LevelUpIndicator } from '@/components/dashboard/level-up-indicator';
import { SessionStartMessage } from '@/components/dashboard/session-start-message';
import { XpHero } from '@/components/dashboard/xp-hero';
import MainWrapper from '@/components/global/main-wrapper';

/**
 * Dashboard — full level overview with XP hero, weekly progress,
 * level requirements, contextual messaging, and the log CTA.
 */
export default function Home() {
  return (
    <>
      <MainWrapper>
        <SessionStartMessage />
        <XpHero />
        <LevelUpIndicator />
        <LevelRequirements />
      </MainWrapper>
    </>
  );
}
