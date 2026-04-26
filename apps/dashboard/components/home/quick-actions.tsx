import Link from 'next/link';

import { Badge } from '@bubbles/ui/components/shadcn/badge';
import { ArrowRight01Icon, HugeiconsIcon } from '@bubbles/ui/lib/hugeicons';
import { Separator } from '@bubbles/ui/shadcn/separator';

type QuickAction = {
  label: string;
  href: string;
  description: string;
};

type QuickActionsProps = {
  actions: QuickAction[];
};

/**
 * Renders the quiet vertical action list for the dashboard command rail.
 *
 * Use this to keep the next useful paths visible without default-selected
 * buttons or another block of heavy cards.
 */
export function QuickActions({ actions }: QuickActionsProps) {
  return (
    <section className="dashboard-studio-panel-flat flex flex-col gap-4 px-4 py-5 sm:px-5">
      <div>
        <p className="dashboard-kicker">Schnellstart</p>
        <h2 className="dashboard-section-title mt-2 text-lg sm:text-xl">
          Nächste Aktionen
        </h2>
      </div>

      <div className="flex flex-col">
        {actions.map((action, index) => (
          <div key={action.href}>
            {index > 0 ? <Separator /> : null}
            <Link
              href={action.href}
              className="dashboard-soft-row group flex items-start justify-between gap-4">
              <span className="flex min-w-0 flex-col gap-1.5">
                <span className="text-base font-semibold tracking-tight sm:text-lg">
                  {action.label}
                </span>
                <span className="text-base text-muted-foreground">
                  {action.description}
                </span>
              </span>
              <Badge
                className="rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors group-hover:border-foreground/20 group-hover:text-foreground"
                variant="outline">
                <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
              </Badge>
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
