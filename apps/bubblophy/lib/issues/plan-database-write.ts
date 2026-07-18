import 'server-only';

import type { JsonObject, JsonValue } from '@/drizzle/db/schema';
import type {
  BubblophyIssuePlanDraftStore,
  BubblophyIssuePlanDraftStoreInput,
} from '@/lib/issues/plans';

import { lockBubblophyIssueContributorWriteContext } from '@/lib/issues/contributor-write-context-database';

import { desc, eq } from 'drizzle-orm';

import { bubblophyIssueEvents, bubblophyIssuePlans } from '@/drizzle/db/schema';

export interface BubblophyIssuePlanUpdatedEventInsert {
  issueId: string;
  eventType: 'plan_updated';
  actorAuthUserId: string;
  actorOauthClientId: string | null;
  actorAgentTokenId: null;
  agentRunId: null;
  summary: string;
  payload: JsonObject;
}

interface BubblophyIssueKeyParts {
  projectKey: string;
  issueNumber: number;
}

type BubblophyDatabase = (typeof import('@/drizzle/db'))['db'];

/**
 * Creates the Drizzle-backed store for human-authored issue plan drafts.
 *
 * @returns Store implementation for server actions.
 */
export function createDrizzleBubblophyIssuePlanDraftStore(): BubblophyIssuePlanDraftStore {
  let databasePromise: Promise<BubblophyDatabase> | null = null;

  /** Reuses one database module resolution across concurrent store writes. */
  function getDatabase() {
    databasePromise ??= import('@/drizzle/db').then(({ db }) => db);
    return databasePromise;
  }

  return {
    createIssuePlanVersionWithEvent: (input) =>
      createIssuePlanVersionWithEvent(input, getDatabase()),
  };
}

/**
 * Creates a new plan version and audit event after locked authorization checks.
 *
 * A shared project lock keeps archival state stable without blocking project
 * event foreign-key checks. The issue lock serializes version allocation, and
 * the membership lock prevents role removal or changes from racing the write.
 *
 * @param input Authenticated human user and normalized plan draft fields.
 * @returns Created plan, `not_found`, or `forbidden`.
 */
async function createIssuePlanVersionWithEvent(
  input: BubblophyIssuePlanDraftStoreInput,
  databasePromise: Promise<BubblophyDatabase>
): ReturnType<BubblophyIssuePlanDraftStore['createIssuePlanVersionWithEvent']> {
  const issueKey = parseBubblophyIssueKey(input.issueId);

  if (!issueKey) {
    return { status: 'not_found' };
  }

  const db = await databasePromise;

  return db.transaction(async (tx) => {
    const context = await lockBubblophyIssueContributorWriteContext(tx, {
      authUserId: input.authUserId,
      projectKey: issueKey.projectKey,
      issueNumber: issueKey.issueNumber,
    });

    if (context.status !== 'ready') {
      return context;
    }

    const [lastPlan] = await tx
      .select({
        version: bubblophyIssuePlans.version,
      })
      .from(bubblophyIssuePlans)
      .where(eq(bubblophyIssuePlans.issueId, context.issueDatabaseId))
      .orderBy(desc(bubblophyIssuePlans.version))
      .limit(1);

    const version = getNextBubblophyIssuePlanVersion(lastPlan?.version);

    const [plan] = await tx
      .insert(bubblophyIssuePlans)
      .values(
        buildBubblophyIssuePlanInsert({
          issueDatabaseId: context.issueDatabaseId,
          authUserId: input.authUserId,
          oauthClientId: input.oauthClientId,
          version,
          summary: input.summary,
          steps: input.steps,
        })
      )
      .returning({
        version: bubblophyIssuePlans.version,
        summary: bubblophyIssuePlans.summary,
        steps: bubblophyIssuePlans.steps,
      });

    if (!plan) {
      throw new Error('Bubblophy issue plan insert did not return a row.');
    }

    await tx.insert(bubblophyIssueEvents).values(
      buildBubblophyIssuePlanUpdatedEventInsert({
        issueDatabaseId: context.issueDatabaseId,
        authUserId: input.authUserId,
        oauthClientId: input.oauthClientId,
        issueId: input.issueId,
        version,
        stepCount: input.steps.length,
      })
    );

    return {
      status: 'created',
      plan: {
        issueId: input.issueId,
        version: plan.version,
        summary: plan.summary,
        steps: input.steps,
      },
    };
  });
}

