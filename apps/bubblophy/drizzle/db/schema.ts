import type { AnyPgColumn } from 'drizzle-orm/pg-core';

import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonObject
  | JsonValue[];

export interface JsonObject {
  [key: string]: JsonValue;
}

export const bubblophyProjectRole = pgEnum('bubblophy_project_role', [
  'owner',
  'maintainer',
  'member',
  'viewer',
]);

export const bubblophyIssueStatus = pgEnum('bubblophy_issue_status', [
  'triage',
  'planned',
  'ready',
  'in_progress',
  'review',
  'blocked',
  'done',
]);

export type BubblophyIssueStatus =
  (typeof bubblophyIssueStatus.enumValues)[number];

export const bubblophyIssuePriority = pgEnum('bubblophy_issue_priority', [
  'low',
  'medium',
  'high',
]);

export type BubblophyIssuePriority =
  (typeof bubblophyIssuePriority.enumValues)[number];

export const bubblophyIssueEventType = pgEnum('bubblophy_issue_event_type', [
  'created',
  'status_changed',
  'plan_updated',
  'human_approved',
  'agent_token_created',
  'agent_run_requested',
  'agent_run_event',
  'commented',
]);

export const bubblophyAgentTokenState = pgEnum('bubblophy_agent_token_state', [
  'active',
  'paused',
  'revoked',
]);

export const bubblophyAgentRunState = pgEnum('bubblophy_agent_run_state', [
  'requested',
  'approved',
  'running',
  'needs_review',
  'completed',
  'cancelled',
  'failed',
]);

export const bubblophyAgentTokenScopes = [
  'projects:read',
  'issues:read',
  'issues:write',
  'plans:write',
  'runs:create',
  'runs:update',
] as const;

export type BubblophyAgentTokenScope =
  (typeof bubblophyAgentTokenScopes)[number];

export const bubblophyProjects = pgTable(
  'bubblophy_projects',
  {
    id: text()
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    slug: text().notNull(),
    key: text().notNull(),
    name: text().notNull(),
    description: text().notNull().default(''),
    repositoryUrl: text('repository_url'),
    isArchived: boolean('is_archived').notNull().default(false),
    createdByAuthUserId: text('created_by_auth_user_id').notNull(),
    createdAt: timestamp('created_at', { mode: 'string', precision: 3 })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string', precision: 3 })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    slugIdx: uniqueIndex('bubblophy_projects_slug_idx').on(table.slug),
    keyIdx: uniqueIndex('bubblophy_projects_key_idx').on(table.key),
  })
);

export const bubblophyProjectMembers = pgTable(
  'bubblophy_project_members',
  {
    projectId: text('project_id')
      .notNull()
      .references(() => bubblophyProjects.id, { onDelete: 'cascade' }),
    authUserId: text('auth_user_id').notNull(),
    role: bubblophyProjectRole().notNull().default('member'),
    createdAt: timestamp('created_at', { mode: 'string', precision: 3 })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    pk: primaryKey({
      name: 'bubblophy_project_members_pkey',
      columns: [table.projectId, table.authUserId],
    }),
    authUserIdx: index('bubblophy_project_members_auth_user_idx').on(
      table.authUserId
    ),
  })
);

export const bubblophyIssues = pgTable(
  'bubblophy_issues',
  {
    id: text()
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    projectId: text('project_id')
      .notNull()
      .references(() => bubblophyProjects.id, { onDelete: 'cascade' }),
    parentIssueId: text('parent_issue_id').references(
      (): AnyPgColumn => bubblophyIssues.id,
      { onDelete: 'set null' }
    ),
    issueNumber: integer('issue_number').notNull(),
    title: text().notNull(),
    description: text().notNull().default(''),
    status: bubblophyIssueStatus().notNull().default('triage'),
    priority: bubblophyIssuePriority().notNull().default('medium'),
    createdByAuthUserId: text('created_by_auth_user_id').notNull(),
    assignedAuthUserId: text('assigned_auth_user_id'),
    requiresHumanApproval: boolean('requires_human_approval')
      .notNull()
      .default(true),
    createdAt: timestamp('created_at', { mode: 'string', precision: 3 })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string', precision: 3 })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    projectNumberIdx: uniqueIndex('bubblophy_issues_project_number_idx').on(
      table.projectId,
      table.issueNumber
    ),
    projectStatusIdx: index('bubblophy_issues_project_status_idx').on(
      table.projectId,
      table.status
    ),
    parentIssueIdx: index('bubblophy_issues_parent_issue_idx').on(
      table.parentIssueId
    ),
    assignedUserIdx: index('bubblophy_issues_assigned_user_idx').on(
      table.assignedAuthUserId
    ),
  })
);

