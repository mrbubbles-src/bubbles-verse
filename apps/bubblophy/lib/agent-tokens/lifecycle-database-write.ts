import 'server-only';

import type { JsonObject } from '@/drizzle/db/schema';
import type {
  BubblophyAgentTokenLifecycleDecision,
  BubblophyAgentTokenLifecycleStore,
  BubblophyAgentTokenLifecycleStoreInput,
  BubblophyAgentTokenLifecycleStoreResult,
} from '@/lib/agent-tokens/lifecycle';

import { and, eq, inArray } from 'drizzle-orm';

import {
  bubblophyAgentTokens,
  bubblophyProjectEvents,
  bubblophyProjectMembers,
  bubblophyProjects,
} from '@/drizzle/db/schema';

export interface BubblophyAgentTokenLifecycleProjectEventInsert {
  projectId: string;
  eventType: 'agent_token_revoked' | 'project_updated';
  actorAuthUserId: string;
  actorAgentTokenId: null;
  agentRunId: null;
  summary: string;
  payload: JsonObject;
}

/**
 * Creates the Drizzle-backed store for human token lifecycle decisions.
 *
 * Owner/maintainer authorization, state transition, and audit event insertion
 * happen inside one transaction. Token hashes and plaintext are never selected.
 *
 * @returns Store implementation for server actions.
 */
export function createDrizzleBubblophyAgentTokenLifecycleStore(): BubblophyAgentTokenLifecycleStore {
  return {
    updateAgentTokenLifecycle,
  };
}

/**
 * Updates a token lifecycle state after project-role authorization.
 *
 * @param input Authenticated human user, token ID, and lifecycle decision.
 * @returns Updated public token metadata or a structured denial.
 */
async function updateAgentTokenLifecycle(
  input: BubblophyAgentTokenLifecycleStoreInput
): ReturnType<BubblophyAgentTokenLifecycleStore['updateAgentTokenLifecycle']> {
  const { db } = await import('@/drizzle/db');

  return db.transaction(async (tx) => {
    const [token] = await tx
      .select({
        id: bubblophyAgentTokens.id,
        label: bubblophyAgentTokens.label,
        projectId: bubblophyAgentTokens.projectId,
        projectKey: bubblophyProjects.key,
        scopes: bubblophyAgentTokens.scopes,
        state: bubblophyAgentTokens.state,
        lastUsedAt: bubblophyAgentTokens.lastUsedAt,
        expiresAt: bubblophyAgentTokens.expiresAt,
      })
      .from(bubblophyAgentTokens)
      .innerJoin(
        bubblophyProjects,
        eq(bubblophyProjects.id, bubblophyAgentTokens.projectId)
      )
      .where(
        and(
          eq(bubblophyAgentTokens.id, input.tokenId),
          eq(bubblophyProjects.isArchived, false)
        )
      )
      .limit(1);

    if (!token) {
      return { status: 'not_found' };
    }

    const [membership] = await tx
      .select({
        authUserId: bubblophyProjectMembers.authUserId,
      })
      .from(bubblophyProjectMembers)
      .where(
        and(
          eq(bubblophyProjectMembers.projectId, token.projectId),
          eq(bubblophyProjectMembers.authUserId, input.authUserId),
          inArray(bubblophyProjectMembers.role, ['owner', 'maintainer'])
        )
      )
      .limit(1);

    if (!membership) {
      return { status: 'forbidden' };
    }

    const transition = getAgentTokenLifecycleTransition({
      decision: input.decision,
      state: token.state,
      expiresAt: token.expiresAt,
    });

    if (transition.status === 'invalid_transition') {
      return transition;
    }

    if (transition.status === 'unchanged') {
      return {
        status: 'unchanged',
        token: toLifecycleStoreResult(token),
      };
    }

    const [updatedToken] = await tx
      .update(bubblophyAgentTokens)
      .set({
        state: transition.nextState,
        revokedAt:
          transition.nextState === 'revoked' ? new Date().toISOString() : null,
      })
      .where(eq(bubblophyAgentTokens.id, token.id))
      .returning({
        id: bubblophyAgentTokens.id,
        label: bubblophyAgentTokens.label,
        scopes: bubblophyAgentTokens.scopes,
        state: bubblophyAgentTokens.state,
        lastUsedAt: bubblophyAgentTokens.lastUsedAt,
        expiresAt: bubblophyAgentTokens.expiresAt,
      });

    if (!updatedToken) {
      throw new Error('Bubblophy agent token update did not return a row.');
    }

    await tx.insert(bubblophyProjectEvents).values(
      buildBubblophyAgentTokenLifecycleProjectEventInsert({
        projectId: token.projectId,
        projectKey: token.projectKey,
        authUserId: input.authUserId,
        tokenId: updatedToken.id,
        tokenLabel: updatedToken.label,
        previousState: token.state,
        nextState: updatedToken.state,
        decision: input.decision,
      })
    );

    return {
      status: 'updated',
      token: toLifecycleStoreResult({
        ...updatedToken,
        projectKey: token.projectKey,
      }),
    };
  });
}

