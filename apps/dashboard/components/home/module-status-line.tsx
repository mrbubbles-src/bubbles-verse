import type { DashboardHomeSummary } from '@/lib/dashboard/home';

import Link from 'next/link';

import {
  ArrowRight01Icon,
  Folder01Icon,
  HugeiconsIcon,
  Notebook01Icon,
} from '@bubbles/ui/lib/hugeicons';
import { Separator } from '@bubbles/ui/shadcn/separator';

type ModuleStatusLineProps = {
  summaries: DashboardHomeSummary[];
};

/**
 * Renders the dashboard app status rail from the command-center mockup.
 *
 * Use this in the desktop aside so each app gets one calm status block with
 * compact operational numbers instead of another grid of cards.
 *
 * @param props App summaries with compact draft and published counts.
 * @returns App status rail for the dashboard landing page.
 */
export function ModuleStatusLine({ summaries }: ModuleStatusLineProps) {
  if (summaries.length === 0) {
    return null;
  }

  return (
    <aside className="flex flex-col gap-10 px-1 py-1">
      <div className="flex items-center justify-between gap-3">
        <p className="dashboard-kicker">Apps</p>
        <span className="dashboard-meta tabular-nums">{summaries.length}</span>
      </div>
      <div className="flex flex-col gap-10">
        {summaries.map((summary) => (
          <section key={summary.appSlug} className="flex flex-col gap-5">
            <Link
              href={summary.appSlug === 'vault' ? '/vault' : '/'}
              className="group flex items-center gap-2 text-xl font-semibold text-foreground">
              <span>{summary.appName}</span>
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                strokeWidth={2}
                className="text-muted-foreground transition-transform group-hover:translate-x-0.5"
              />
            </Link>
            <div className="dashboard-meta flex items-center gap-2">
              <span className="size-2 rounded-full bg-primary" />
              <span>Alle Systeme operational</span>
            </div>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-[1fr_auto] items-center gap-4">
                <span className="flex items-center gap-3 text-base text-foreground">
                  <HugeiconsIcon icon={Notebook01Icon} strokeWidth={2} />
                  Entwürfe
                </span>
                <span className="dashboard-meta tabular-nums">
                  {summary.draftCount}
                </span>
              </div>
              <Separator />
              <div className="grid grid-cols-[1fr_auto] items-center gap-4">
                <span className="flex items-center gap-3 text-base text-foreground">
                  <HugeiconsIcon icon={Folder01Icon} strokeWidth={2} />
                  Veröffentlicht
                </span>
                <span className="dashboard-meta tabular-nums">
                  {summary.publishedCount}
                </span>
              </div>
            </div>
          </section>
        ))}
      </div>
    </aside>
  );
}