export const bubblophyIssuePlans = pgTable(
  'bubblophy_issue_plans',
  {
    id: text()
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    issueId: text('issue_id')
      .notNull()
      .references(() => bubblophyIssues.id, { onDelete: 'cascade' }),
    version: integer().notNull().default(1),
    summary: text().notNull().default(''),
    steps: jsonb().$type<JsonValue>().notNull(),
    createdByAuthUserId: text('created_by_auth_user_id'),
    createdByAgentTokenId: text('created_by_agent_token_id'),
    approvedByAuthUserId: text('approved_by_auth_user_id'),
    approvedAt: timestamp('approved_at', { mode: 'string', precision: 3 }),
    createdAt: timestamp('created_at', { mode: 'string', precision: 3 })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    issueVersionIdx: uniqueIndex('bubblophy_issue_plans_issue_version_idx').on(
      table.issueId,
      table.version
    ),
    approvedIdx: index('bubblophy_issue_plans_approved_idx').on(
      table.approvedAt
    ),
  })
);

export const bubblophyAgentTokens = pgTable(
  'bubblophy_agent_tokens',
  {
    id: text()
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    projectId: text('project_id')
      .notNull()
      .references(() => bubblophyProjects.id, { onDelete: 'cascade' }),
    label: text().notNull(),
    tokenHash: text('token_hash').notNull(),
    scopes: jsonb().$type<BubblophyAgentTokenScope[]>().notNull(),
    state: bubblophyAgentTokenState().notNull().default('active'),
    createdByAuthUserId: text('created_by_auth_user_id').notNull(),
    lastUsedAt: timestamp('last_used_at', { mode: 'string', precision: 3 }),
    expiresAt: timestamp('expires_at', { mode: 'string', precision: 3 }),
    revokedAt: timestamp('revoked_at', { mode: 'string', precision: 3 }),
    createdAt: timestamp('created_at', { mode: 'string', precision: 3 })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    tokenHashIdx: uniqueIndex('bubblophy_agent_tokens_token_hash_idx').on(
      table.tokenHash
    ),
    projectStateIdx: index('bubblophy_agent_tokens_project_state_idx').on(
      table.projectId,
      table.state
    ),
  })
);

export const bubblophyAgentRuns = pgTable(
  'bubblophy_agent_runs',
  {
    id: text()
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    issueId: text('issue_id')
      .notNull()
      .references(() => bubblophyIssues.id, { onDelete: 'cascade' }),
    agentTokenId: text('agent_token_id')
      .notNull()
      .references(() => bubblophyAgentTokens.id, { onDelete: 'restrict' }),
    state: bubblophyAgentRunState().notNull().default('requested'),
    requestedByAuthUserId: text('requested_by_auth_user_id').notNull(),
    approvedByAuthUserId: text('approved_by_auth_user_id'),
    approvedAt: timestamp('approved_at', { mode: 'string', precision: 3 }),
    startedAt: timestamp('started_at', { mode: 'string', precision: 3 }),
    finishedAt: timestamp('finished_at', { mode: 'string', precision: 3 }),
    result: jsonb().$type<JsonValue>(),
    createdAt: timestamp('created_at', { mode: 'string', precision: 3 })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string', precision: 3 })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    issueStateIdx: index('bubblophy_agent_runs_issue_state_idx').on(
      table.issueId,
      table.state
    ),
    agentTokenIdx: index('bubblophy_agent_runs_agent_token_idx').on(
      table.agentTokenId
    ),
  })
);

export const bubblophyIssueEvents = pgTable(
  'bubblophy_issue_events',
  {
    id: text()
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    issueId: text('issue_id')
      .notNull()
      .references(() => bubblophyIssues.id, { onDelete: 'cascade' }),
    eventType: bubblophyIssueEventType('event_type').notNull(),
    actorAuthUserId: text('actor_auth_user_id'),
    actorAgentTokenId: text('actor_agent_token_id').references(
      () => bubblophyAgentTokens.id,
      { onDelete: 'set null' }
    ),
    agentRunId: text('agent_run_id').references(() => bubblophyAgentRuns.id, {
      onDelete: 'set null',
    }),
    summary: text().notNull(),
    payload: jsonb().$type<JsonValue>().notNull().default({}),
    createdAt: timestamp('created_at', { mode: 'string', precision: 3 })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    issueCreatedIdx: index('bubblophy_issue_events_issue_created_idx').on(
      table.issueId,
      table.createdAt
    ),
    actorAuthUserIdx: index('bubblophy_issue_events_actor_auth_user_idx').on(
      table.actorAuthUserId
    ),
    actorAgentTokenIdx: index(
      'bubblophy_issue_events_actor_agent_token_idx'
    ).on(table.actorAgentTokenId),
    agentRunIdx: index('bubblophy_issue_events_agent_run_idx').on(
      table.agentRunId
    ),
  })
);
