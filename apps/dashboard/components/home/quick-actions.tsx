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
    <section className="flex flex-col gap-4">
      <h2 className="text-base font-semibold tracking-[0.18em] text-muted-foreground uppercase">
        Weiterschreiben
      </h2>

      <div className="flex flex-col">
        {actions.map((action, index) => (
          <div key={action.href}>
            {index > 0 ? <Separator /> : null}
            <Link
              href={action.href}
              className="group flex items-start justify-between gap-4 rounded-[1.5rem] py-4 transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:outline-none">
              <span className="flex min-w-0 flex-col gap-1.5">
                <span className="text-base font-semibold tracking-tight sm:text-lg">
                  {action.label}
                </span>
                <span className="text-base text-muted-foreground">
                  {action.description}
                </span>
              </span>
              <span className="rounded-full border border-border/60 px-3.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors group-hover:border-foreground/20 group-hover:text-foreground">
                Öffnen
              </span>
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
