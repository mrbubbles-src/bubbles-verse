// @vitest-environment node

import type { CreateBubblophyIssueDraftResult } from '@/lib/issues/create';
import type { ListBubblophyMcpProjectsResult } from '@/lib/mcp/projects';

import { createBubblophyMcpIssue } from '@/lib/mcp/create-issue';

import { describe, expect, it, vi } from 'vitest';

const visibleProjects = {
  status: 'success' as const,
  projects: [
    {
      id: 'project_bv',
      key: 'BV',
      name: 'Bubblophy',
      description: '',
      role: 'member' as const,
      isArchived: false,
    },
  ],
};

describe('createBubblophyMcpIssue', () => {
  it('rejects invalid identity, client, and project before reads', async () => {
    const listProjects = vi.fn();
    const writeIssue = vi.fn();
    const input = {
      projectId: 'project_bv',
      title: 'Issue erstellen',
      description: '',
      priority: 'medium' as const,
    };

    await expect(
      createBubblophyMcpIssue(' ', 'client-1', input, {
        listProjects,
        writeIssue,
      })
    ).resolves.toEqual({ status: 'invalid', reason: 'empty_auth_user' });
    await expect(
      createBubblophyMcpIssue('user-1', ' ', input, {
        listProjects,
        writeIssue,
      })
    ).resolves.toEqual({ status: 'invalid', reason: 'empty_oauth_client' });
    await expect(
      createBubblophyMcpIssue(
        'user-1',
        'client-1',
        { ...input, projectId: ' ' },
        { listProjects, writeIssue }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'empty_project' });
    expect(listProjects).not.toHaveBeenCalled();
    expect(writeIssue).not.toHaveBeenCalled();
  });

  it('resolves a visible project and returns only public issue fields', async () => {
    const listProjects = vi.fn<() => Promise<ListBubblophyMcpProjectsResult>>(
      async () => visibleProjects
    );
    const writeIssue = vi.fn<() => Promise<CreateBubblophyIssueDraftResult>>(
      async () => ({
        status: 'created',
        issue: {
          id: 'BV-15',
          title: 'Issue erstellen',
          description: 'Nur Draft und Audit.',
          projectKey: 'BV',
          status: 'triage',
          priority: 'hoch',
          assigneeAuthUserId: null,
          assigneeLabel: 'Nicht zugewiesen',
          planSteps: 0,
          approvalRequired: true,
        },
      })
    );

    await expect(
      createBubblophyMcpIssue(
        ' user-1 ',
        ' client-1 ',
        {
          projectId: ' project_bv ',
          title: ' Issue erstellen ',
          description: ' Nur Draft und Audit. ',
          priority: 'high',
        },
        { listProjects, writeIssue }
      )
    ).resolves.toEqual({
      status: 'created',
      project: { id: 'project_bv', key: 'BV', isArchived: false },
      issue: {
        key: 'BV-15',
        issueNumber: 15,
        title: 'Issue erstellen',
        description: 'Nur Draft und Audit.',
        status: 'triage',
        priority: 'high',
        requiresHumanApproval: true,
      },
    });
    expect(listProjects).toHaveBeenCalledWith('user-1');
    expect(writeIssue).toHaveBeenCalledWith({
      authUserId: 'user-1',
      oauthClientId: 'client-1',
      projectKey: 'BV',
      title: ' Issue erstellen ',
      description: ' Nur Draft und Audit. ',
      priority: 'hoch',
    });
  });

  it('hides foreign projects and forwards current write denials', async () => {
    await expect(
      createBubblophyMcpIssue(
        'user-1',
        'client-1',
        { projectId: 'foreign', title: 'Nicht sichtbar', priority: 'medium' },
        {
          listProjects: async () => visibleProjects,
          writeIssue: vi.fn(),
        }
      )
    ).resolves.toEqual({ status: 'not_found' });
    await expect(
      createBubblophyMcpIssue(
        'user-1',
        'client-1',
        { projectId: 'project_bv', title: 'Nicht erlaubt', priority: 'medium' },
        {
          listProjects: async () => visibleProjects,
          writeIssue: async () => ({ status: 'forbidden' }),
        }
      )
    ).resolves.toEqual({ status: 'forbidden' });
  });

  it('maps validation and database failures without leaking details', async () => {
    await expect(
      createBubblophyMcpIssue(
        'user-1',
        'client-1',
        { projectId: 'project_bv', title: ' ', priority: 'medium' },
        {
          listProjects: async () => visibleProjects,
          writeIssue: async () => ({
            status: 'invalid',
            reason: 'empty_title',
          }),
        }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'empty_title' });
    await expect(
      createBubblophyMcpIssue(
        'user-1',
        'client-1',
        { projectId: 'project_bv', title: 'Issue', priority: 'medium' },
        {
          listProjects: async () => ({ status: 'database_unavailable' }),
          writeIssue: vi.fn(),
        }
      )
    ).resolves.toEqual({ status: 'database_unavailable' });
    await expect(
      createBubblophyMcpIssue(
        'user-1',
        'client-1',
        { projectId: 'project_bv', title: 'Issue', priority: 'medium' },
        {
          listProjects: async () => {
            throw new Error('database host and credentials');
          },
          writeIssue: vi.fn(),
        }
      )
    ).resolves.toEqual({ status: 'database_unavailable' });
  });
});
