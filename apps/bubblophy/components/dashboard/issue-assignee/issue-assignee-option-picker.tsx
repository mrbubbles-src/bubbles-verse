'use client';

import type {
  ReadBubblophyIssueAssigneeOptionsActionInput,
  ReadBubblophyIssueAssigneeOptionsActionResult,
} from '@/app/actions';
import type {
  DashboardAssigneeOption,
  DashboardAssigneeOptionsCursor,
  DashboardCurrentAssignee,
} from '@/lib/dashboard/assignee-options';

import { projectMemberRoleLabels } from '@/lib/projects/role-presentation';

import { useEffect, useRef, useState } from 'react';

import { Button } from '@bubbles/ui/shadcn/button';
import { Input } from '@bubbles/ui/shadcn/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@bubbles/ui/shadcn/select';

const unassignedValue = '__unassigned__';

export interface IssueAssigneeOptionPickerProps {
  issueKey: string;
  selectedAuthUserId: string;
  selectedLabel: string;
  disabled?: boolean;
  readOptionsAction: (
    input: ReadBubblophyIssueAssigneeOptionsActionInput
  ) => Promise<ReadBubblophyIssueAssigneeOptionsActionResult>;
  onValueChange: (authUserId: string) => void;
}

/**
 * Renders an issue-bound, searchable assignee selector without loading the
 * complete project member list or exposing member e-mail addresses.
 *
 * @param props Current issue, selection, authorized read action, and callback.
 * @returns A bounded selector with explicit search and load-more controls.
 */