/**
 * Builds one unapproved plan-version insert with optional OAuth attribution.
 *
 * @param input Issue, actor, content, and version for the new draft.
 * @returns Insert values for `bubblophy_issue_plans`.
 */
export function buildBubblophyIssuePlanInsert(input: {
  issueDatabaseId: string;
  authUserId: string;
  oauthClientId?: string;
  version: number;
  summary: string;
  steps: BubblophyIssuePlanDraftStoreInput['steps'];
}) {
  return {
    issueId: input.issueDatabaseId,
    version: input.version,
    summary: input.summary,
    steps: buildBubblophyIssuePlanStepsJson(input.steps),
    createdByAuthUserId: input.authUserId,
    createdByOauthClientId: input.oauthClientId ?? null,
    createdByAgentTokenId: null,
    approvedByAuthUserId: null,
    approvedAt: null,
  };
}

/**
 * Parses a human-facing issue key such as `BV-12`.
 *
 * @param issueId Issue identifier from the dashboard.
 * @returns Project key and issue number, or `null` for malformed IDs.
 */
export function parseBubblophyIssueKey(
  issueId: string
): BubblophyIssueKeyParts | null {
  const match = /^(?<projectKey>[A-Z0-9]{2,8})-(?<issueNumber>\d+)$/.exec(
    issueId.trim()
  );

  if (!match?.groups) {
    return null;
  }

  const projectKey = match.groups.projectKey;
  const issueNumberText = match.groups.issueNumber;

  if (!projectKey || !issueNumberText) {
    return null;
  }

  const issueNumber = Number.parseInt(issueNumberText, 10);

  if (!Number.isSafeInteger(issueNumber) || issueNumber < 1) {
    return null;
  }

  return {
    projectKey,
    issueNumber,
  };
}

/**
 * Calculates the next per-issue plan version.
 *
 * @param lastVersion Highest existing plan version for the issue.
 * @returns Next plan version, starting at `1`.
 */
export function getNextBubblophyIssuePlanVersion(
  lastVersion: number | null | undefined
) {
  return (lastVersion ?? 0) + 1;
}

/**
 * Builds the insert values for a human `plan_updated` audit event.
 *
 * @param input Issue, actor, version, and step count for the new plan.
 * @returns Insert values for `bubblophy_issue_events`.
 */
export function buildBubblophyIssuePlanUpdatedEventInsert(input: {
  issueDatabaseId: string;
  authUserId: string;
  oauthClientId?: string;
  issueId: string;
  version: number;
  stepCount: number;
}): BubblophyIssuePlanUpdatedEventInsert {
  return {
    issueId: input.issueDatabaseId,
    eventType: 'plan_updated',
    actorAuthUserId: input.authUserId,
    actorOauthClientId: input.oauthClientId ?? null,
    actorAgentTokenId: null,
    agentRunId: null,
    summary: `Plan ${input.issueId} v${input.version} aktualisiert.`,
    payload: {
      source: input.oauthClientId ? 'oauth_mcp' : 'human',
      issueId: input.issueId,
      version: input.version,
      stepCount: input.stepCount,
    },
  };
}

/**
 * Converts typed plan steps into JSONB-safe plain objects.
 *
 * @param steps Normalized plan step DTOs.
 * @returns JSON value accepted by the Drizzle `jsonb` column.
 */
function buildBubblophyIssuePlanStepsJson(
  steps: BubblophyIssuePlanDraftStoreInput['steps']
): JsonValue {
  return steps.map((step) => ({
    id: step.id,
    text: step.text,
  })) satisfies JsonObject[];
}
