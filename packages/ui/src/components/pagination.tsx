'use client';

import * as React from 'react';

import Link from 'next/link';

import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  HugeiconsIcon,
} from '@bubbles/ui/lib/hugeicons';
import { getPaginationItems } from '@bubbles/ui/lib/pagination';
import { cn } from '@bubbles/ui/lib/utils';
import { Button } from '@bubbles/ui/shadcn/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@bubbles/ui/shadcn/select';

export type PaginationPageSizeOption =
  | number
  | {
      label: string;
      value: number;
    };

export type PaginationProps = {
  page: number;
  totalPages: number;
  label?: React.ReactNode;
  getPageHref?: (page: number) => string;
  onPageChange?: (page: number) => void;
  siblingCount?: number;
  boundaryCount?: number;
  pageSize?: number;
  pageSizeLabel?: React.ReactNode;
  pageSizeOptions?: readonly PaginationPageSizeOption[];
  getPageSizeHref?: (pageSize: number) => string;
  onPageSizeChange?: (pageSize: number) => void;
  className?: string;
};

function normalizePageSizeOptions(
  pageSize: number | undefined,
  options: readonly PaginationPageSizeOption[] | undefined
) {
  const normalizedOptions = (options ?? []).map((option) =>
    typeof option === 'number'
      ? {
          label: `${option}`,
          value: option,
        }
      : option
  );

  if (
    pageSize !== undefined &&
    !normalizedOptions.some((option) => option.value === pageSize)
  ) {
    normalizedOptions.unshift({
      label: `${pageSize}`,
      value: pageSize,
    });
  }

  return normalizedOptions.filter(
    (option, index, items) =>
      items.findIndex((candidate) => candidate.value === option.value) === index
  );
}

/**
 * Renders a compact, mobile-first pagination shell for classic paged lists.
 * Consumers only provide the current page state plus optional href builders or
 * callbacks for page and page-size changes.
 */
export function Pagination({
  page,
  totalPages,
  label,
  getPageHref,
  onPageChange,
  siblingCount = 1,
  boundaryCount = 1,
  pageSize,
  pageSizeLabel = 'Einträge pro Seite',
  pageSizeOptions,
  getPageSizeHref,
  onPageSizeChange,
  className,
}: PaginationProps) {
  if (totalPages < 1) {
    return null;
  }

  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const items = getPaginationItems({
    page: currentPage,
    totalPages,
    siblingCount,
    boundaryCount,
  });
  const normalizedPageSizeOptions = normalizePageSizeOptions(
    pageSize,
    pageSizeOptions
  );
  const hasPageSizeSelector =
    pageSize !== undefined && normalizedPageSizeOptions.length > 0;

  function handlePageChange(targetPage: number) {
    if (
      targetPage === currentPage ||
      targetPage < 1 ||
      targetPage > totalPages
    ) {
      return;
    }

    onPageChange?.(targetPage);
  }

  function handlePageSizeChange(value: string | null) {
    if (!value) {
      return;
    }

    const nextPageSize = Number.parseInt(value, 10);

    if (!Number.isFinite(nextPageSize)) {
      return;
    }

    onPageSizeChange?.(nextPageSize);

    const href = getPageSizeHref?.(nextPageSize);

    if (!href || typeof window === 'undefined') {
      return;
    }

    window.location.assign(href);
  }

  return (
    <nav
      aria-label="Pagination"
      data-slot="pagination"
      className={cn(
        'flex flex-col gap-3 border-t border-border/50 pt-4',
        className
      )}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <p
            data-slot="pagination-label"
            className="text-sm text-muted-foreground">
            {label ?? `Seite ${currentPage} von ${totalPages}`}
          </p>

          {hasPageSizeSelector ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {pageSizeLabel}
              </span>

              <Select
                value={`${pageSize}`}
                onValueChange={handlePageSizeChange}>
                <SelectTrigger size="sm" className="min-w-20 bg-background/70">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="end">
                  {normalizedPageSizeOptions.map((option) => (
                    <SelectItem key={option.value} value={`${option.value}`}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
        </div>

        <div
          data-slot="pagination-controls"
          className="flex flex-wrap items-center gap-1.5">
          <PaginationAction
            label="Zurück"
            page={currentPage - 1}
            getHref={getPageHref}
            onAction={handlePageChange}
            disabled={currentPage <= 1}>
            <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
            <span>Zurück</span>
          </PaginationAction>

          <div className="flex flex-wrap items-center gap-1">
            {items.map((item) =>
              item.type === 'ellipsis' ? (
                <span
                  key={item.key}
                  data-slot="pagination-ellipsis"
                  aria-hidden="true"
                  className="flex h-7 min-w-7 items-center justify-center px-1 text-xs text-muted-foreground">
                  ...
                </span>
              ) : (
                <PaginationAction
                  key={item.key}
                  label={`Seite ${item.page}`}
                  page={item.page}
                  getHref={getPageHref}
                  onAction={handlePageChange}
                  current={item.isCurrent}>
                  {item.page}
                </PaginationAction>
              )
            )}
          </div>

          <PaginationAction
            label="Weiter"
            page={currentPage + 1}
            getHref={getPageHref}
            onAction={handlePageChange}
            disabled={currentPage >= totalPages}>
            <span>Weiter</span>
            <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
          </PaginationAction>
        </div>
      </div>
    </nav>
  );
}

type PaginationActionProps = {
  children: React.ReactNode;
  current?: boolean;
  disabled?: boolean;
  getHref?: (page: number) => string;
  label: string;
  onAction?: (page: number) => void;
  page: number;
};

/**
 * Renders a single pagination control as either a button or a Next.js link,
 * while keeping the visual treatment and accessibility state consistent.
 */
function PaginationAction({
  children,
  current = false,
  disabled = false,
  getHref,
  label,
  onAction,
  page,
}: PaginationActionProps) {
  const href = !disabled && !current ? getHref?.(page) : undefined;
  const isDisabled = disabled || current || (!href && !onAction);

  const sharedProps = {
    'aria-current': current ? ('page' as const) : undefined,
    'aria-label': label,
    disabled: isDisabled,
    size: 'sm' as const,
    variant: current ? ('default' as const) : ('outline' as const),
    className: cn(
      'min-w-7 gap-1 rounded-md bg-background/70 px-2',
      current && 'pointer-events-none'
    ),
  };

  if (href) {
    return (
      <Button
        {...sharedProps}
        render={<Link href={href} />}
        nativeButton={false}
        onClick={() => onAction?.(page)}>
        {children}
      </Button>
    );
  }

  return (
    <Button {...sharedProps} type="button" onClick={() => onAction?.(page)}>
      {children}
    </Button>
  );
}
