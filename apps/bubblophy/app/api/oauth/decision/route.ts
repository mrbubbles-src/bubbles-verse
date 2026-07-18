import { getBubblophyAuthRedirectOrigin } from '@/lib/auth/redirects';
import { getOptionalBubblophySession } from '@/lib/auth/session';
import { getPublicBubblophyEnv } from '@/lib/env';
import { parseBubblophyOAuthAuthorizationId } from '@/lib/oauth/authorization-id';
import { createBubblophyServerSupabaseClient } from '@/lib/supabase/server';

import * as z from 'zod';

const oauthDecisionSchema = z.enum(['approve', 'deny']);
const formContentType = 'application/x-www-form-urlencoded';

/**
 * Applies one authenticated, same-origin OAuth consent decision through Supabase.
 *
 * @param request Cookie-authenticated native form request from the consent page.
 * @returns A 303 to Supabase's client callback, or a safe same-origin error.
 */
export async function POST(request: Request) {
  const env = getPublicBubblophyEnv();
  const expectedOrigin = getBubblophyAuthRedirectOrigin({
    requestUrl: request.url,
    configuredAppUrl: env.NEXT_PUBLIC_APP_URL,
  });

  if (request.headers.get('origin') !== expectedOrigin) {
    return createDecisionError('Anfrage nicht erlaubt.', 403);
  }

  if (
    request.headers
      .get('content-type')
      ?.split(';', 1)
      .at(0)
      ?.trim()
      .toLowerCase() !== formContentType
  ) {
    return createDecisionError('Formularformat nicht unterstützt.', 415);
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return createDecisionError('Ungültiges Formular.', 400);
  }

  const authorizationIdValues = formData.getAll('authorization_id');
  const decisionValues = formData.getAll('decision');
  const authorizationId =
    authorizationIdValues.length === 1 &&
    typeof authorizationIdValues[0] === 'string'
      ? parseBubblophyOAuthAuthorizationId(authorizationIdValues[0])
      : null;
  const decision =
    decisionValues.length === 1 && typeof decisionValues[0] === 'string'
      ? oauthDecisionSchema.safeParse(decisionValues[0])
      : null;

  if (!authorizationId || !decision?.success) {
    return createDecisionFailureRedirect(expectedOrigin);
  }

  const sessionResult = await getOptionalBubblophySession();

  if (sessionResult.status !== 'allowed') {
    return createDecisionFailureRedirect(expectedOrigin);
  }

  const supabase = await createBubblophyServerSupabaseClient();
  const detailsResult =
    await supabase.auth.oauth.getAuthorizationDetails(authorizationId);

  if (detailsResult.error || !detailsResult.data) {
    return createDecisionFailureRedirect(expectedOrigin);
  }

  if (!('authorization_id' in detailsResult.data)) {
    return createDecisionFailureRedirect(expectedOrigin);
  }

  if (
    detailsResult.data.authorization_id !== authorizationId ||
    detailsResult.data.user.id !== sessionResult.session.user.id
  ) {
    return createDecisionFailureRedirect(expectedOrigin);
  }

  const consentResult =
    decision.data === 'approve'
      ? await supabase.auth.oauth.approveAuthorization(authorizationId, {
          skipBrowserRedirect: true,
        })
      : await supabase.auth.oauth.denyAuthorization(authorizationId, {
          skipBrowserRedirect: true,
        });

  if (
    consentResult.error ||
    !consentResult.data ||
    typeof consentResult.data.redirect_url !== 'string' ||
    !consentResult.data.redirect_url
  ) {
    return createDecisionFailureRedirect(expectedOrigin);
  }

  return new Response(null, {
    status: 303,
    headers: {
      'cache-control': 'no-store',
      location: consentResult.data.redirect_url,
    },
  });
}

/** Redirects native form failures to a safe, same-origin recovery state. */
function createDecisionFailureRedirect(origin: string) {
  const location = new URL('/oauth/consent', origin);

  location.searchParams.set('error', 'decision_failed');

  return new Response(null, {
    status: 303,
    headers: {
      'cache-control': 'no-store',
      location: location.toString(),
    },
  });
}

/** Creates a generic no-store response without OAuth or Supabase details. */
function createDecisionError(message: string, status: number) {
  return Response.json(
    { error: message },
    {
      status,
      headers: { 'cache-control': 'no-store' },
    }
  );
}
