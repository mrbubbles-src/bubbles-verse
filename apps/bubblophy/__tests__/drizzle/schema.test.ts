import { getTableColumns, getTableName } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import {
  bubblophyAgentTokens,
  bubblophyAgentTokenScopes,
  bubblophyIssueEvents,
  bubblophyIssuePlans,
  bubblophyIssues,
  bubblophyProjectEvents,
  bubblophyProjectMembers,
  bubblophyProjects,
} from '@/drizzle/db/schema';

describe('bubblophy schema', () => {
  it('keeps the core orchestration tables under the Bubblophy namespace', () => {
    expect(getTableName(bubblophyProjects)).toBe('bubblophy_projects');
    expect(getTableName(bubblophyProjectMembers)).toBe(
      'bubblophy_project_members'
    );
    expect(getTableName(bubblophyIssues)).toBe('bubblophy_issues');
    expect(getTableName(bubblophyIssuePlans)).toBe('bubblophy_issue_plans');
    expect(getTableName(bubblophyIssueEvents)).toBe('bubblophy_issue_events');
    expect(getTableName(bubblophyProjectEvents)).toBe(
      'bubblophy_project_events'
    );
    expect(getTableName(bubblophyAgentTokens)).toBe('bubblophy_agent_tokens');
  });

  it('exposes only explicit agent token scopes for API and MCP clients', () => {
    expect(bubblophyAgentTokenScopes).toEqual([
      'projects:read',
      'issues:read',
      'issues:write',
      'plans:write',
      'runs:create',
      'runs:update',
    ]);
  });

  it('keeps OAuth client attribution separate from human and agent actors', () => {
    expect(getTableColumns(bubblophyIssuePlans)).toHaveProperty(
      'createdByOauthClientId'
    );
    expect(getTableColumns(bubblophyIssueEvents)).toHaveProperty(
      'actorOauthClientId'
    );
    expect(getTableColumns(bubblophyProjectEvents)).toHaveProperty(
      'actorOauthClientId'
    );
  });
});
