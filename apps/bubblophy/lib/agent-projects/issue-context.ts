import 'server-only';

import type {
  BubblophyIssuePriority,
  BubblophyIssueStatus,
} from '@/drizzle/db/schema';
import type { IssuePlanStepSummary } from '@/lib/dashboard/types';

import { hashBubblophyAgentToken } from '@/lib/agent-tokens/create';

export interface ReadBubblophyAgentProjectIssuesInput {
  projectId: string;
  bearerToken: string;
}

export interface BubblophyAgentProjectIssueContext {
  project: {
    id: string;
    key: string;
    name: string;
  };
  issues: {
    id: string;
    title: string;
    description: string;
    status: BubblophyIssueStatus;
    priority: BubblophyIssuePriority;
    assignee: 'assigned' | 'unassigned';
    latestPlan: {
      version: number;
      summary: string;
      steps: IssuePlanStepSummary[];
    } | null;
  }[];
}

export interface BubblophyAgentProjectIssuesStoreInput {
  projectId: string;
  tokenHash: string;
}

export interface BubblophyAgentProjectIssuesStore {
  readProjectIssuesForAgent(input: BubblophyAgentProjectIssuesStoreInput): Promise<
    | {
        status: 'found';
        context: BubblophyAgentProjectIssueContext;
      }
    | {
        status: 'invalid_token';
      }
    | {
        status: 'token_unavailable';
        reason: 'paused' | 'revoked' | 'expired';
      }
    | {
        status: 'forbidden_scope';
      }
    | {
        status: 'not_found';
      }
    | {
        status: 'project_mismatch';
      }
  >;
}

export type ReadBubblophyAgentProjectIssuesResult =
  | {
      status: 'found';
      context: BubblophyAgentProjectIssueContext;
    }
  | {
      status: 'invalid';
      reason: 'empty_project' | 'empty_token';
    }
  | {
      status: 'invalid_token';
    }
  | {
      status: 'token_unavailable';
      reason: 'paused' | 'revoked' | 'expired';
    }
  | {
      status: 'forbidden_scope';
    }
  | {
      status: 'not_found';
    }
  | {
      status: 'project_mismatch';
    }
  | {
      status: 'database_unavailable';
    };

export interface ReadBubblophyAgentProjectIssuesOptions {
  store?: BubblophyAgentProjectIssuesStore;
}

/**
 * Reads open issue context for the project bound to one agent token.
 *
 * The service authenticates with a bearer token hash and delegates project,
 * token state, scope, and expiry checks to the persistence store. It exposes
 * only project, issue, and latest-plan fields and never starts agent work.
 *
 * @param input Project ID and bearer token from the agent request.
 * @param options Optional store override for tests.
 * @returns Minimal project issue context or a structured auth/read failure.
 */
export async function readBubblophyAgentProjectIssues(
  input: ReadBubblophyAgentProjectIssuesInput,
  options: ReadBubblophyAgentProjectIssuesOptions = {}
): Promise<ReadBubblophyAgentProjectIssuesResult> {
  const normalized = normalizeAgentProjectIssuesInput(input);

  if (normalized.status === 'invalid') {
    return normalized;
  }

  const store = options.store ?? (await getDefaultAgentProjectIssuesStore());

  if (!store) {
    return { status: 'database_unavailable' };
  }

  return store.readProjectIssuesForAgent(normalized.input);
}

/**
 * Converts raw route input into store-safe project issue read values.
 *
 * @param input Raw route values.
 * @returns Valid store input or structured validation error.
 */
function normalizeAgentProjectIssuesInput(
  input: ReadBubblophyAgentProjectIssuesInput
):
  | {
      status: 'valid';
      input: BubblophyAgentProjectIssuesStoreInput;
    }
  | Extract<ReadBubblophyAgentProjectIssuesResult, { status: 'invalid' }> {
  const projectId = input.projectId.trim();
  const bearerToken = input.bearerToken.trim();

  if (!projectId) {
    return { status: 'invalid', reason: 'empty_project' };
  }

  if (!bearerToken) {
    return { status: 'invalid', reason: 'empty_token' };
  }

  return {
    status: 'valid',
    input: {
      projectId,
      tokenHash: hashBubblophyAgentToken(bearerToken),
    },
  };
}

/**
 * Loads the Drizzle store only when database access is configured.
 *
 * @returns Server-only project issue context store, or `null`.
 */
async function getDefaultAgentProjectIssuesStore(): Promise<BubblophyAgentProjectIssuesStore | null> {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  const { createDrizzleBubblophyAgentProjectIssuesStore } = await import(
    '@/lib/agent-projects/issue-context-database-read'
  );

  return createDrizzleBubblophyAgentProjectIssuesStore();
}
