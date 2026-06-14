import { readBubblophyAgentProjectIssues } from '@/lib/agent-projects/issue-context';

import { NextResponse } from 'next/server';

/**
 * Reads open issues for the project bound to a local agent token.
 *
 * Agents authenticate with `Authorization: Bearer <token>`. The endpoint only
 * returns minimal project, issue, and latest-plan context; it does not expose
 * token metadata, users, member lists, or audit logs.
 *
 * @param request Incoming GET request with bearer token auth.
 * @param context Dynamic route params containing the project ID.
 * @returns JSON response for local agent processes.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await context.params;
  const bearerToken = parseBearerToken(request.headers.get('authorization'));
  const result = await readBubblophyAgentProjectIssues({
    projectId,
    bearerToken,
  });

  if (result.status === 'found') {
    return NextResponse.json(result, { status: 200 });
  }

  return NextResponse.json(result, {
    status: getAgentProjectIssuesHttpStatus(result),
  });
}

/**
 * Extracts the bearer token from an Authorization header.
 *
 * @param authorization Raw Authorization header.
 * @returns Bearer token value or an empty string.
 */
function parseBearerToken(authorization: string | null) {
  const prefix = 'Bearer ';

  if (!authorization?.startsWith(prefix)) {
    return '';
  }

  return authorization.slice(prefix.length);
}

/**
 * Maps service failures to narrow HTTP status codes.
 *
 * @param status Service result status.
 * @returns HTTP status for the route response.
 */
function getAgentProjectIssuesHttpStatus(
  result: Exclude<
    Awaited<ReturnType<typeof readBubblophyAgentProjectIssues>>,
    { status: 'found' }
  >
) {
  if (result.status === 'invalid') {
    return result.reason === 'empty_token' ? 401 : 400;
  }

  if (result.status === 'invalid_token') {
    return 401;
  }

  if (
    result.status === 'token_unavailable' ||
    result.status === 'forbidden_scope' ||
    result.status === 'project_mismatch'
  ) {
    return 403;
  }

  if (result.status === 'not_found') {
    return 404;
  }

  return 503;
}
