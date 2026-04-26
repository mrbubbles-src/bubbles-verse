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
    <section className="dashboard-studio-panel-flat px-4 py-5 sm:px-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-base font-semibold tracking-tight sm:text-lg">
          Profil noch nicht vollständig
        </p>
        <p className="text-base text-muted-foreground">
          {profileStatus.completedFields}/{profileStatus.totalFields}
        </p>
      </div>
      <p className="mt-2 text-base text-muted-foreground">
        {profileStatus.summary}
      </p>

      <Button
        render={<Link href={profileStatus.nextStepHref} />}
        nativeButton={false}
        variant="secondary"
        className="mt-4 w-fit rounded-full px-5">
        {profileStatus.nextStepLabel}
      </Button>
    </section>
  );
}
