// @vitest-environment node

import type { CreateBubblophyIssueNoteResult } from '@/lib/issues/notes';
import type { GetBubblophyMcpIssueResult } from '@/lib/mcp/issue-detail';

import { addBubblophyMcpNote } from '@/lib/mcp/add-note';

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it, vi } from 'vitest';

const visibleIssue = {
  status: 'success' as const,
  project: { id: 'project_bv', key: 'BV', isArchived: false },
  issue: {
    key: 'BV-12',
    issueNumber: 12,
    title: 'MCP dokumentieren',
    description: '',
    status: 'ready' as const,
    priority: 'high' as const,
    requiresHumanApproval: true,
    createdAt: '2026-07-17T12:00:00.000Z',
    updatedAt: '2026-07-18T12:00:00.000Z',
  },
};

describe('addBubblophyMcpNote', () => {
  it('rejects invalid identity, client, project, and issue before reads', async () => {
    const getIssue = vi.fn();
    const writeNote = vi.fn();
    const input = {
      projectId: 'project_bv',
      issueNumber: 12,
      note: 'Review abgeschlossen.',
    };

    await expect(
      addBubblophyMcpNote(' ', 'client-1', input, { getIssue, writeNote })
    ).resolves.toEqual({ status: 'invalid', reason: 'empty_auth_user' });
    await expect(
      addBubblophyMcpNote('user-1', ' ', input, { getIssue, writeNote })
    ).resolves.toEqual({ status: 'invalid', reason: 'empty_oauth_client' });
    await expect(
      addBubblophyMcpNote(
        'user-1',
        'client-1',
        { ...input, projectId: ' ' },
        { getIssue, writeNote }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'empty_project' });
    await expect(
      addBubblophyMcpNote(
        'user-1',
        'client-1',
        { ...input, issueNumber: 0 },
        { getIssue, writeNote }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'invalid_issue_number' });
    expect(getIssue).not.toHaveBeenCalled();
    expect(writeNote).not.toHaveBeenCalled();
  });

  it('rechecks a visible issue and writes an OAuth-attributed note', async () => {
    const getIssue = vi.fn<() => Promise<GetBubblophyMcpIssueResult>>(
      async () => visibleIssue
    );
    const writeNote = vi.fn<() => Promise<CreateBubblophyIssueNoteResult>>(
      async () => ({
        status: 'created',
        note: {
          id: 'event_note_1',
          note: 'Review abgeschlossen.',
          actor: 'Mensch',
          createdAt: '2026-07-18T12:30:00.000Z',
        },
      })
    );

    await expect(
      addBubblophyMcpNote(
        ' user-1 ',
        ' client-1 ',
        {
          projectId: ' project_bv ',
          issueNumber: 12,
          note: ' Review abgeschlossen. ',
        },
        { getIssue, writeNote }
      )
    ).resolves.toEqual({
      status: 'created',
      project: visibleIssue.project,
      issue: {
        key: 'BV-12',
        issueNumber: 12,
        title: 'MCP dokumentieren',
      },
      note: {
        text: 'Review abgeschlossen.',
        createdAt: '2026-07-18T12:30:00.000Z',
      },
    });
    expect(getIssue).toHaveBeenCalledWith('user-1', {
      projectId: 'project_bv',
      issueNumber: 12,
    });
    expect(writeNote).toHaveBeenCalledWith({
      authUserId: 'user-1',
      oauthClientId: 'client-1',
      issueId: 'BV-12',
      note: ' Review abgeschlossen. ',
    });
  });

  it('keeps inaccessible resources and denied roles safe', async () => {
    await expect(
      addBubblophyMcpNote(
        'user-1',
        'client-1',
        { projectId: 'project_foreign', issueNumber: 12, note: 'Notiz' },
        {
          getIssue: async () => ({ status: 'not_found' }),
          writeNote: vi.fn(),
        }
      )
    ).resolves.toEqual({ status: 'not_found' });
    await expect(
      addBubblophyMcpNote(
        'user-1',
        'client-1',
        { projectId: 'project_bv', issueNumber: 12, note: 'Notiz' },
        {
          getIssue: async () => visibleIssue,
          writeNote: async () => ({ status: 'forbidden' }),
        }
      )
    ).resolves.toEqual({ status: 'forbidden' });
  });

  it('maps validation and database failures without leaking details', async () => {
    await expect(
      addBubblophyMcpNote(
        'user-1',
        'client-1',
        { projectId: 'project_bv', issueNumber: 12, note: ' ' },
        {
          getIssue: async () => visibleIssue,
          writeNote: async () => ({ status: 'invalid', reason: 'empty_note' }),
        }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'empty_note' });
    await expect(
      addBubblophyMcpNote(
        'user-1',
        'client-1',
        { projectId: 'project_bv', issueNumber: 12, note: 'Notiz' },
        {
          getIssue: async () => visibleIssue,
          writeNote: async () => ({ status: 'database_unavailable' }),
        }
      )
    ).resolves.toEqual({ status: 'database_unavailable' });
  });

  it('does not depend on plan, run, status, or approval mutations', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'lib/mcp/add-note.ts'),
      'utf8'
    );

    expect(source).not.toMatch(/plans|agent-runs|status-database|approval/i);
  });
});
