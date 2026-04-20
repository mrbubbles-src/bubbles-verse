import type { ReactNode } from 'react';

import { cn } from '@bubbles/ui/lib/utils';
import { Card, CardContent, CardHeader } from '@bubbles/ui/shadcn/card';

type DashboardRouteStateProps = {
  eyebrow: string;
  title: string;
  description: string;
  visual: ReactNode;
  actions?: ReactNode;
  details?: ReactNode;
  tone?: 'default' | 'danger' | 'loading';
};

const toneStyles: Record<
  NonNullable<DashboardRouteStateProps['tone']>,
  {
    shell: string;
    orb: string;
    panel: string;
  }
> = {
  default: {
    shell:
      'border-border/60 bg-card/85 shadow-[0_30px_120px_-48px_rgba(96,71,160,0.45)]',
    orb: 'border-primary/25 bg-primary/12 text-primary',
    panel: 'border-border/50 bg-background/55',
  },
  danger: {
    shell:
      'border-destructive/20 bg-card/90 shadow-[0_30px_120px_-48px_rgba(214,101,115,0.35)]',
    orb: 'border-destructive/25 bg-destructive/10 text-destructive',
    panel: 'border-destructive/15 bg-destructive/6',
  },
  loading: {
    shell:
      'border-primary/18 bg-card/90 shadow-[0_30px_120px_-48px_rgba(116,91,188,0.38)]',
    orb: 'border-primary/22 bg-primary/10 text-primary',
    panel: 'border-primary/15 bg-primary/6',
  },
};

/**
 * Renders the shared full-page state surface for dashboard route fallbacks.
 *
 * Use this for route-level loading, error, and not-found states so the
 * dashboard keeps one consistent visual language for exceptional flows.
 *
 * @param props - Copy, visual, actions, and optional detail panel content.
 * @returns Responsive state surface that fits inside the shared dashboard shell.
 */
export function DashboardRouteState({
  actions,
  description,
  details,
  eyebrow,
  title,
  tone = 'default',
  visual,
}: DashboardRouteStateProps) {
  const styles = toneStyles[tone];

  return (
    <section className="flex min-h-[calc(100dvh-14rem)] w-full items-center py-4 sm:py-6">
      <div className="mx-auto grid w-full max-w-6xl gap-4 xl:grid-cols-[minmax(0,1fr)_19rem]">
        <Card
          className={cn(
            'overflow-hidden rounded-[2rem] border backdrop-blur-sm',
            styles.shell
          )}>
          <CardHeader className="gap-8 px-5 py-6 sm:px-7 sm:py-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <div
                className={cn(
                  'flex size-16 shrink-0 items-center justify-center rounded-[1.4rem] border sm:size-20',
                  styles.orb
                )}>
                {visual}
              </div>
              <div className="min-w-0 space-y-3">
                <p className="text-xs font-semibold tracking-[0.24em] text-muted-foreground uppercase">
                  {eyebrow}
                </p>
                <div className="space-y-3">
                  <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                    {title}
                  </h1>
                  <p className="max-w-2xl text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg">
                    {description}
                  </p>
                </div>
                {actions ? (
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    {actions}
                  </div>
                ) : null}
              </div>
            </div>
          </CardHeader>
        </Card>
        {details ? (
          <Card
            className={cn(
              'rounded-[2rem] border backdrop-blur-sm',
              styles.panel
            )}>
            <CardContent className="flex h-full flex-col justify-center gap-4 px-5 py-6 sm:px-6 sm:py-7">
              {details}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </section>
  );
}
