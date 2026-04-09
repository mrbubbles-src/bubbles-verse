import type { Metadata } from 'next';

import { LEVEL_DEFINITIONS } from '@/lib/levels';
import { XP_TIERS } from '@/lib/xp';

import MainWrapper from '@/components/global/main-wrapper';

export const metadata: Metadata = {
  title: 'About',
};

/**
 * About page explaining the It Counts concept, XP system, and level rules.
 * Also hosts the footer with legal links (moved from the dashboard).
 */
export default function AboutPage() {
  return (
    <MainWrapper>
      <section className="flex flex-col gap-3">
        <h1 className="font-heading text-2xl font-extrabold tracking-tight">
          About It Counts{' '}
          <span className="text-xs text-muted-foreground/70 ">(v1.0.0)</span>
        </h1>
        <p className="text-sm/relaxed text-muted-foreground">
          It Counts is a walking and movement tracker built around a simple
          idea:{' '}
          <span className="font-semibold text-primary">
            every minute of movement matters
          </span>
          . Log your daily walking minutes, earn XP, and level up over time.
        </p>
        <p className="text-sm/relaxed text-muted-foreground">
          No streaks, no punishment for missing a day. Just consistent effort
          that adds up.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-lg font-bold">How XP Works</h2>
        <p className="text-sm/relaxed text-muted-foreground">
          Each day you walk, your total minutes determine your daily XP. The
          tiers are fixed — once you hit a threshold, you earn that tier&apos;s
          XP for the day.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {[...XP_TIERS].reverse().map((tier) => (
            <div
              key={tier.minimumMinutes}
              className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-sm">
              <span className="text-muted-foreground">
                {tier.minimumMinutes}+ min
              </span>
              <span className="font-semibold">{tier.xp} XP</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground/70">
          Daily cap: 5 XP at 30+ minutes. Multiple logs per day are aggregated.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-lg font-bold">Levels</h2>
        <p className="text-sm/relaxed text-muted-foreground">
          Earn 100 XP and stay active for at least 4 weeks to unlock the next
          level. Each level shifts the focus slightly.
        </p>
        <div className="flex flex-col gap-3">
          {LEVEL_DEFINITIONS.map((def) => (
            <div
              key={def.level}
              className="flex flex-col gap-1 rounded-lg border border-border bg-card px-4 py-3">
              <h3 className="text-sm font-semibold">Level {def.level}</h3>
              <p className="text-xs text-muted-foreground">
                {def.requirements.join(' ')}
              </p>
              {def.weeklyXpTarget && (
                <p className="text-xs font-medium text-primary">
                  Weekly target: {def.weeklyXpTarget} XP
                </p>
              )}
              <p className="text-xs text-muted-foreground/70">
                Unlocked: {def.unlockedAbilities.join(', ')}
              </p>
            </div>
          ))}
          <p className="text-xs text-muted-foreground/70">
            More levels will be added in the future.
          </p>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-lg font-bold">Progression Rules</h2>
        <ul className="list-inside list-disc space-y-1 text-sm/relaxed text-muted-foreground">
          <li>100 XP required to unlock level-up</li>
          <li>Minimum 4 weeks at each level</li>
          <li>Both conditions must be met — whichever takes longer</li>
          <li>Surplus XP beyond 100 is tracked as OverXP</li>
          <li>
            OverXP does not carry over as a head start toward the next
            level&apos;s 100 XP requirement.
          </li>
          <li>[TODO] OverXP affects the difficulty of the next level.</li>
        </ul>
      </section>
    </MainWrapper>
  );
}
