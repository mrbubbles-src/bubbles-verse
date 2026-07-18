import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { bubblophyAgentRunRequestLimits } from '@/lib/agent-runs/request';
import { requestBubblophyMcpRun } from '@/lib/mcp/request-run';

import * as z from 'zod';

const inputSchema = z.object({
  projectId: z.string().trim().min(1).max(200),
  issueNumber: z.number().int().positive(),
  runTargetId: z.string().trim().min(1).max(200),
  instructions: z
    .string()
    .trim()
    .max(bubblophyAgentRunRequestLimits.maxInstructionsLength)
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
  }),
  run: z.object({
    id: z.string(),
    state: z.literal('requested'),
    agentLabel: z.string(),
    createdAt: z.string(),
  }),
});

/** Registers the OAuth-attributed, human-controlled run request tool. */
export function registerBubblophyMcpRequestRunTool(server: McpServer) {
  server.registerTool(
    'request_run',
    {
      title: 'Request Bubblophy run',
      description:
        'Requests an unapproved agent run for one visible issue and executable target. It never approves or starts execution.',
      inputSchema,
      outputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
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

      const result = await requestBubblophyMcpRun(
        authUserId,
        oauthClientId,
        input
      );

      if (result.status !== 'requested') {
        return createToolError(readRequestRunError(result.status));
      }

      return {
        content: [
          {
            type: 'text',
            text: `Run ${result.run.id} für ${result.issue.key} angefragt. Menschliche Freigabe bleibt erforderlich.`,
          },
        ],
        structuredContent: {
          project: result.project,
          issue: result.issue,
          run: result.run,
        },
      };
    }
  );
}

/** Returns one normalized OAuth identity field. */
function readIdentity(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

/** Creates a safe MCP tool error without token or actor details. */
function createToolError(message: string) {
  return {
    isError: true,
    content: [{ type: 'text' as const, text: message }],
  };
}

/** Maps internal run-request outcomes to non-sensitive MCP messages. */
function readRequestRunError(
  status:
    | 'invalid'
    | 'not_found'
    | 'forbidden'
    | 'token_unavailable'
    | 'database_unavailable'
) {
  if (status === 'database_unavailable') {
    return 'Bubblophy kann den Run gerade nicht anfragen.';
  }

  if (status === 'not_found') {
    return 'Das Issue oder Projekt wurde nicht gefunden oder ist nicht zugänglich.';
  }

  if (status === 'forbidden') {
    return 'Die aktuelle Projektrolle darf keine Runs anfragen.';
  }

  if (status === 'token_unavailable') {
    return 'Das gewählte Run-Ziel ist nicht verfügbar.';
  }

  return 'Die Run-Anfrage ist ungültig.';
}
