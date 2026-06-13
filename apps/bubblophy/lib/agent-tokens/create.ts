import 'server-only';

import type { BubblophyAgentTokenScope } from '@/drizzle/db/schema';
import type { AgentTokenSummary } from '@/lib/dashboard/types';

import { createHash, randomBytes } from 'node:crypto';

export interface CreateBubblophyAgentTokenInput {
  authUserId: string;
  projectKey: string;
  label: string;
  scopes: string[];
  expiresAt?: string;
}

export interface BubblophyAgentTokenCreateStoreInput {
  authUserId: string;
  projectKey: string;
  label: string;
  scopes: BubblophyAgentTokenScope[];
  tokenHash: string;
  expiresAt: string | null;
}

export interface BubblophyAgentTokenCreateStore {
  createAgentToken(input: BubblophyAgentTokenCreateStoreInput): Promise<
    | {
        status: 'created';
        token: {
          id: string;
          label: string;
          projectKey: string;
          scopes: BubblophyAgentTokenScope[];
          state: 'active';
        };
      }
    | {
        status: 'forbidden';
      }
    | {
        status: 'duplicate';
      }
  >;
}

export type CreateBubblophyAgentTokenResult =
  | {
      status: 'created';
      token: AgentTokenSummary & {
        plaintextToken: string;
      };
    }
  | {
      status: 'invalid';
      reason:
        | 'empty_label'
        | 'label_too_long'
        | 'empty_project'
        | 'invalid_project_key'
        | 'invalid_scope'
        | 'empty_scopes'
        | 'invalid_expires_at';
    }
  | {
      status: 'forbidden';
    }
  | {
      status: 'duplicate';
    }
  | {
      status: 'database_unavailable';
    };

export interface CreateBubblophyAgentTokenOptions {
  store?: BubblophyAgentTokenCreateStore;
  tokenFactory?: () => string;
}

const validProjectKeyPattern = /^[A-Z0-9]{2,8}$/;
const maxTokenLabelLength = 80;
const maxTokenLifetimeMs = 1000 * 60 * 60 * 24 * 366;
const allowedScopes = new Set<BubblophyAgentTokenScope>([
  'projects:read',
  'issues:read',
  'issues:write',
  'plans:write',
  'runs:create',
  'runs:update',
] satisfies BubblophyAgentTokenScope[]);

/**
 * Creates a project-scoped agent token for a human owner or maintainer.
 *
 * The plaintext token is generated server-side and returned exactly once in
 * the result. Stores receive only the SHA-256 hash and public token metadata;
 * no agent run or service-role path is involved.
 *
 * @param input Authenticated human user and token draft fields.
 * @param options Optional store and token factory for tests.
 * @returns Structured token creation result.
 */
export async function createBubblophyAgentToken(
  input: CreateBubblophyAgentTokenInput,
  options: CreateBubblophyAgentTokenOptions = {}
): Promise<CreateBubblophyAgentTokenResult> {
  const normalized = normalizeCreateAgentTokenInput(input);

  if (normalized.status === 'invalid') {
    return normalized;
  }

  const store = options.store ?? (await getDefaultCreateStore());

  if (!store) {
    return { status: 'database_unavailable' };
  }

  const plaintextToken =
    options.tokenFactory?.() ?? generateBubblophyAgentPlaintextToken();
  const created = await store.createAgentToken({
    ...normalized.input,
    tokenHash: hashBubblophyAgentToken(plaintextToken),
  });

  if (created.status === 'forbidden') {
    return { status: 'forbidden' };
  }

  if (created.status === 'duplicate') {
    return { status: 'duplicate' };
  }

  return {
    status: 'created',
    token: {
      ...mapCreatedAgentTokenToSummary(created.token),
      plaintextToken,
    },
  };
}

/**
 * Generates a high-entropy Bubblophy agent token for one-time display.
 *
 * @returns Prefixed random token safe for copy-paste into future agent tools.
 */
export function generateBubblophyAgentPlaintextToken() {
  return `bubblophy_agent_${randomBytes(32).toString('base64url')}`;
}

/**
 * Hashes an agent token before persistence.
 *
 * Random high-entropy tokens do not need password-style hashing; SHA-256 keeps
 * database lookup simple without storing the bearer secret.
 *
 * @param plaintextToken One-time token secret.
 * @returns Versioned SHA-256 token hash.
 */
export function hashBubblophyAgentToken(plaintextToken: string) {
  return `sha256:${createHash('sha256').update(plaintextToken).digest('hex')}`;
}

