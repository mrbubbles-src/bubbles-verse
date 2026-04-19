'use client';

import type { BubblesAppHeaderProps } from '@bubbles/ui/lib/bubbles-sidebar';

import { cn } from '@bubbles/ui/lib/utils';
import { Separator } from '@bubbles/ui/shadcn/separator';
import { SidebarTrigger } from '@bubbles/ui/shadcn/sidebar';

import { BubblesBreadcrumbs } from './bubbles-breadcrumbs';

/**
 * Renders the shared sticky app header with trigger, breadcrumbs, and optional
 * injected meta/actions so apps can extend the default shell without changing
 * the shared sidebar package itself.
 */
export function BubblesAppHeader({
  breadcrumbs = [],
  subtitle,
  subtitleAction,
  mobileTopActions,
  actions,
  classNames,
}: BubblesAppHeaderProps) {
  const hasBreadcrumbs = breadcrumbs.length > 0;
  const hasSubtitleRow = Boolean(subtitle || subtitleAction);

  return (
    <header
      className={cn(
        'sticky top-0 z-30 shrink-0 border-b border-border/40 bg-background/90 backdrop-blur-sm supports-[backdrop-filter]:bg-background/75',
        classNames?.root
      )}>
      <div
        className={cn(
          'flex flex-col gap-3 px-4 py-3 md:grid md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-6 md:px-6',
          classNames?.inner
        )}>
        <div className="flex items-start justify-between gap-3 md:min-w-0 md:items-center md:gap-4">
          <div
            className={cn(
              'flex min-w-0 flex-1 items-start gap-3 md:items-center md:gap-4',
              classNames?.leading
            )}>
            <div
              className={cn(
                'flex shrink-0 items-center gap-2 self-center',
                classNames?.triggerGroup
              )}>
              <SidebarTrigger
                size="icon"
                className="-ml-1 size-11 rounded-full [&>svg]:size-6"
              />
              {hasBreadcrumbs ? (
                <Separator
                  orientation="vertical"
                  className="data-vertical:h-8"
                />
              ) : null}
            </div>

            <div className={cn('min-w-0 flex-1 space-y-1.5', classNames?.meta)}>
              {hasBreadcrumbs ? (
                <div className="min-w-0">
                  <BubblesBreadcrumbs
                    breadcrumbs={breadcrumbs}
                    className={classNames?.breadcrumbs}
                  />
                </div>
              ) : null}

              {hasSubtitleRow ? (
                <div
                  className={cn(
                    'flex min-w-0 items-center gap-2.5 md:gap-3',
                    classNames?.subtitleRow
                  )}>
                  {subtitle ? (
                    <div
                      className={cn(
                        'text-wrap-pretty line-clamp-2 min-w-0 text-sm/relaxed text-muted-foreground md:line-clamp-1 md:text-base',
                        classNames?.subtitle
                      )}>
                      {subtitle}
                    </div>
                  ) : null}
                  {subtitleAction ? (
                    <div className={cn('shrink-0', classNames?.subtitleAction)}>
                      {subtitleAction}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>

          {mobileTopActions ? (
            <div
              className={cn(
                'flex shrink-0 items-center gap-3 self-center md:hidden',
                classNames?.mobileTopActions
              )}>
              {mobileTopActions}
            </div>
          ) : null}

          {actions ? (
            <div
              className={cn(
                'hidden md:col-start-2 md:row-start-1 md:flex md:shrink-0 md:items-center md:justify-self-end',
                classNames?.actions
              )}>
              {actions}
            </div>
          ) : null}
        </div>

        {actions ? (
          <div
            className={cn(
              'flex justify-center md:hidden',
              classNames?.actions
            )}>
            {actions}
          </div>
        ) : null}
      </div>
    </header>
  );
}
