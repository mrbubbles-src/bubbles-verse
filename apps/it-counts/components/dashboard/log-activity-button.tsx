'use client';

import { Button } from '@bubbles/ui/shadcn/button';
import { cn } from '@bubbles/ui/lib/utils';

/**
 * Renders the single primary logging CTA for the dashboard.
 * Use it as the visible trigger for the bottom-sheet logging flow.
 */
export function LogActivityButton({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      size="lg"
      className={cn('h-12 px-8 text-base font-semibold', className)}
      {...props}>
      Log Activity
    </Button>
  );
}
