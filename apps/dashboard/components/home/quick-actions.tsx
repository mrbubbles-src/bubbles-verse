import Link from 'next/link';

import { Button } from '@bubbles/ui/shadcn/button';

type QuickAction = {
  label: string;
  href: string;
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
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {actions.map((action, index) => (
          <Button
            key={action.href}
            render={<Link href={action.href} />}
            nativeButton={false}
            variant={index === 0 ? 'default' : 'outline'}
            className="h-11 justify-start rounded-full px-5">
            {action.label}
          </Button>
        ))}
      </div>
    </section>
  );
}
