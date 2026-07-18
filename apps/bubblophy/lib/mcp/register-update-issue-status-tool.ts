import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { bubblophyIssueStatusLimits } from '@/lib/issues/status';
import { updateBubblophyMcpIssueStatus } from '@/lib/mcp/update-issue-status';

import * as z from 'zod';

import { bubblophyIssueStatus } from '@/drizzle/db/schema';

const statusSchema = z.enum(bubblophyIssueStatus.enumValues);

const inputSchema = z.object({
  projectId: z.string().trim().min(1).max(200),
  issueNumber: z.number().int().positive(),
  expectedStatus: statusSchema,
  status: statusSchema,
  reason: z
    .string()
    .trim()
    .max(bubblophyIssueStatusLimits.maxReasonLength)
    .optional(),
});

const outputSchema = z.object({
  project: z.object({
    id: z.string(),
    key: z.string(),
    isArchived: z.literal(false),
  }),
  issue: z.object({
    key: z.string(),
    issueNumber: z.number().int().positive(),
    title: z.string(),
    status: statusSchema,
  }),
});

/** Registers the conflict-safe OAuth issue-status mutation tool. */
export function registerBubblophyMcpUpdateIssueStatusTool(server: McpServer) {
  server.registerTool(
    'update_issue_status',
    {
      title: 'Update Bubblophy issue status',
      description:
        'Updates one visible active issue when its current status still matches expectedStatus. blocked and done require a reason.',
      inputSchema,
      outputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (input, extra) => {
      const authUserId = readIdentity(extra.authInfo?.extra?.authUserId);
      const oauthClientId = readIdentity(extra.authInfo?.clientId);

      if (!authUserId || !oauthClientId) {
        return createToolError(
          'Die authentifizierte User- oder OAuth-Client-ID fehlt.'
        );
      }

      const result = await updateBubblophyMcpIssueStatus(
        authUserId,
        oauthClientId,
        input
      );

      if (result.status !== 'updated') {
        return createToolError(readUpdateIssueStatusError(result.status));
      }

      return {
        content: [
          {
            type: 'text',
            text: `Status von ${result.issue.key} auf ${result.issue.status} gesetzt.`,
          },
        ],
        structuredContent: {
          project: result.project,
          issue: result.issue,
        },
      };
    }
  );
}

/** Returns one normalized OAuth identity field. */
function readIdentity(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

/** Creates a safe MCP tool error without actor or audit details. */
function createToolError(message: string) {
  return {
    isError: true,
    content: [{ type: 'text' as const, text: message }],
  };
}

/** Maps internal status outcomes to non-sensitive MCP messages. */
function readUpdateIssueStatusError(
  status:
    | 'invalid'
    | 'unchanged'
    | 'conflict'
    | 'not_found'
    | 'forbidden'
    | 'database_unavailable'
) {
  if (status === 'database_unavailable') {
    return 'Bubblophy kann den Issue-Status gerade nicht ändern.';
  }

  if (status === 'not_found') {
    return 'Das Issue oder Projekt wurde nicht gefunden oder ist nicht zugänglich.';
  }

  if (status === 'forbidden') {
    return 'Die aktuelle Projektrolle darf den Issue-Status nicht ändern.';
  }

  if (status === 'conflict') {
    return 'Der Issue-Status wurde zwischenzeitlich geändert. Lade das Issue neu.';
  }

  if (status === 'unchanged') {
    return 'Der angefragte Issue-Status ist bereits gesetzt.';
  }

  return 'Die Statusänderung ist ungültig.';
}
