import type { JsonValue } from '@/drizzle/db/schema';

import { readBubblophyAgentRunContext } from '@/lib/agent-runs/agent-context';
import { updateBubblophyAgentRunFromAgent } from '@/lib/agent-runs/agent-update';

import { NextResponse } from 'next/server';

interface AgentRunUpdateRouteBody {
  state?: JsonValue;
  message?: JsonValue;
  result?: JsonValue;
}

export const MAX_AGENT_RUN_UPDATE_BODY_BYTES = 65_536;

/**
 * Reads the minimal context for an agent-approved run.
 *
 * Agents authenticate with `Authorization: Bearer <token>`. The endpoint only
 * returns project, issue, run, and latest-plan context; it does not expose
 * token metadata, users, member lists, or audit logs.
 *
 * @param request Incoming GET request with bearer token auth.
 * @param context Dynamic route params containing the run ID.
 * @returns JSON response for the local agent process.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ runId: string }> }
) {
  const { runId } = await context.params;
  const bearerToken = parseBearerToken(request.headers.get('authorization'));
  const result = await readBubblophyAgentRunContext({
    runId,
    bearerToken,
  });

  if (result.status === 'found') {
    return NextResponse.json(result, { status: 200 });
  }

  return NextResponse.json(result, {
    status: getAgentRunHttpStatus(result.status),
  });
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
    status: getAgentRunHttpStatus(result.status),
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
    const bodyText = await readBoundedRequestText(request);

    if (bodyText === null) {
      return null;
    }

    const body = JSON.parse(bodyText) as AgentRunUpdateRouteBody | null;

    if (!body || Array.isArray(body) || typeof body !== 'object') {
      return null;
    }

    return body;
  } catch {
    return null;
  }
}

/**
 * Reads a request stream without retaining more than the accepted byte limit.
 *
 * @param request Incoming PATCH request with an optional length declaration.
 * @returns Strict UTF-8 body text, or null for oversized and unreadable input.
 */
async function readBoundedRequestText(
  request: Request
): Promise<string | null> {
  const declaredLength = request.headers.get('content-length');

  if (
    declaredLength &&
    /^\d+$/.test(declaredLength) &&
    Number(declaredLength) > MAX_AGENT_RUN_UPDATE_BODY_BYTES
  ) {
    return null;
  }

  if (!request.body) {
    return '';
  }

  const reader = request.body.getReader();
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let bodyText = '';
  let byteLength = 0;

  try {
    while (true) {
      const chunk = await reader.read();

      if (chunk.done) {
        return bodyText + decoder.decode();
      }

      byteLength += chunk.value.byteLength;

      if (byteLength > MAX_AGENT_RUN_UPDATE_BODY_BYTES) {
        await reader.cancel();
        return null;
      }

      bodyText += decoder.decode(chunk.value, { stream: true });
    }
  } catch {
    return null;
  } finally {
    reader.releaseLock();
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
function getAgentRunHttpStatus(
  status: Exclude<
    | Awaited<ReturnType<typeof readBubblophyAgentRunContext>>['status']
    | Awaited<ReturnType<typeof updateBubblophyAgentRunFromAgent>>['status'],
    'found' | 'updated'
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
