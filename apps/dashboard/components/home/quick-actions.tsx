import Link from 'next/link';

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
 * Renders the quiet vertical action list for the dashboard right rail.
 *
 * Use this to keep the next useful paths visible without default-selected
 * buttons or another block of heavy cards.
 */
export function QuickActions({ actions }: QuickActionsProps) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold tracking-[0.22em] text-muted-foreground uppercase">
        Weiterschreiben
      </h2>

      <div className="flex flex-col">
        {actions.map((action, index) => (
          <div key={action.href}>
            {index > 0 ? <Separator /> : null}
            <Link
              href={action.href}
              className="group flex items-start justify-between gap-4 rounded-[1.5rem] py-3 transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:outline-none">
              <span className="flex min-w-0 flex-col gap-1">
                <span className="text-sm font-semibold tracking-tight">
                  {action.label}
                </span>
                <span className="text-sm text-muted-foreground">
                  {action.description}
                </span>
              </span>
              <span className="rounded-full border border-border/60 px-3 py-1 text-xs font-medium text-muted-foreground transition-colors group-hover:border-foreground/20 group-hover:text-foreground">
                Öffnen
              </span>
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
