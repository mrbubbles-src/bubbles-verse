import { relations } from 'drizzle-orm';

import {
  bubblophyAgentRuns,
  bubblophyAgentTokens,
  bubblophyIssueEvents,
  bubblophyIssuePlans,
  bubblophyIssues,
  bubblophyProjectMembers,
  bubblophyProjects,
} from '@/drizzle/db/schema';

export const bubblophyProjectRelations = relations(
  bubblophyProjects,
  ({ many }) => ({
    members: many(bubblophyProjectMembers),
    issues: many(bubblophyIssues),
    agentTokens: many(bubblophyAgentTokens),
  })
);

export const bubblophyProjectMemberRelations = relations(
  bubblophyProjectMembers,
  ({ one }) => ({
    project: one(bubblophyProjects, {
      fields: [bubblophyProjectMembers.projectId],
      references: [bubblophyProjects.id],
    }),
  })
);

export const bubblophyIssueRelations = relations(
  bubblophyIssues,
  ({ many, one }) => ({
    project: one(bubblophyProjects, {
      fields: [bubblophyIssues.projectId],
      references: [bubblophyProjects.id],
    }),
    plans: many(bubblophyIssuePlans),
    events: many(bubblophyIssueEvents),
    runs: many(bubblophyAgentRuns),
  })
);

export const bubblophyIssuePlanRelations = relations(
  bubblophyIssuePlans,
  ({ one }) => ({
    issue: one(bubblophyIssues, {
      fields: [bubblophyIssuePlans.issueId],
      references: [bubblophyIssues.id],
    }),
  })
);

export const bubblophyAgentTokenRelations = relations(
  bubblophyAgentTokens,
  ({ many, one }) => ({
    project: one(bubblophyProjects, {
      fields: [bubblophyAgentTokens.projectId],
      references: [bubblophyProjects.id],
    }),
    runs: many(bubblophyAgentRuns),
    events: many(bubblophyIssueEvents),
  })
);

export const bubblophyAgentRunRelations = relations(
  bubblophyAgentRuns,
  ({ many, one }) => ({
    issue: one(bubblophyIssues, {
      fields: [bubblophyAgentRuns.issueId],
      references: [bubblophyIssues.id],
    }),
    agentToken: one(bubblophyAgentTokens, {
      fields: [bubblophyAgentRuns.agentTokenId],
      references: [bubblophyAgentTokens.id],
    }),
    events: many(bubblophyIssueEvents),
  })
);

export const bubblophyIssueEventRelations = relations(
  bubblophyIssueEvents,
  ({ one }) => ({
    issue: one(bubblophyIssues, {
      fields: [bubblophyIssueEvents.issueId],
      references: [bubblophyIssues.id],
    }),
    agentToken: one(bubblophyAgentTokens, {
      fields: [bubblophyIssueEvents.actorAgentTokenId],
      references: [bubblophyAgentTokens.id],
    }),
    agentRun: one(bubblophyAgentRuns, {
      fields: [bubblophyIssueEvents.agentRunId],
      references: [bubblophyAgentRuns.id],
    }),
  })
);
