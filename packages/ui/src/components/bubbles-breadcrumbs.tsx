'use client';

import type { BubblesBreadcrumb } from '@bubbles/ui/lib/bubbles-sidebar';

import * as React from 'react';

import Link from 'next/link';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@bubbles/ui/shadcn/breadcrumb';

type BubblesBreadcrumbsProps = {
  breadcrumbs: BubblesBreadcrumb[];
};

/**
 * Renders shared breadcrumb data with the local shadcn breadcrumb primitives.
 */
export function BubblesBreadcrumbs({ breadcrumbs }: BubblesBreadcrumbsProps) {
  if (!breadcrumbs.length) {
    return null;
  }

  return (
    <Breadcrumb>
      <BreadcrumbList className="text-sm md:text-[15px]">
        {breadcrumbs.map((breadcrumb, index) => {
          const isLast = index === breadcrumbs.length - 1;

          return (
            <React.Fragment key={`${breadcrumb.label}-${index}`}>
              <BreadcrumbItem>
                {breadcrumb.href && !isLast ? (
                  <BreadcrumbLink
                    render={<Link href={breadcrumb.href} />}
                    className="font-medium text-muted-foreground/80 hover:text-foreground">
                    {breadcrumb.label}
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage className="text-[15px] font-semibold text-primary md:text-base">
                    {breadcrumb.label}
                  </BreadcrumbPage>
                )}
              </BreadcrumbItem>
              {!isLast ? <BreadcrumbSeparator /> : null}
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
