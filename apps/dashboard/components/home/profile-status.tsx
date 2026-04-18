import type { DashboardHomeProfileStatus } from '@/lib/dashboard/home';

import Link from 'next/link';

import { Badge } from '@bubbles/ui/shadcn/badge';
import { Button } from '@bubbles/ui/shadcn/button';
import { Separator } from '@bubbles/ui/shadcn/separator';

type ProfileStatusProps = {
  profileStatus: DashboardHomeProfileStatus;
};

/**
 * Shows how complete the current author profile is and what still needs work.
 *
 * The home page uses this to nudge profile hygiene without forcing people into
 * the dedicated `/profile` screen first.
 */
export function ProfileStatus({ profileStatus }: ProfileStatusProps) {
  return (
    <section className="flex flex-col gap-4 rounded-[2rem] border border-border/50 bg-background/80 p-5 shadow-sm shadow-black/5">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-lg font-semibold tracking-tight">Profilstatus</p>
          <p className="text-sm text-pretty text-muted-foreground">
            {profileStatus.summary}
          </p>
        </div>
        <Badge variant="secondary">
          {profileStatus.completedFields}/{profileStatus.totalFields}
        </Badge>
      </div>

      <Separator />

      <div className="space-y-3">
        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
          <span>Slug: {profileStatus.slug ? `/${profileStatus.slug}` : 'offen'}</span>
          <span>•</span>
          <span>{profileStatus.socialLinkCount} Social Links</span>
        </div>

        <div className="flex flex-col gap-2">
          {profileStatus.checklist.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between gap-3 rounded-[1.25rem] border border-border/40 bg-muted/20 px-4 py-3">
              <span className="text-sm font-medium">{item.label}</span>
              <Badge variant={item.done ? 'default' : 'secondary'}>
                {item.done ? 'fertig' : 'offen'}
              </Badge>
            </div>
          ))}
        </div>
      </div>

      <Button
        render={<Link href={profileStatus.nextStepHref} />}
        nativeButton={false}
        className="justify-start rounded-full">
        {profileStatus.nextStepLabel}
      </Button>
    </section>
  );
}