export function IssueAssigneeOptionPicker({
  issueKey,
  selectedAuthUserId,
  selectedLabel,
  disabled = false,
  readOptionsAction,
  onValueChange,
}: IssueAssigneeOptionPickerProps) {
  const [query, setQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState<string | null>(null);
  const [items, setItems] = useState<DashboardAssigneeOption[]>([]);
  const [currentAssignee, setCurrentAssignee] =
    useState<DashboardCurrentAssignee | null>(null);
  const [selectedOption, setSelectedOption] =
    useState<DashboardAssigneeOption | null>(null);
  const [nextAfter, setNextAfter] =
    useState<DashboardAssigneeOptionsCursor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const requestId = ++requestIdRef.current;

    void readOptions({ issueKey }, requestId, false);

    return () => {
      requestIdRef.current += 1;
    };
    // The action is a stable Server Action reference supplied by the page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [issueKey, readOptionsAction]);

  /** Loads one page and ignores responses superseded by another request. */
  async function readOptions(
    input: ReadBubblophyIssueAssigneeOptionsActionInput,
    requestId: number,
    append: boolean
  ) {
    try {
      const result = await readOptionsAction(input);

      if (requestIdRef.current !== requestId) {
        return;
      }

      if (
        result.status !== 'success' ||
        result.issueKey !== issueKey ||
        result.query !== (input.query?.trim() || null) ||
        !cursorsMatch(result.after, input.after ?? null)
      ) {
        setError(getAssigneeOptionsErrorMessage(result));
        setItems([]);
        setNextAfter(null);
        return;
      }

      setCurrentAssignee(result.currentAssignee);
      setItems((currentItems) =>
        append ? mergeAssigneeOptions(currentItems, result.items) : result.items
      );
      setNextAfter(result.nextAfter);
      setError(null);
    } catch {
      if (requestIdRef.current === requestId) {
        setError('Projektmitglieder konnten gerade nicht geladen werden.');
        setItems([]);
        setNextAfter(null);
      }
    } finally {
      if (requestIdRef.current === requestId) {
        setIsLoading(false);
      }
    }
  }

  /** Starts a fresh prefix search and resets the page cursor. */
  function handleSearch() {
    const normalizedQuery = query.trim();

    if (normalizedQuery.length === 1) {
      setError('Gib mindestens zwei Zeichen ein oder leere die Suche.');
      return;
    }

    const requestId = ++requestIdRef.current;
    const nextQuery = normalizedQuery || null;
    setAppliedQuery(nextQuery);
    setItems([]);
    setNextAfter(null);
    setError(null);
    setIsLoading(true);
    void readOptions(
      { issueKey, query: nextQuery ?? undefined },
      requestId,
      false
    );
  }

  /** Loads the next stable page for the applied query. */
  function handleLoadMore() {
    if (!nextAfter || isLoading) {
      return;
    }

    const requestId = ++requestIdRef.current;
    setError(null);
    setIsLoading(true);
    void readOptions(
      {
        issueKey,
        query: appliedQuery ?? undefined,
        after: nextAfter,
      },
      requestId,
      true
    );
  }

  const selectedValue = selectedAuthUserId || unassignedValue;
  const visibleOptions = mergeAssigneeOptions(
    currentAssignee?.isCurrentMember ? [currentAssignee] : [],
    selectedOption ? [selectedOption] : [],
    items
  );
  const danglingCurrentAssignee =
    currentAssignee && !currentAssignee.isCurrentMember
      ? currentAssignee
      : null;

  return (
    <div className="grid gap-2">
      <label className="grid gap-1.5 text-sm font-medium">
        Zuständig
        <Select
          value={selectedValue}
          disabled={disabled || isLoading}
          onValueChange={(value) => {
            const nextValue = !value || value === unassignedValue ? '' : value;
            const option = visibleOptions.find(
              (candidate) => candidate.authUserId === nextValue
            );
            setSelectedOption(option ?? null);
            onValueChange(nextValue);
          }}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Projektmitglied auswählen" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={unassignedValue}>Nicht zugewiesen</SelectItem>
            {danglingCurrentAssignee ? (
              <SelectItem value={danglingCurrentAssignee.authUserId}>
                {danglingCurrentAssignee.label}
              </SelectItem>
            ) : null}
            {visibleOptions.map((option) => (
              <SelectItem key={option.authUserId} value={option.authUserId}>
                {option.label} · {projectMemberRoleLabels[option.role]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          type="search"
          value={query}
          disabled={disabled || isLoading}
          maxLength={80}
          placeholder="Nutzer-ID"
          aria-label="Projektmitglieder durchsuchen"
          onChange={(event) => setQuery(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              handleSearch();
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          disabled={disabled || isLoading}
          onClick={handleSearch}>
          Suchen
        </Button>
      </div>

      {isLoading ? (
        <p role="status" className="text-xs text-muted-foreground">
          Projektmitglieder werden geladen.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
      {!isLoading && !error && items.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Keine passenden Projektmitglieder gefunden.
        </p>
      ) : null}
      {nextAfter ? (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={disabled || isLoading}
          onClick={handleLoadMore}>
          Weitere 20 laden
        </Button>
      ) : null}
      {selectedAuthUserId &&
      !visibleOptions.length &&
      !danglingCurrentAssignee ? (
        <p className="sr-only">Aktuelle Auswahl: {selectedLabel}</p>
      ) : null}
    </div>
  );
}

/** Compares the all-or-nothing cursor fingerprint returned by the server. */
function cursorsMatch(
  left: DashboardAssigneeOptionsCursor | null,
  right: DashboardAssigneeOptionsCursor | null
) {
  return (
    left === right ||
    (left !== null &&
      right !== null &&
      left.createdAt === right.createdAt &&
      left.authUserId === right.authUserId)
  );
}

/** Merges option pages by stable Auth user ID. */
function mergeAssigneeOptions(
  ...groups: DashboardAssigneeOption[][]
): DashboardAssigneeOption[] {
  const options = new Map<string, DashboardAssigneeOption>();

  for (const group of groups) {
    for (const option of group) {
      options.set(option.authUserId, option);
    }
  }

  return [...options.values()];
}

/** Maps public read states to one non-sensitive UI error. */
function getAssigneeOptionsErrorMessage(
  result: ReadBubblophyIssueAssigneeOptionsActionResult
) {
  if (result.status === 'forbidden') {
    return 'Deine Rolle darf Issue-Zuweisungen nicht mehr ändern.';
  }

  if (result.status === 'not_found') {
    return 'Das Issue oder dein Projektzugriff ist nicht mehr verfügbar.';
  }

  return 'Projektmitglieder konnten gerade nicht geladen werden.';
}
