import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { listBubblophyMcpProjects } from '@/lib/mcp/projects';

import * as z from 'zod';

const projectOutputSchema = z.object({
  projects: z.array(
    z.object({
      id: z.string(),
      key: z.string(),
      name: z.string(),
      description: z.string(),
      role: z.enum(['owner', 'maintainer', 'member', 'viewer']),
      isArchived: z.boolean(),
    })
  ),
});

/** Registers Bubblophy's currently available OAuth-backed MCP tools. */
export function registerBubblophyMcpTools(server: McpServer) {
  server.registerTool(
    'list_projects',
    {
      title: 'List Bubblophy projects',
      description:
        'Lists Bubblophy projects where the authenticated person is currently a member.',
      outputSchema: projectOutputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (extra) => {
      const authUserId = readAuthUserId(extra.authInfo?.extra?.authUserId);

      if (!authUserId) {
        return createToolError('Die authentifizierte User-ID fehlt.');
      }

      const result = await listBubblophyMcpProjects(authUserId);

      if (result.status !== 'success') {
        return createToolError(
          result.status === 'database_unavailable'
            ? 'Bubblophy kann die Projekte gerade nicht laden.'
            : 'Die authentifizierte User-ID ist ungültig.'
        );
      }

      return {
        content: [
          {
            type: 'text',
            text:
              result.projects.length === 0
                ? 'Keine Bubblophy-Projekte für diese Person gefunden.'
                : `${result.projects.length} Bubblophy-Projekt(e) gefunden.`,
          },
        ],
        structuredContent: { projects: result.projects },
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
