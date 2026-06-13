import 'server-only';

import type { BubblophyAgentTokenScope } from '@/drizzle/db/schema';
import type { AgentTokenSummary } from '@/lib/dashboard/types';

import { deriveBubblophyAgentTokenState } from '@/lib/issues/repository';

export type BubblophyAgentTokenLifecycleDecision =
  | 'pause'
  | 'resume'
  | 'revoke';

export interface UpdateBubblophyAgentTokenLifecycleInput {
  authUserId: string;
  tokenId: string;
  decision: BubblophyAgentTokenLifecycleDecision;
}

export interface BubblophyAgentTokenLifecycleStoreInput {
  authUserId: string;
  tokenId: string;
  decision: BubblophyAgentTokenLifecycleDecision;
}

export interface BubblophyAgentTokenLifecycleStoreResult {
  id: string;
  label: string;
  projectKey: string;
  scopes: BubblophyAgentTokenScope[];
  state: 'active' | 'paused' | 'revoked';
  lastUsedAt: string | null;
  expiresAt: string | null;
}

export interface BubblophyAgentTokenLifecycleStore {
  updateAgentTokenLifecycle(
    input: BubblophyAgentTokenLifecycleStoreInput
  ): Promise<
    | {
        status: 'updated';
        token: BubblophyAgentTokenLifecycleStoreResult;
      }
    | {
        status: 'unchanged';
        token: BubblophyAgentTokenLifecycleStoreResult;
      }
    | {
        status: 'not_found';
      }
    | {
        status: 'forbidden';
      }
    | {
        status: 'invalid_transition';
        reason: 'revoked' | 'expired';
      }
  >;
}

export type UpdateBubblophyAgentTokenLifecycleResult =
  | {
      status: 'updated';
      token: AgentTokenSummary;
    }
  | {
      status: 'unchanged';
      token: AgentTokenSummary;
    }
  | {
      status: 'invalid';
      reason: 'empty_token' | 'invalid_decision';
    }
  | {
      status: 'invalid_transition';
      reason: 'revoked' | 'expired';
    }
  | {
      status: 'not_found';
    }
  | {
      status: 'forbidden';
    }
  | {
      status: 'database_unavailable';
    };

export interface UpdateBubblophyAgentTokenLifecycleOptions {
  store?: BubblophyAgentTokenLifecycleStore;
}

const lifecycleDecisions = new Set<BubblophyAgentTokenLifecycleDecision>([
  'pause',
  'resume',
  'revoke',
]);

/**
 * Updates an agent token lifecycle state for a human project maintainer.
 *
 * The service validates bounded action input and delegates object-level
 * authorization, project binding, and audit events to the server-only store.
 *
 * @param input Authenticated human user, token ID, and lifecycle decision.
 * @param options Optional store override for tests.
 * @returns Structured lifecycle result for server actions and UI.
 */
export async function updateBubblophyAgentTokenLifecycle(
  input: UpdateBubblophyAgentTokenLifecycleInput,
  options: UpdateBubblophyAgentTokenLifecycleOptions = {}
): Promise<UpdateBubblophyAgentTokenLifecycleResult> {
  const normalized = normalizeAgentTokenLifecycleInput(input);

  if (normalized.status === 'invalid') {
    return normalized;
  }

  const store = options.store ?? (await getDefaultLifecycleStore());

  if (!store) {
    return { status: 'database_unavailable' };
  }

  const result = await store.updateAgentTokenLifecycle(normalized.input);

  if (result.status === 'updated' || result.status === 'unchanged') {
    return {
      status: result.status,
      token: mapLifecycleTokenToSummary(result.token),
    };
  }

  return result;
}

/**
 * Maps a lifecycle store row into the public dashboard token summary.
 *
 * @param token Token metadata returned after a lifecycle decision.
 * @returns Public token summary without hash or plaintext.
 */
export function mapLifecycleTokenToSummary(
  token: BubblophyAgentTokenLifecycleStoreResult
): AgentTokenSummary {
  return {
    id: token.id,
    label: token.label,
    projectKey: token.projectKey,
    scopes: [...token.scopes],
    state: deriveBubblophyAgentTokenState(token),
    lastUsedAt: token.lastUsedAt ?? 'noch nie verwendet',
    expiresAt: token.expiresAt ?? 'läuft nicht automatisch ab',
  };
}

/**
 * Validates raw lifecycle action input before store access.
 *
 * @param input Raw server action or test input.
 * @returns Store-safe input or structured validation error.
 */
function normalizeAgentTokenLifecycleInput(
  input: UpdateBubblophyAgentTokenLifecycleInput
):
  | {
      status: 'valid';
      input: BubblophyAgentTokenLifecycleStoreInput;
    }
  | Extract<UpdateBubblophyAgentTokenLifecycleResult, { status: 'invalid' }> {
  const tokenId = input.tokenId.trim();

  if (!tokenId) {
    return { status: 'invalid', reason: 'empty_token' };
  }

  if (!lifecycleDecisions.has(input.decision)) {
    return { status: 'invalid', reason: 'invalid_decision' };
  }

  return {
    status: 'valid',
    input: {
      authUserId: input.authUserId,
      tokenId,
      decision: input.decision,
    },
  };
}

/**
 * Loads the Drizzle-backed lifecycle store only when a database URL exists.
 *
 * @returns Server-only store, or `null` without database config.
 */
async function getDefaultLifecycleStore(): Promise<BubblophyAgentTokenLifecycleStore | null> {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  const { createDrizzleBubblophyAgentTokenLifecycleStore } =
    await import('@/lib/agent-tokens/lifecycle-database-write');

  return createDrizzleBubblophyAgentTokenLifecycleStore();
}
