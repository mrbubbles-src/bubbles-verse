import { getTableColumns, getTableName } from 'drizzle-orm';
import { getTableConfig } from 'drizzle-orm/pg-core';
import { describe, expect, it } from 'vitest';

import {
  bubblophyAgentTokens,
  bubblophyAgentTokenScopes,
  bubblophyIssueEvents,
  bubblophyIssuePlans,
  bubblophyIssues,
  bubblophyProjectEvents,
  bubblophyProjectInvitations,
  bubblophyProjectMembers,
  bubblophyProjects,
} from '@/drizzle/db/schema';

describe('bubblophy schema', () => {
  it('keeps the core orchestration tables under the Bubblophy namespace', () => {
    expect(getTableName(bubblophyProjects)).toBe('bubblophy_projects');
    expect(getTableName(bubblophyProjectMembers)).toBe(
      'bubblophy_project_members'
    );
    expect(getTableName(bubblophyProjectInvitations)).toBe(
      'bubblophy_project_invitations'
    );
    expect(getTableName(bubblophyIssues)).toBe('bubblophy_issues');
    expect(getTableName(bubblophyIssuePlans)).toBe('bubblophy_issue_plans');
    expect(getTableName(bubblophyIssueEvents)).toBe('bubblophy_issue_events');
    expect(getTableName(bubblophyProjectEvents)).toBe(
      'bubblophy_project_events'
    );
    expect(getTableName(bubblophyAgentTokens)).toBe('bubblophy_agent_tokens');
  });

  it('enforces invitation identity, role, token, and lifecycle invariants', () => {
    const config = getTableConfig(bubblophyProjectInvitations);
    const checkNames = config.checks.map((constraint) => constraint.name);
    const indexNames = config.indexes.map(
      (indexConfig) => indexConfig.config.name
    );

    expect(getTableColumns(bubblophyProjectInvitations)).toEqual(
      expect.objectContaining({
        normalizedEmail: expect.any(Object),
        role: expect.any(Object),
        tokenHash: expect.any(Object),
        invitedByAuthUserId: expect.any(Object),
        acceptedByAuthUserId: expect.any(Object),
        revokedByAuthUserId: expect.any(Object),
        expiresAt: expect.any(Object),
        acceptedAt: expect.any(Object),
        revokedAt: expect.any(Object),
      })
    );
    expect(checkNames).toEqual(
      expect.arrayContaining([
        'bubblophy_project_invitations_role_check',
        'bubblophy_project_invitations_normalized_email_check',
        'bubblophy_project_invitations_token_hash_check',
        'bubblophy_project_invitations_expiry_check',
        'bubblophy_project_invitations_acceptance_pair_check',
        'bubblophy_project_invitations_revocation_pair_check',
        'bubblophy_project_invitations_terminal_state_check',
        'bubblophy_project_invitations_terminal_time_check',
      ])
    );
    expect(indexNames).toEqual(
      expect.arrayContaining([
        'bubblophy_project_invitations_token_hash_idx',
        'bubblophy_project_invitations_open_email_idx',
        'bubblophy_project_invitations_project_created_idx',
      ])
    );
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
