'use client';

import type { BubblesBreadcrumb } from '@bubbles/ui/lib/bubbles-sidebar';
import type { ReactNode } from 'react';

import { BubblesBreadcrumbs } from '@bubbles/ui/components/bubbles-breadcrumbs';
import { Separator } from '@bubbles/ui/shadcn/separator';
import { SidebarTrigger } from '@bubbles/ui/shadcn/sidebar';

type BubblesSidebarHeaderProps = {
  breadcrumbs?: BubblesBreadcrumb[];
  description?: ReactNode;
  descriptionAction?: ReactNode;
  mobileActions?: ReactNode;
  actions?: ReactNode;
};

/**
 * Renders the shared inset header with a persistent trigger, breadcrumbs,
 * optional supporting copy, and optional action area.
 */
export function BubblesSidebarHeader({
  breadcrumbs = [],
  description,
  descriptionAction,
  mobileActions,
  actions,
}: BubblesSidebarHeaderProps) {
  const hasBreadcrumbs = breadcrumbs.length > 0;
  const hasDescriptionRow = Boolean(description || descriptionAction);

  return (
    <header className="sticky top-0 z-30 shrink-0 border-b border-border/40 bg-background/90 backdrop-blur-sm supports-[backdrop-filter]:bg-background/75">
      <div className="flex flex-col gap-4 px-4 py-3 md:px-6 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
        <div className="flex min-w-0 flex-1 items-start justify-between gap-3 md:items-center md:gap-4">
          <div className="flex shrink-0 items-center gap-2">
            <SidebarTrigger
              size="icon"
              className="-ml-1 size-11 rounded-full [&>svg]:size-6"
            />
            {hasBreadcrumbs ? (
              <Separator
                orientation="vertical"
                className="data-vertical:h-8 data-vertical:self-auto"
              />
            ) : null}
          </div>

          <div className="min-w-0 flex-1 space-y-1.5">
            {hasBreadcrumbs ? (
              <div className="min-w-0">
                <BubblesBreadcrumbs breadcrumbs={breadcrumbs} />
              </div>
            ) : null}

            {hasDescriptionRow ? (
              <div className="flex min-w-0 items-center gap-2.5 md:gap-3">
                {description ? (
                  <p className="truncate text-sm text-muted-foreground md:text-[15px]">
                    {description}
                  </p>
                ) : null}
                {descriptionAction ? (
                  <div className="shrink-0">{descriptionAction}</div>
                ) : null}
              </div>
            ) : null}
          </div>

          {mobileActions ? (
            <div className="flex shrink-0 items-center gap-4 lg:hidden">
              {mobileActions}
            </div>
          ) : null}
        </div>

        {actions ? (
          <div className="flex w-full shrink-0 justify-center lg:w-auto lg:items-center lg:justify-start lg:self-center">
            {actions}
          </div>
        ) : null}
      </div>
    </header>
  );
}