/**
 * Calculates the allowed state transition for one lifecycle decision.
 *
 * @param input Current token state, expiry, and requested decision.
 * @returns Transition target, unchanged marker, or invalid transition reason.
 */
export function getAgentTokenLifecycleTransition(input: {
  decision: BubblophyAgentTokenLifecycleDecision;
  state: 'active' | 'paused' | 'revoked';
  expiresAt: string | null;
}):
  | {
      status: 'change';
      nextState: 'active' | 'paused' | 'revoked';
    }
  | {
      status: 'unchanged';
    }
  | {
      status: 'invalid_transition';
      reason: 'revoked' | 'expired';
    } {
  if (input.state === 'revoked') {
    return input.decision === 'revoke'
      ? { status: 'unchanged' }
      : { status: 'invalid_transition', reason: 'revoked' };
  }

  if (isExpiredTimestamp(input.expiresAt) && input.decision !== 'revoke') {
    return { status: 'invalid_transition', reason: 'expired' };
  }

  if (input.decision === 'pause') {
    return input.state === 'paused'
      ? { status: 'unchanged' }
      : { status: 'change', nextState: 'paused' };
  }

  if (input.decision === 'resume') {
    return input.state === 'active'
      ? { status: 'unchanged' }
      : { status: 'change', nextState: 'active' };
  }

  return { status: 'change', nextState: 'revoked' };
}

/**
 * Builds a project-level audit event for token lifecycle changes.
 *
 * @param input Project, actor, token, and transition metadata.
 * @returns Insert values for `bubblophy_project_events`.
 */
export function buildBubblophyAgentTokenLifecycleProjectEventInsert(input: {
  projectId: string;
  projectKey: string;
  authUserId: string;
  tokenId: string;
  tokenLabel: string;
  previousState: 'active' | 'paused' | 'revoked';
  nextState: 'active' | 'paused' | 'revoked';
  decision: BubblophyAgentTokenLifecycleDecision;
}): BubblophyAgentTokenLifecycleProjectEventInsert {
  return {
    projectId: input.projectId,
    eventType:
      input.decision === 'revoke' ? 'agent_token_revoked' : 'project_updated',
    actorAuthUserId: input.authUserId,
    actorAgentTokenId: null,
    agentRunId: null,
    summary: `Agent-Token "${input.tokenLabel}" für ${input.projectKey}: ${input.previousState} → ${input.nextState}.`,
    payload: {
      source: 'human',
      entity: 'agent_token',
      action: getAuditAction(input.decision),
      projectKey: input.projectKey,
      tokenId: input.tokenId,
      tokenLabel: input.tokenLabel,
      decision: input.decision,
      previousState: input.previousState,
      nextState: input.nextState,
    },
  };
}

/**
 * Maps lifecycle decisions into explicit audit payload actions.
 *
 * @param decision Human lifecycle decision.
 * @returns Past-tense action label for audit consumers.
 */
function getAuditAction(decision: BubblophyAgentTokenLifecycleDecision) {
  if (decision === 'pause') {
    return 'paused';
  }

  if (decision === 'resume') {
    return 'resumed';
  }

  return 'revoked';
}

/**
 * Converts selected token fields into the lifecycle store result shape.
 *
 * @param token Selected or returned token fields.
 * @returns Public lifecycle token row.
 */
function toLifecycleStoreResult(token: {
  id: string;
  label: string;
  projectKey: string;
  scopes: BubblophyAgentTokenLifecycleStoreResult['scopes'];
  state: BubblophyAgentTokenLifecycleStoreResult['state'];
  lastUsedAt: string | null;
  expiresAt: string | null;
}): BubblophyAgentTokenLifecycleStoreResult {
  return {
    id: token.id,
    label: token.label,
    projectKey: token.projectKey,
    scopes: token.scopes,
    state: token.state,
    lastUsedAt: token.lastUsedAt,
    expiresAt: token.expiresAt,
  };
}

/**
 * Detects whether a nullable expiry timestamp is in the past.
 *
 * @param expiresAt Nullable ISO timestamp from the token row.
 * @returns True when the token is expired.
 */
function isExpiredTimestamp(expiresAt: string | null) {
  if (!expiresAt) {
    return false;
  }

  const time = Date.parse(expiresAt);

  return Number.isFinite(time) && time <= Date.now();
}
