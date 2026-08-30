import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { listBubblophyMcpRunTargets } from '@/lib/mcp/run-targets';

import * as z from 'zod';

const inputSchema = z.object({
  projectId: z.string().trim().min(1).max(200),
  query: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .optional()
    .describe('Literal case-insensitive label prefix.'),
  after: z
    .object({
      normalizedLabel: z.string().trim().min(1).max(256),
      id: z.string().trim().min(1).max(128),
    })
    .optional()
    .describe(
      'Stable cursor from nextAfter. Repeat the same query for filtered follow-up pages.'
    ),
});

const outputSchema = z.object({
  project: z.object({
    id: z.string(),
    key: z.string(),
    isArchived: z.literal(false),
  }),
  query: z.string().nullable(),
  targets: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
    })
  ),
  nextAfter: z
    .object({
      normalizedLabel: z.string(),
      id: z.string(),
    })
    .nullable(),
});

/** Registers the public executable run-target selection tool. */
export function registerBubblophyMcpRunTargetsTool(server: McpServer) {
  server.registerTool(
    'list_run_targets',
    {
      title: 'List Bubblophy run targets',
      description:
        'Lists one bounded, searchable page of public executable agent targets selectable for a later human-approved run request in one active contributor project. Send nextAfter as after and repeat the same query for a filtered next page.',
      inputSchema,
      outputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (input, extra) => {
      const authUserId = readAuthUserId(extra.authInfo?.extra?.authUserId);

      if (!authUserId) {
        return createToolError('Die authentifizierte User-ID fehlt.');
      }

      const result = await listBubblophyMcpRunTargets(authUserId, input);

      if (result.status !== 'success') {
        return createToolError(readListRunTargetsError(result.status));
      }

      return {
        content: [
          {
            type: 'text',
            text:
              result.targets.length === 0
                ? `Keine ausführbaren Run-Ziele in ${result.project.key} gefunden.`
                : `${result.targets.length} ausführbare Run-Ziel(e) in ${result.project.key} gefunden.`,
          },
        ],
        structuredContent: {
          project: result.project,
          query: result.query,
          targets: result.targets,
          nextAfter: result.nextAfter,
        },
      };
    }
  );
}

/** Returns a normalized OAuth user ID from MCP auth context data. */
function readAuthUserId(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

/** Creates a safe MCP tool error without database or token details. */
function createToolError(message: string) {
  return {
    isError: true,
    content: [{ type: 'text' as const, text: message }],
  };
}

/** Maps internal run-target outcomes to non-sensitive MCP messages. */
function readListRunTargetsError(
  status: 'invalid' | 'not_found' | 'forbidden' | 'database_unavailable'
) {
  if (status === 'database_unavailable') {
    return 'Bubblophy kann die Run-Ziele gerade nicht laden.';
  }

  if (status === 'not_found') {
    return 'Das Projekt wurde nicht gefunden oder ist nicht zugänglich.';
  }

  if (status === 'forbidden') {
    return 'Die aktuelle Projektrolle darf keine Runs anfragen.';
  }

  return 'Die Anfrage für die Run-Ziele ist ungültig.';
}
