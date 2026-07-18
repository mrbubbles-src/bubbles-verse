import 'server-only';

import type {
  CreateBubblophyIssueNoteInput,
  CreateBubblophyIssueNoteResult,
} from '@/lib/issues/notes';
import type {
  GetBubblophyMcpIssueInput,
  GetBubblophyMcpIssueResult,
} from '@/lib/mcp/issue-detail';

import { createBubblophyIssueNote } from '@/lib/issues/notes';
import { getBubblophyMcpIssue } from '@/lib/mcp/issue-detail';

export interface AddBubblophyMcpNoteInput {
  projectId: string;
  issueNumber: number;
  note: string;
}

interface AddBubblophyMcpNoteOptions {
  getIssue?: (
    authUserId: string,
    input: GetBubblophyMcpIssueInput
  ) => Promise<GetBubblophyMcpIssueResult>;
  writeNote?: (
    input: CreateBubblophyIssueNoteInput
  ) => Promise<CreateBubblophyIssueNoteResult>;
}

type NoteValidationReason = Extract<
  CreateBubblophyIssueNoteResult,
  { status: 'invalid' }
>['reason'];

export type AddBubblophyMcpNoteResult =
  | {
      status: 'created';
      project: { id: string; key: string; isArchived: boolean };
      issue: { key: string; issueNumber: number; title: string };
      note: { text: string; createdAt: string };
    }
  | {
      status: 'invalid';
      reason:
        | 'empty_auth_user'
        | 'empty_oauth_client'
        | 'empty_project'
        | 'invalid_issue_number'
        | NoteValidationReason;
    }
  | { status: 'not_found' }
  | { status: 'forbidden' }
  | { status: 'database_unavailable' };

/**
 * Appends one OAuth-attributed note without changing issue workflow state.
 *
 * The visible issue is resolved through the MCP read boundary before the
 * shared transactional writer rechecks project, issue, membership, and role.
 *
 * @param authUserId Verified OAuth subject mapped to the Bubblophy user.
 * @param oauthClientId Verified OAuth client that initiated the write.
 * @param input Project, issue number, and bounded note text.
 * @param options Optional service dependencies for tests.
 * @returns Created public note fields or a safe structured failure.
 */
export async function addBubblophyMcpNote(
  authUserId: string,
  oauthClientId: string,
  input: AddBubblophyMcpNoteInput,
  options: AddBubblophyMcpNoteOptions = {}
): Promise<AddBubblophyMcpNoteResult> {
  const normalizedAuthUserId = authUserId.trim();
  const normalizedOauthClientId = oauthClientId.trim();
  const normalizedProjectId = input.projectId.trim();

  if (!normalizedAuthUserId) {
    return { status: 'invalid', reason: 'empty_auth_user' };
  }

  if (!normalizedOauthClientId) {
    return { status: 'invalid', reason: 'empty_oauth_client' };
  }

  if (!normalizedProjectId) {
    return { status: 'invalid', reason: 'empty_project' };
  }

  if (!Number.isSafeInteger(input.issueNumber) || input.issueNumber < 1) {
    return { status: 'invalid', reason: 'invalid_issue_number' };
  }

  const getIssue = options.getIssue ?? getBubblophyMcpIssue;
  const issueResult = await getIssue(normalizedAuthUserId, {
    projectId: normalizedProjectId,
    issueNumber: input.issueNumber,
  });

  if (issueResult.status !== 'success') {
    return issueResult.status === 'database_unavailable'
      ? { status: 'database_unavailable' }
      : issueResult.status === 'not_found'
        ? { status: 'not_found' }
        : { status: 'invalid', reason: 'invalid_issue_number' };
  }

  const writeNote = options.writeNote ?? createBubblophyIssueNote;

  try {
    const writeResult = await writeNote({
      authUserId: normalizedAuthUserId,
      oauthClientId: normalizedOauthClientId,
      issueId: issueResult.issue.key,
      note: input.note,
    });

    if (writeResult.status !== 'created') {
      return writeResult;
    }

    return {
      status: 'created',
      project: issueResult.project,
      issue: {
        key: issueResult.issue.key,
        issueNumber: issueResult.issue.issueNumber,
        title: issueResult.issue.title,
      },
      note: {
        text: writeResult.note.note,
        createdAt: writeResult.note.createdAt,
      },
    };
  } catch {
    return { status: 'database_unavailable' };
  }
}
