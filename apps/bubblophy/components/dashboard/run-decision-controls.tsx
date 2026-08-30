'use client';

import type {
  TransitionBubblophyAgentRunActionInput,
  TransitionBubblophyAgentRunActionResult,
} from '@/app/actions';
import type { AgentRunSummary } from '@/lib/dashboard/types';

import { useState, useTransition } from 'react';

import { Button } from '@bubbles/ui/shadcn/button';

/**
 * Renders human approve and cancel controls for one requested run.
 *
 * @param props Run reference, protected Server Action, and success callback.
 * @returns Inline decision buttons with bounded server-backed feedback.
 */
export function RunDecisionControls({
  runId,
  transitionAgentRunAction,
  onAgentRunTransitioned,
}: {
  runId: string;
  transitionAgentRunAction: (
    input: TransitionBubblophyAgentRunActionInput
  ) => Promise<TransitionBubblophyAgentRunActionResult>;
  onAgentRunTransitioned: (run: AgentRunSummary) => void;
}) {
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDecision = (
    decision: TransitionBubblophyAgentRunActionInput['decision']
  ) => {
    if (isPending) {
      return;
    }

    setActionError(null);
    startTransition(async () => {
      try {
        const result = await transitionAgentRunAction({ runId, decision });

        if (result.status === 'updated') {
          onAgentRunTransitioned(result.run);
          return;
        }

        setActionError(getRunTransitionErrorMessage(result));
      } catch {
        setActionError(
          'Die Run-Entscheidung konnte gerade nicht gespeichert werden. Versuche es erneut.'
        );
      }
    });
  };

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          disabled={isPending}
          onClick={() => handleDecision('approve')}>
          {isPending ? 'Prüft...' : 'Freigeben'}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() => handleDecision('cancel')}>
          Abbrechen
        </Button>
      </div>
      {actionError ? (
        <p role="alert" className="text-xs text-destructive">
          {actionError}
        </p>
      ) : null}
    </div>
  );
}

/** Converts a rejected run transition into concise inline feedback. */
function getRunTransitionErrorMessage(
  result: Exclude<
    TransitionBubblophyAgentRunActionResult,
    { status: 'updated' }
  >
) {
  if (result.status === 'not_found') {
    return 'Dieser Run wurde nicht gefunden.';
  }

  if (result.status === 'forbidden') {
    return 'Du bist kein Mitglied dieses Projekts. Der Run wurde nicht geändert.';
  }

  if (result.status === 'invalid_transition') {
    return 'Nur angefragte Runs können freigegeben oder abgebrochen werden.';
  }

  if (result.status === 'token_unavailable') {
    return 'Das zugeordnete Agent-Token ist nicht ausführbar. Der Run wurde nicht freigegeben.';
  }

  if (result.status === 'database_unavailable') {
    return 'Die Datenbank ist gerade nicht verfügbar. Der Run wurde nicht geändert.';
  }

  if (result.reason === 'empty_run') {
    return 'Wähle einen Run aus.';
  }

  return 'Diese Run-Entscheidung ist nicht gültig.';
}
