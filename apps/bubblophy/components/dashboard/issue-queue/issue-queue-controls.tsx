'use client';

import type {
  BubblophyIssuePriority,
  BubblophyIssueStatus,
} from '@/drizzle/db/schema';
import type {
  DashboardIssueQueryPatch,
  DashboardIssueQueryState,
} from '@/lib/dashboard/issue-query';

import {
  isDashboardIssuePriority,
  isDashboardIssueStatus,
} from '@/lib/dashboard/issue-query';

import { useState } from 'react';

import { Button } from '@bubbles/ui/shadcn/button';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@bubbles/ui/shadcn/input-group';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@bubbles/ui/shadcn/select';

interface IssueQueueControlsProps {
  query: DashboardIssueQueryState;
  hasCurrentPage: boolean;
  hasNextPage: boolean;
  onFiltersChange: (input: DashboardIssueQueryPatch) => void;
  onFirstPage: () => void;
  onNextPage: () => void;
}

const statusOptions = [
  { value: 'triage', label: 'Triage' },
  { value: 'planned', label: 'Geplant' },
  { value: 'ready', label: 'Bereit' },
  { value: 'in_progress', label: 'In Arbeit' },
  { value: 'review', label: 'Review' },
  { value: 'blocked', label: 'Blockiert' },
  { value: 'done', label: 'Erledigt' },
] satisfies { value: BubblophyIssueStatus; label: string }[];

const priorityOptions = [
  { value: 'low', label: 'Niedrig' },
  { value: 'medium', label: 'Mittel' },
  { value: 'high', label: 'Hoch' },
] satisfies { value: BubblophyIssuePriority; label: string }[];

/**
 * Renders URL-backed search, filter, sort, and keyset page controls.
 *
 * @param props Canonical queue state and navigation callbacks.
 * @returns Compact controls for a concrete or cross-project queue.
 */
export function IssueQueueControls({
  query,
  hasCurrentPage,
  hasNextPage,
  onFiltersChange,
  onFirstPage,
  onNextPage,
}: IssueQueueControlsProps) {
  const [searchValue, setSearchValue] = useState(query.filters.query ?? '');

  return (
    <div className="grid gap-3 border-y border-border/60 py-3 lg:grid-cols-[minmax(14rem,1fr)_auto]">
      <form
        role="search"
        aria-label="Issues durchsuchen"
        onSubmit={(event) => {
          event.preventDefault();
          onFiltersChange({ query: searchValue });
        }}>
        <InputGroup className="h-8">
          <InputGroupInput
            aria-label="Issue-Suche"
            maxLength={100}
            placeholder="Titel oder Issue-Key"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
          />
          <InputGroupAddon align="inline-start">Suche</InputGroupAddon>
          <InputGroupAddon align="inline-end">
            <InputGroupButton type="submit">Anwenden</InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </form>

      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={query.filters.status ?? 'all'}
          onValueChange={(value) =>
            onFiltersChange({
              status: isDashboardIssueStatus(value) ? value : null,
            })
          }>
          <SelectTrigger size="sm" aria-label="Status filtern">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectGroup>
              <SelectItem value="all">Alle Status</SelectItem>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        <Select
          value={query.filters.priority ?? 'all'}
          onValueChange={(value) =>
            onFiltersChange({
              priority: isDashboardIssuePriority(value) ? value : null,
            })
          }>
          <SelectTrigger size="sm" aria-label="Priorität filtern">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectGroup>
              <SelectItem value="all">Alle Prioritäten</SelectItem>
              {priorityOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        <Select
          value={query.sort}
          onValueChange={(value) =>
            onFiltersChange({
              sort: value === 'oldest' ? 'oldest' : 'newest',
            })
          }>
          <SelectTrigger size="sm" aria-label="Issues sortieren">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectGroup>
              <SelectItem value="newest">Neueste zuerst</SelectItem>
              <SelectItem value="oldest">Älteste zuerst</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>

        {hasCurrentPage ? (
          <Button type="button" size="sm" variant="ghost" onClick={onFirstPage}>
            Zur ersten Seite
          </Button>
        ) : null}
        {hasNextPage ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onNextPage}>
            Weitere 25
          </Button>
        ) : null}
      </div>
    </div>
  );
}
