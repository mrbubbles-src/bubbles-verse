'use client';

import type {
  ReadBubblophyRunTargetOptionsActionInput,
  ReadBubblophyRunTargetOptionsActionResult,
} from '@/app/actions';
import type {
  DashboardRunTargetOption,
  DashboardRunTargetOptionsCursor,
} from '@/lib/dashboard/run-target-options';

import { useEffect, useRef, useState } from 'react';

import { Button } from '@bubbles/ui/shadcn/button';
import { Field, FieldGroup, FieldLabel } from '@bubbles/ui/shadcn/field';
import { Input } from '@bubbles/ui/shadcn/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@bubbles/ui/shadcn/select';

export interface RunTargetOptionPickerProps {
  issueKey: string;
  selectedTokenId: string;
  disabled?: boolean;
  readOptionsAction: (
    input: ReadBubblophyRunTargetOptionsActionInput
  ) => Promise<ReadBubblophyRunTargetOptionsActionResult>;
  onValueChange: (tokenId: string) => void;
}

/**
 * Renders an issue-bound, bounded selector for executable agent tokens.
 *
 * @param props Issue key, selected token, authorized read action, and callback.
 * @returns A searchable selector that never loads token secrets or all tokens.
 */
export function RunTargetOptionPicker({
  issueKey,
  selectedTokenId,
  disabled = false,
  readOptionsAction,
  onValueChange,
}: RunTargetOptionPickerProps) {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<DashboardRunTargetOption[]>([]);
  const [selectedOption, setSelectedOption] =
    useState<DashboardRunTargetOption | null>(null);
  const [nextAfter, setNextAfter] =
    useState<DashboardRunTargetOptionsCursor | null>(null);
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
    input: ReadBubblophyRunTargetOptionsActionInput,
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
        setError(getRunTargetOptionsErrorMessage(result));
        setItems([]);
        setSelectedOption(null);
        setNextAfter(null);
        onValueChange('');
        return;
      }

      const visibleItems = append
        ? mergeRunTargetOptions(items, result.items)
        : result.items;
      const currentSelection = mergeRunTargetOptions(
        selectedOption ? [selectedOption] : [],
        visibleItems
      ).find((option) => option.id === selectedTokenId);
      const nextSelection = currentSelection ?? visibleItems[0] ?? null;

      setItems(visibleItems);
      setSelectedOption(nextSelection);
      setNextAfter(result.nextAfter);
      setError(null);

      if ((nextSelection?.id ?? '') !== selectedTokenId) {
        onValueChange(nextSelection?.id ?? '');
      }
    } catch {
      if (requestIdRef.current === requestId) {
        setError(
          'Ausführbare Agent-Tokens konnten gerade nicht geladen werden.'
        );
        setItems([]);
        setSelectedOption(null);
        setNextAfter(null);
        onValueChange('');
      }
    } finally {
      if (requestIdRef.current === requestId) {
        setIsLoading(false);
      }
    }
  }

  /** Starts a fresh literal label-prefix search. */
  function handleSearch() {
    const normalizedQuery = query.trim();

    if (normalizedQuery.length === 1) {
      setError('Gib mindestens zwei Zeichen ein oder leere die Suche.');
      return;
    }

    const requestId = ++requestIdRef.current;
    setItems([]);
    setNextAfter(null);
    setError(null);
    setIsLoading(true);
    void readOptions(
      { issueKey, query: normalizedQuery || undefined },
      requestId,
      false
    );
  }

  /** Loads the next stable unfiltered page. */
  function handleLoadMore() {
    if (!nextAfter || isLoading) {
      return;
    }

    const requestId = ++requestIdRef.current;
    setError(null);
    setIsLoading(true);
    void readOptions({ issueKey, after: nextAfter }, requestId, true);
  }

  const visibleOptions = mergeRunTargetOptions(
    selectedOption ? [selectedOption] : [],
    items
  );

  return (
    <FieldGroup className="gap-2">
      <Field>
        <FieldLabel htmlFor="run-target-token">Agent-Token</FieldLabel>
        <Select
          value={selectedTokenId}
          disabled={disabled || isLoading || visibleOptions.length === 0}
          onValueChange={(value) => {
            const option = visibleOptions.find(
              (candidate) => candidate.id === value
            );
            setSelectedOption(option ?? null);
            onValueChange(value ?? '');
          }}>
          <SelectTrigger id="run-target-token" className="w-full">
            <SelectValue placeholder="Ausführbares Agent-Token auswählen" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {visibleOptions.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          type="search"
          value={query}
          disabled={disabled || isLoading}
          maxLength={80}
          placeholder="Token-Label"
          aria-label="Ausführbare Agent-Tokens durchsuchen"
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
          Ausführbare Agent-Tokens werden geladen.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
      {!isLoading && !error && items.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Keine passenden ausführbaren Agent-Tokens gefunden.
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
    </FieldGroup>
  );
}

/** Compares the all-or-nothing cursor fingerprint returned by the server. */
function cursorsMatch(
  left: DashboardRunTargetOptionsCursor | null,
  right: DashboardRunTargetOptionsCursor | null
) {
  return (
    left === right ||
    (left !== null &&
      right !== null &&
      left.normalizedLabel === right.normalizedLabel &&
      left.id === right.id)
  );
}

/** Merges option pages by stable token ID. */
function mergeRunTargetOptions(
  ...groups: DashboardRunTargetOption[][]
): DashboardRunTargetOption[] {
  const options = new Map<string, DashboardRunTargetOption>();

  for (const group of groups) {
    for (const option of group) {
      options.set(option.id, option);
    }
  }

  return [...options.values()];
}

/** Maps public read states to one non-sensitive UI error. */
function getRunTargetOptionsErrorMessage(
  result: ReadBubblophyRunTargetOptionsActionResult
) {
  if (result.status === 'forbidden') {
    return 'Deine Rolle darf für dieses Issue keinen Agent-Run anfragen.';
  }

  if (result.status === 'not_found') {
    return 'Das Issue oder dein Projektzugriff ist nicht mehr verfügbar.';
  }

  return 'Ausführbare Agent-Tokens konnten gerade nicht geladen werden.';
}
