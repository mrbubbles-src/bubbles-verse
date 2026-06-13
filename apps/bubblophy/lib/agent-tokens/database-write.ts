import 'server-only';

import type { JsonObject } from '@/drizzle/db/schema';
import type {
  BubblophyAgentTokenCreateStore,
  BubblophyAgentTokenCreateStoreInput,
} from '@/lib/agent-tokens/create';

import { and, eq, inArray } from 'drizzle-orm';

import {
  bubblophyAgentTokens,
  bubblophyProjectEvents,
  bubblophyProjectMembers,
  bubblophyProjects,
} from '@/drizzle/db/schema';

export interface BubblophyAgentTokenCreatedProjectEventInsert {
  projectId: string;
  eventType: 'agent_token_created';
  actorAuthUserId: string;
  actorAgentTokenId: null;
  agentRunId: null;
  summary: string;
  payload: JsonObject;
}

/**
 * Creates the Drizzle-backed store for human-created agent tokens.
 *
 * Authorization is limited to project owners and maintainers. Token insert and
 * project-level audit event are written in one transaction. The event payload
 * contains public token metadata only, never plaintext or token hash.
 *
 * @returns Store implementation for server actions.
 */
export function createDrizzleBubblophyAgentTokenCreateStore(): BubblophyAgentTokenCreateStore {
  return {
    createAgentToken,
  };
}

/**
 * Creates an agent token after owner/maintainer authorization.
 *
 * @param input Authenticated human user and normalized token fields.
 * @returns Created token metadata, duplicate, or forbidden.
 */
async function createAgentToken(
  input: BubblophyAgentTokenCreateStoreInput
): ReturnType<BubblophyAgentTokenCreateStore['createAgentToken']> {
  const { db } = await import('@/drizzle/db');

  try {
    return await db.transaction(async (tx) => {
      const [project] = await tx
        .select({
          id: bubblophyProjects.id,
          key: bubblophyProjects.key,
          name: bubblophyProjects.name,
        })
        .from(bubblophyProjects)
        .innerJoin(
          bubblophyProjectMembers,
          and(
            eq(bubblophyProjectMembers.projectId, bubblophyProjects.id),
            eq(bubblophyProjectMembers.authUserId, input.authUserId),
            inArray(bubblophyProjectMembers.role, ['owner', 'maintainer'])
          )
        )
        .where(
          and(
            eq(bubblophyProjects.key, input.projectKey),
            eq(bubblophyProjects.isArchived, false)
          )
        )
        .limit(1);

      if (!project) {
        return { status: 'forbidden' };
      }

      const [token] = await tx
        .insert(bubblophyAgentTokens)
        .values({
          projectId: project.id,
          label: input.label,
          tokenHash: input.tokenHash,
          scopes: input.scopes,
          state: 'active',
          createdByAuthUserId: input.authUserId,
          expiresAt: input.expiresAt,
        })
        .returning({
          id: bubblophyAgentTokens.id,
          label: bubblophyAgentTokens.label,
          scopes: bubblophyAgentTokens.scopes,
          state: bubblophyAgentTokens.state,
        });

      if (!token) {
        throw new Error('Bubblophy agent token insert did not return a row.');
      }

      await tx.insert(bubblophyProjectEvents).values(
        buildBubblophyAgentTokenCreatedProjectEventInsert({
          projectId: project.id,
          authUserId: input.authUserId,
          projectKey: project.key,
          tokenId: token.id,
          tokenLabel: token.label,
          scopes: token.scopes,
          expiresAt: input.expiresAt,
        })
      );

      return {
        status: 'created',
        token: {
          id: token.id,
          label: token.label,
          projectKey: project.key,
          scopes: token.scopes,
          state: 'active',
        },
      };
    });
  } catch (error) {
    if (hasPostgresErrorCode(error, '23505')) {
      return { status: 'duplicate' };
    }

    throw error;
  }
}

/**
 * Builds a project-level `agent_token_created` audit event.
 *
 * The payload intentionally contains only public metadata. Token plaintext and
 * hash stay outside audit rows, logs, and client-visible summaries.
 *
 * @param input Project, actor, token, scope, and optional expiry metadata.
 * @returns Insert values for `bubblophy_project_events`.
 */
export function buildBubblophyAgentTokenCreatedProjectEventInsert(input: {
  projectId: string;
  authUserId: string;
  projectKey: string;
  tokenId: string;
  tokenLabel: string;
  scopes: string[];
  expiresAt: string | null;
}): BubblophyAgentTokenCreatedProjectEventInsert {
  return {
    projectId: input.projectId,
    eventType: 'agent_token_created',
    actorAuthUserId: input.authUserId,
    actorAgentTokenId: null,
    agentRunId: null,
    summary: `Agent-Token "${input.tokenLabel}" für ${input.projectKey} erstellt.`,
    payload: {
      source: 'human',
      projectKey: input.projectKey,
      tokenId: input.tokenId,
      tokenLabel: input.tokenLabel,
      scopes: input.scopes,
      expiresAt: input.expiresAt,
    },
  };
}

/**
 * Detects a Postgres error code on thrown DB errors.
 *
 * @param error Thrown DB error from the current mutation.
 * @param code Postgres error code to match.
 * @returns `true` when the error exposes the requested code.
 */
function hasPostgresErrorCode(error: unknown, code: string) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string' &&
    error.code === code
  );
}
