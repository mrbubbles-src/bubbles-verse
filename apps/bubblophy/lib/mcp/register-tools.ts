import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { getBubblophyMcpIssue } from '@/lib/mcp/issue-detail';
import { getBubblophyMcpIssuePlan } from '@/lib/mcp/issue-plan';
import { listBubblophyMcpIssues } from '@/lib/mcp/issues';
import { listBubblophyMcpProjects } from '@/lib/mcp/projects';

import * as z from 'zod';

import {
  bubblophyIssuePriority,
  bubblophyIssueStatus,
} from '@/drizzle/db/schema';

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

const issueStatusSchema = z.enum(bubblophyIssueStatus.enumValues);

const issuePrioritySchema = z.enum(bubblophyIssuePriority.enumValues);

const listIssuesInputSchema = z.object({
  projectId: z.string().trim().min(1).max(200),
  limit: z.number().int().min(1).max(100).optional(),
  afterIssueNumber: z.number().int().min(0).optional(),
});

const issuePageOutputSchema = z.object({
  project: z.object({
    id: z.string(),
    key: z.string(),
    isArchived: z.boolean(),
  }),
  issues: z.array(
    z.object({
      key: z.string(),
      issueNumber: z.number().int().positive(),
      title: z.string(),
      status: issueStatusSchema,
      priority: issuePrioritySchema,
      requiresHumanApproval: z.boolean(),
      updatedAt: z.string(),
    })
  ),
  nextAfterIssueNumber: z.number().int().positive().nullable(),
});

const getIssueInputSchema = z.object({
  projectId: z.string().trim().min(1).max(200),
  issueNumber: z.number().int().positive(),
});

const issueDetailOutputSchema = z.object({
  project: z.object({
    id: z.string(),
    key: z.string(),
    isArchived: z.boolean(),
  }),
  issue: z.object({
    key: z.string(),
    issueNumber: z.number().int().positive(),
    title: z.string(),
    description: z.string(),
    status: issueStatusSchema,
    priority: issuePrioritySchema,
    requiresHumanApproval: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
});

const issuePlanOutputSchema = z.object({
  project: z.object({
    id: z.string(),
    key: z.string(),
    isArchived: z.boolean(),
  }),
  issue: z.object({
    key: z.string(),
    issueNumber: z.number().int().positive(),
    title: z.string(),
  }),
  plan: z
    .object({
      version: z.number().int().positive(),
      summary: z.string(),
      steps: z.array(
        z.object({
          id: z.string(),
          text: z.string(),
        })
      ),
      approvalStatus: z.enum(['draft', 'approved']),
      approvedAt: z.string().nullable(),
      createdAt: z.string(),
    })
    .nullable(),
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

  server.registerTool(
    'list_issues',
    {
      title: 'List Bubblophy issues',
      description:
        'Lists a bounded page of public issue summaries for one Bubblophy project visible to the authenticated person.',
      inputSchema: listIssuesInputSchema,
      outputSchema: issuePageOutputSchema,
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

      const result = await listBubblophyMcpIssues(authUserId, input);

      if (result.status !== 'success') {
        return createToolError(readListIssuesError(result.status));
      }

      const structuredContent = {
        project: result.project,
        issues: result.issues,
        nextAfterIssueNumber: result.nextAfterIssueNumber,
      };

      return {
        content: [
          {
            type: 'text',
            text:
              result.issues.length === 0
                ? `Keine Issues in ${result.project.key} gefunden.`
                : `${result.issues.length} Issue(s) in ${result.project.key} gefunden.`,
          },
        ],
        structuredContent,
      };
    }
  );

  server.registerTool(
    'get_issue',
    {
      title: 'Get Bubblophy issue',
      description:
        'Gets one public issue detail for a Bubblophy project visible to the authenticated person.',
      inputSchema: getIssueInputSchema,
      outputSchema: issueDetailOutputSchema,
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

      const result = await getBubblophyMcpIssue(authUserId, input);

      if (result.status !== 'success') {
        return createToolError(readGetIssueError(result.status));
      }

      return {
        content: [
          {
            type: 'text',
            text: `Issue ${result.issue.key} gefunden.`,
          },
        ],
        structuredContent: {
          project: result.project,
          issue: result.issue,
        },
      };
    }
  );

  server.registerTool(
    'get_issue_plan',
    {
      title: 'Get Bubblophy issue plan',
      description:
        'Gets the latest draft or approved plan for one Bubblophy issue visible to the authenticated person.',
      inputSchema: getIssueInputSchema,
      outputSchema: issuePlanOutputSchema,
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

      const result = await getBubblophyMcpIssuePlan(authUserId, input);

      if (result.status !== 'success') {
        return createToolError(readGetIssuePlanError(result.status));
      }

      return {
        content: [
          {
            type: 'text',
            text: result.plan
              ? `Planversion ${result.plan.version} für ${result.issue.key} gefunden.`
              : `Für ${result.issue.key} wurde noch kein Plan angelegt.`,
          },
        ],
        structuredContent: {
          project: result.project,
          issue: result.issue,
          plan: result.plan,
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

/** Maps internal issue read outcomes to non-sensitive MCP messages. */
function readListIssuesError(
  status: 'invalid' | 'not_found' | 'database_unavailable'
) {
  if (status === 'database_unavailable') {
    return 'Bubblophy kann die Issues gerade nicht laden.';
  }

  if (status === 'not_found') {
    return 'Das Projekt wurde nicht gefunden oder ist nicht zugänglich.';
  }

  return 'Die Anfrage für die Issue-Liste ist ungültig.';
}

/** Maps internal issue detail outcomes to non-sensitive MCP messages. */
function readGetIssueError(
  status: 'invalid' | 'not_found' | 'database_unavailable'
) {
  if (status === 'database_unavailable') {
    return 'Bubblophy kann das Issue gerade nicht laden.';
  }

  if (status === 'not_found') {
    return 'Das Issue wurde nicht gefunden oder ist nicht zugänglich.';
  }

  return 'Die Anfrage für das Issue ist ungültig.';
}

/** Maps internal issue plan outcomes to non-sensitive MCP messages. */
function readGetIssuePlanError(
  status: 'invalid' | 'not_found' | 'database_unavailable'
) {
  if (status === 'database_unavailable') {
    return 'Bubblophy kann den Issue-Plan gerade nicht laden.';
  }

  if (status === 'not_found') {
    return 'Das Issue wurde nicht gefunden oder ist nicht zugänglich.';
  }

  return 'Die Anfrage für den Issue-Plan ist ungültig.';
}
