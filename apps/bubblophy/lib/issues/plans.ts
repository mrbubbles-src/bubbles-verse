import 'server-only';

export interface CreateOrUpdateBubblophyIssuePlanDraftInput {
  authUserId: string;
  issueId: string;
  summary?: string;
  steps: string[];
}

export interface BubblophyIssuePlanStep {
  id: string;
  text: string;
}

export interface BubblophyIssuePlanDraft {
  issueId: string;
  version: number;
  summary: string;
  steps: BubblophyIssuePlanStep[];
}

export interface BubblophyIssuePlanDraftStoreInput {
  authUserId: string;
  issueId: string;
  summary: string;
  steps: BubblophyIssuePlanStep[];
}

export interface BubblophyIssuePlanDraftStore {
  createIssuePlanVersionWithEvent(
    input: BubblophyIssuePlanDraftStoreInput
  ): Promise<
    | {
        status: 'created';
        plan: BubblophyIssuePlanDraft;
      }
    | {
        status: 'not_found';
      }
    | {
        status: 'forbidden';
      }
  >;
}

export type CreateOrUpdateBubblophyIssuePlanDraftResult =
  | {
      status: 'created';
      plan: BubblophyIssuePlanDraft;
    }
  | {
      status: 'invalid';
      reason:
        | 'empty_issue'
        | 'empty_steps'
        | 'too_many_steps'
        | 'step_too_long'
        | 'summary_too_long';
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

export interface CreateOrUpdateBubblophyIssuePlanDraftOptions {
  store?: BubblophyIssuePlanDraftStore;
}

const maxPlanSteps = 12;
const maxPlanStepLength = 280;
const maxPlanSummaryLength = 240;

/**
 * Creates a new human-authored issue plan draft version.
 *
 * The operation validates bounded plan input, delegates issue membership checks
 * to the server-only store, writes a plan version plus audit event, and never
 * starts an agent run.
 *
 * @param input Authenticated user ID, issue key, summary, and plan steps.
 * @param options Optional store override for tests.
 * @returns Structured result with the created plan draft on success.
 */
export async function createOrUpdateBubblophyIssuePlanDraft(
  input: CreateOrUpdateBubblophyIssuePlanDraftInput,
  options: CreateOrUpdateBubblophyIssuePlanDraftOptions = {}
): Promise<CreateOrUpdateBubblophyIssuePlanDraftResult> {
  const normalized = normalizeIssuePlanDraftInput(input);

  if (normalized.status === 'invalid') {
    return normalized;
  }

  const store = options.store ?? (await getDefaultPlanDraftStore());

  if (!store) {
    return { status: 'database_unavailable' };
  }

  return store.createIssuePlanVersionWithEvent(normalized.input);
}

/**
 * Builds stable, bounded plan step DTOs from user-entered text.
 *
 * @param steps Raw step text values from UI or tests.
 * @returns Trimmed step DTOs with one-based stable IDs.
 */
export function normalizeBubblophyIssuePlanSteps(
  steps: string[]
): BubblophyIssuePlanStep[] {
  return steps
    .map((step) => step.trim())
    .filter(Boolean)
    .map((text, index) => ({
      id: `step_${index + 1}`,
      text,
    }));
}

/**
 * Converts raw plan input into store-safe values.
 *
 * @param input Raw create/update input.
 * @returns Validated store input or a structured validation error.
 */
function normalizeIssuePlanDraftInput(
  input: CreateOrUpdateBubblophyIssuePlanDraftInput
):
  | {
      status: 'valid';
      input: BubblophyIssuePlanDraftStoreInput;
    }
  | Extract<
      CreateOrUpdateBubblophyIssuePlanDraftResult,
      { status: 'invalid' }
    > {
  const issueId = input.issueId.trim();
  const summary = input.summary?.trim() ?? '';
  const steps = normalizeBubblophyIssuePlanSteps(input.steps);

  if (!issueId) {
    return { status: 'invalid', reason: 'empty_issue' };
  }

  if (summary.length > maxPlanSummaryLength) {
    return { status: 'invalid', reason: 'summary_too_long' };
  }

  if (steps.length === 0) {
    return { status: 'invalid', reason: 'empty_steps' };
  }

  if (steps.length > maxPlanSteps) {
    return { status: 'invalid', reason: 'too_many_steps' };
  }

  if (steps.some((step) => step.text.length > maxPlanStepLength)) {
    return { status: 'invalid', reason: 'step_too_long' };
  }

  return {
    status: 'valid',
    input: {
      authUserId: input.authUserId,
      issueId,
      summary,
      steps,
    },
  };
}

/**
 * Loads the Drizzle-backed issue plan store only when a database URL exists.
 *
 * @returns Server-only plan draft store, or `null` in sample/fallback mode.
 */
async function getDefaultPlanDraftStore(): Promise<BubblophyIssuePlanDraftStore | null> {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  const { createDrizzleBubblophyIssuePlanDraftStore } =
    await import('@/lib/issues/plan-database-write');

  return createDrizzleBubblophyIssuePlanDraftStore();
}
