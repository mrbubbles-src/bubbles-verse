import Link from 'next/link';

import { Button } from '@bubbles/ui/shadcn/button';

type QuickAction = {
  label: string;
  href: string;
  description: string;
};

type QuickActionsProps = {
  actions: QuickAction[];
};

/**
 * Renders the primary dashboard entry points for the next editing steps.
 *
 * Use this section on the home screen to keep the first-click paths obvious
 * without filling the interface with heavy cards.
 */
export function QuickActions({ actions }: QuickActionsProps) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-semibold tracking-[0.28em] text-muted-foreground uppercase">
          Schnell starten
        </p>
        <h2 className="text-2xl font-semibold tracking-tight text-balance">
          Heute weiterschreiben
        </h2>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {actions.map((action, index) => (
          <Button
            key={action.href}
            render={<Link href={action.href} />}
            nativeButton={false}
            variant={index === 0 ? 'default' : 'outline'}
            className="h-auto min-h-24 justify-start rounded-[1.75rem] px-5 py-4 text-left whitespace-normal">
            <span className="flex flex-col items-start gap-1">
              <span className="font-semibold">{action.label}</span>
              <span
                className={
                  index === 0
                    ? 'text-sm text-primary-foreground/80'
                    : 'text-sm text-muted-foreground'
                }>
                {action.description}
              </span>
            </span>
          </Button>
        ))}
      </div>
    </section>
  );
}
