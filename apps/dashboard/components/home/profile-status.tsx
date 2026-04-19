import type { DashboardHomeProfileStatus } from '@/lib/dashboard/home';

import Link from 'next/link';

import { Button } from '@bubbles/ui/shadcn/button';

type ProfileStatusProps = {
  profileStatus: DashboardHomeProfileStatus;
};

/**
 * Shows a compact profile completion nudge when the author profile is not done.
 *
 * Keep this lightweight and only render it for incomplete profiles so the home
 * does not keep repeating finished housekeeping work.
 */
export function ProfileStatus({ profileStatus }: ProfileStatusProps) {
  if (profileStatus.isComplete) {
    return null;
  }

  return (
    <section className="border-t border-border/60 pt-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold tracking-tight">
          Profil noch nicht vollständig
        </p>
        <p className="text-sm text-muted-foreground">
          {profileStatus.completedFields}/{profileStatus.totalFields}
        </p>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        {profileStatus.summary}
      </p>

      <Button
        render={<Link href={profileStatus.nextStepHref} />}
        nativeButton={false}
        variant="secondary"
        className="mt-3 w-fit rounded-full px-4">
        {profileStatus.nextStepLabel}
      </Button>
    </section>
  );
}