/**
 * Maps a persisted agent token row into the dashboard public summary.
 *
 * @param token Created token metadata returned by a store.
 * @returns Dashboard token summary without any bearer secret.
 */
export function mapCreatedAgentTokenToSummary(token: {
  id: string;
  label: string;
  projectKey: string;
  scopes: BubblophyAgentTokenScope[];
  state: 'active';
}): AgentTokenSummary {
  return {
    id: token.id,
    label: token.label,
    projectKey: token.projectKey,
    scopes: token.scopes,
    state: 'aktiv',
    lastUsedAt: 'noch nie verwendet',
  };
}

/**
 * Validates and normalizes client-provided token creation fields.
 *
 * @param input Raw server action or test input.
 * @returns Store-ready input or a structured validation error.
 */
function normalizeCreateAgentTokenInput(input: CreateBubblophyAgentTokenInput):
  | {
      status: 'valid';
      input: Omit<BubblophyAgentTokenCreateStoreInput, 'tokenHash'>;
    }
  | Extract<CreateBubblophyAgentTokenResult, { status: 'invalid' }> {
  const label = input.label.trim();
  const projectKey = input.projectKey.trim().toUpperCase();
  const scopes = normalizeBubblophyAgentTokenScopes(input.scopes);
  const expiresAt = normalizeAgentTokenExpiry(input.expiresAt);

  if (!label) {
    return { status: 'invalid', reason: 'empty_label' };
  }

  if (label.length > maxTokenLabelLength) {
    return { status: 'invalid', reason: 'label_too_long' };
  }

  if (!projectKey) {
    return { status: 'invalid', reason: 'empty_project' };
  }

  if (!validProjectKeyPattern.test(projectKey)) {
    return { status: 'invalid', reason: 'invalid_project_key' };
  }

  if (scopes.status === 'empty') {
    return { status: 'invalid', reason: 'empty_scopes' };
  }

  if (scopes.status === 'invalid') {
    return { status: 'invalid', reason: 'invalid_scope' };
  }

  if (expiresAt === false) {
    return { status: 'invalid', reason: 'invalid_expires_at' };
  }

  return {
    status: 'valid',
    input: {
      authUserId: input.authUserId,
      projectKey,
      label,
      scopes: scopes.value,
      expiresAt,
    },
  };
}

/**
 * Deduplicates and validates requested token scopes.
 *
 * @param scopes Runtime scope list from the action boundary.
 * @returns Valid scopes, an empty marker, or an invalid marker.
 */
export function normalizeBubblophyAgentTokenScopes(scopes: string[]):
  | {
      status: 'valid';
      value: BubblophyAgentTokenScope[];
    }
  | {
      status: 'empty';
    }
  | {
      status: 'invalid';
    } {
  const normalizedScopes: BubblophyAgentTokenScope[] = [];

  for (const scope of scopes) {
    if (!allowedScopes.has(scope as BubblophyAgentTokenScope)) {
      return { status: 'invalid' };
    }

    const knownScope = scope as BubblophyAgentTokenScope;

    if (!normalizedScopes.includes(knownScope)) {
      normalizedScopes.push(knownScope);
    }
  }

  if (normalizedScopes.length === 0) {
    return { status: 'empty' };
  }

  return {
    status: 'valid',
    value: normalizedScopes,
  };
}

/**
 * Normalizes optional token expiry timestamps.
 *
 * @param value Optional ISO-like expiry string from the client.
 * @returns ISO timestamp, `null` for no expiry, or `false` when invalid.
 */
function normalizeAgentTokenExpiry(value: string | undefined) {
  const trimmedValue = value?.trim() ?? '';

  if (!trimmedValue) {
    return null;
  }

  const expiresAt = new Date(trimmedValue);
  const now = Date.now();
  const expiresAtMs = expiresAt.getTime();

  if (
    Number.isNaN(expiresAtMs) ||
    expiresAtMs <= now ||
    expiresAtMs - now > maxTokenLifetimeMs
  ) {
    return false;
  }

  return expiresAt.toISOString();
}

/**
 * Loads the Drizzle-backed token store only when a database URL exists.
 *
 * @returns Server-only create store, or `null` in sample/fallback mode.
 */
async function getDefaultCreateStore(): Promise<BubblophyAgentTokenCreateStore | null> {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  const { createDrizzleBubblophyAgentTokenCreateStore } =
    await import('@/lib/agent-tokens/database-write');

  return createDrizzleBubblophyAgentTokenCreateStore();
}
