import 'server-only';

import type { BubblophyAgentRunState } from '@/drizzle/db/schema';
import type { AgentRunSummary } from '@/lib/dashboard/types';

import { mapBubblophyAgentRunState } from '@/lib/issues/repository';

export type HumanBubblophyAgentRunDecision = 'approve' | 'cancel';

export interface TransitionBubblophyAgentRunInput {
  authUserId: string;
  runId: string;
  decision: HumanBubblophyAgentRunDecision;
}

export interface BubblophyAgentRunHumanTransitionStoreInput {
  authUserId: string;
  runId: string;
  decision: HumanBubblophyAgentRunDecision;
}

export interface BubblophyAgentRunHumanTransitionStoreResult {
  id: string;
  issueId: string;
  agentTokenLabel: string;
  state: BubblophyAgentRunState;
  message: string;
}

export interface BubblophyAgentRunHumanTransitionStore {
  transitionRun(input: BubblophyAgentRunHumanTransitionStoreInput): Promise<
    | {
        status: 'updated';
        run: BubblophyAgentRunHumanTransitionStoreResult;
      }
    | {
        status: 'not_found';
      }
    | {
        status: 'forbidden';
      }
    | {
        status: 'invalid_transition';
      }
    | {
        status: 'token_unavailable';
      }
  >;
}

export type TransitionBubblophyAgentRunResult =
  | {
      status: 'updated';
      run: AgentRunSummary;
    }
  | {
      status: 'invalid';
      reason: 'empty_run' | 'invalid_decision';
    }
  | {
      status: 'not_found';
    }
  | {
      status: 'forbidden';
    }
  | {
      status: 'invalid_transition';
    }
  | {
      status: 'token_unavailable';
    }
  | {
      status: 'database_unavailable';
    };

export interface TransitionBubblophyAgentRunOptions {
  store?: BubblophyAgentRunHumanTransitionStore;
}

/**
 * Applies a human approve/cancel decision to a requested agent run.
 *
 * The service validates the action boundary, delegates membership and state
 * checks to the store, and only returns a dashboard summary. It never starts
 * agent execution or performs tool calls.
 *
 * @param input Authenticated human ID, run ID, and decision.
 * @param options Optional store override for tests.
 * @returns Structured result for the dashboard run queue.
 */
export async function transitionBubblophyAgentRun(
  input: TransitionBubblophyAgentRunInput,
  options: TransitionBubblophyAgentRunOptions = {}
): Promise<TransitionBubblophyAgentRunResult> {
  const normalized = normalizeHumanRunTransitionInput(input);

  if (normalized.status === 'invalid') {
    return normalized;
  }

  const store = options.store ?? (await getDefaultHumanTransitionStore());

  if (!store) {
    return { status: 'database_unavailable' };
  }

  const result = await store.transitionRun(normalized.input);

  if (result.status !== 'updated') {
    return result;
  }

  return {
    status: 'updated',
    run: mapTransitionedRunToSummary(result.run),
  };
}

/**
 * Maps a transitioned run row into the public dashboard DTO.
 *
 * @param run Store result after a human run decision.
 * @returns Dashboard run summary.
 */
export function mapTransitionedRunToSummary(
  run: BubblophyAgentRunHumanTransitionStoreResult
): AgentRunSummary {
  return {
    id: run.id,
    issueId: run.issueId,
    agentLabel: run.agentTokenLabel,
    state: mapBubblophyAgentRunState(run.state),
    requestedBy: 'Mensch',
    lastEvent: run.message,
  };
}

/**
 * Validates raw human transition input for the persistence boundary.
 *
 * @param input Raw server-action values.
 * @returns Store-safe input or a structured validation error.
 */
function normalizeHumanRunTransitionInput(
  input: TransitionBubblophyAgentRunInput
):
  | {
      status: 'valid';
      input: BubblophyAgentRunHumanTransitionStoreInput;
    }
  | Extract<TransitionBubblophyAgentRunResult, { status: 'invalid' }> {
  const runId = input.runId.trim();

  if (!runId) {
    return { status: 'invalid', reason: 'empty_run' };
  }

  if (input.decision !== 'approve' && input.decision !== 'cancel') {
    return { status: 'invalid', reason: 'invalid_decision' };
  }

  return {
    status: 'valid',
    input: {
      authUserId: input.authUserId,
      runId,
      decision: input.decision,
    },
  };
}

/**
 * Loads the Drizzle store only when database access is configured.
 *
 * @returns Server-only human run transition store, or `null`.
 */
async function getDefaultHumanTransitionStore(): Promise<BubblophyAgentRunHumanTransitionStore | null> {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  const { createDrizzleBubblophyAgentRunHumanTransitionStore } =
    await import('@/lib/agent-runs/human-transition-database-write');

  return createDrizzleBubblophyAgentRunHumanTransitionStore();
}
