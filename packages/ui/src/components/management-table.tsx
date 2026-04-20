'use client';

import * as React from 'react';

import { cn } from '@bubbles/ui/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@bubbles/ui/shadcn/table';

/**
 * Renders the shared management-table root for admin-style lists.
 *
 * Use this wrapper when screens need the installed shadcn table primitive with
 * the repo's default editorial sizing and responsive overflow behavior.
 *
 * @param props - Native table props plus optional class overrides.
 * @returns Styled table root built on the shared shadcn table primitive.
 */
export function ManagementTable({
  className,
  ...props
}: React.ComponentProps<typeof Table>) {
  return (
    <Table className={cn('w-full text-left text-base', className)} {...props} />
  );
}

/**
 * Renders the shared header wrapper for management tables.
 *
 * @param props - Native table-header props plus optional class overrides.
 * @returns Styled table header section.
 */
export function ManagementTableHeader({
  className,
  ...props
}: React.ComponentProps<typeof TableHeader>) {
  return <TableHeader className={cn(className)} {...props} />;
}

/**
 * Renders the shared body wrapper for management tables.
 *
 * @param props - Native table-body props plus optional class overrides.
 * @returns Styled table body section.
 */
export function ManagementTableBody({
  className,
  ...props
}: React.ComponentProps<typeof TableBody>) {
  return <TableBody className={cn(className)} {...props} />;
}

/**
 * Renders one header row in a management table.
 *
 * @param props - Native table-row props plus optional class overrides.
 * @returns Header row with neutral hover treatment.
 */
export function ManagementTableHeaderRow({
  className,
  ...props
}: React.ComponentProps<typeof TableRow>) {
  return (
    <TableRow className={cn('hover:bg-transparent', className)} {...props} />
  );
}

/**
 * Renders one body row in a management table.
 *
 * @param props - Native table-row props plus optional class overrides.
 * @returns Styled data row aligned for editorial content.
 */
export function ManagementTableRow({
  className,
  ...props
}: React.ComponentProps<typeof TableRow>) {
  return <TableRow className={cn('align-top', className)} {...props} />;
}

/**
 * Renders one header cell with the default management-table label styling.
 *
 * @param props - Native table-head props plus optional class overrides.
 * @returns Styled header cell ready for widths and alignment tweaks.
 */
export function ManagementTableHead({
  className,
  ...props
}: React.ComponentProps<typeof TableHead>) {
  return (
    <TableHead
      className={cn(
        'h-auto px-3 py-3 text-sm font-semibold tracking-[0.18em] whitespace-normal text-muted-foreground uppercase',
        className
      )}
      {...props}
    />
  );
}

/**
 * Renders one body cell with the default management-table spacing.
 *
 * @param props - Native table-cell props plus optional class overrides.
 * @returns Styled body cell ready for app-specific content.
 */
export function ManagementTableCell({
  className,
  ...props
}: React.ComponentProps<typeof TableCell>) {
  return (
    <TableCell
      className={cn('px-3 py-5 align-top whitespace-normal', className)}
      {...props}
    />
  );
}
