import type { JsonValue } from '@/drizzle/db/schema';

import { updateBubblophyAgentRunFromAgent } from '@/lib/agent-runs/agent-update';

import { NextResponse } from 'next/server';

interface AgentRunUpdateRouteBody {
  state?: JsonValue;
  message?: JsonValue;
  result?: JsonValue;
}

/**
 * Records an agent-submitted run status update.
 *
 * Agents authenticate with `Authorization: Bearer <token>`. The endpoint only
 * persists status, message, result JSON, and audit events; it never executes
 * code, checks out repositories, or starts background work.
 *
 * @param request Incoming PATCH request with state payload.
 * @param context Dynamic route params containing the run ID.
 * @returns JSON response for the agent process.
 */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ runId: string }> }
) {
  const { runId } = await context.params;
  const body = await readAgentRunUpdateBody(request);

  if (!body) {
    return NextResponse.json(
      { status: 'invalid', reason: 'invalid_result' },
      { status: 400 }
    );
  }

  const bearerToken = parseBearerToken(request.headers.get('authorization'));
  const result = await updateBubblophyAgentRunFromAgent({
    runId,
    bearerToken,
    state: typeof body.state === 'string' ? body.state : '',
    message: typeof body.message === 'string' ? body.message : undefined,
    result: body.result,
  });

  if (result.status === 'updated') {
    return NextResponse.json(result, { status: 200 });
  }

  return NextResponse.json(result, {
    status: getAgentRunUpdateHttpStatus(result.status),
  });
}

/**
 * Reads the JSON body without letting malformed input become a 500 response.
 *
 * @param request Incoming PATCH request.
 * @returns Parsed route body or `null` for invalid JSON.
 */
async function readAgentRunUpdateBody(
  request: Request
): Promise<AgentRunUpdateRouteBody | null> {
  try {
    return (await request.json()) as AgentRunUpdateRouteBody;
  } catch {
    return null;
  }
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
function getAgentRunUpdateHttpStatus(
  status: Exclude<
    Awaited<ReturnType<typeof updateBubblophyAgentRunFromAgent>>['status'],
    'updated'
  >
) {
  if (status === 'invalid') {
    return 400;
  }

  if (status === 'invalid_token') {
    return 401;
  }

  if (
    status === 'token_unavailable' ||
    status === 'forbidden_scope' ||
    status === 'project_mismatch'
  ) {
    return 403;
  }

  if (status === 'not_found') {
    return 404;
  }

  if (status === 'invalid_transition') {
    return 409;
  }

  return 503;
}
