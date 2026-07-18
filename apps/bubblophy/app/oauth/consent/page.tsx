import { requireBubblophySession } from '@/lib/auth/session';
import { parseBubblophyOAuthAuthorizationId } from '@/lib/oauth/authorization-id';
import { createBubblophyServerSupabaseClient } from '@/lib/supabase/server';

import { Suspense } from 'react';

import { redirect } from 'next/navigation';
import { connection } from 'next/server';

import { Badge } from '@bubbles/ui/shadcn/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@bubbles/ui/shadcn/card';
import { Separator } from '@bubbles/ui/shadcn/separator';

import { BubblophyOAuthConsentForm } from '@/app/oauth/consent/consent-form';

type OAuthConsentSearchParams = Promise<{
  authorization_id?: string | string[];
  error?: string | string[];
}>;

const scopeDescriptions: Record<string, string> = {
  openid: 'Deine Identität bestätigen',
  email: 'Deine E-Mail-Adresse lesen',
  profile: 'Basisdaten deines Profils lesen',
  phone: 'Deine Telefonnummer lesen',
};

/**
 * Streams Bubblophy's request-dependent OAuth consent gate.
 *
 * @param props.searchParams Supabase authorization request query.
 * @returns A neutral shell followed by the resolved consent state.
 */
export default function OAuthConsentPage({
  searchParams,
}: {
  searchParams: OAuthConsentSearchParams;
}) {
  return (
    <Suspense fallback={<OAuthConsentFallback />}>
      <BubblophyOAuthConsentGate searchParams={searchParams} />
    </Suspense>
  );
}

/**
 * Resolves session and Supabase authorization details inside Suspense.
 *
 * @param props.searchParams Supabase authorization request query.
 * @returns Consent details, a safe error state, or an existing-grant redirect.
 */
export async function BubblophyOAuthConsentGate({
  searchParams,
}: {
  searchParams: OAuthConsentSearchParams;
}) {
  await connection();

  const params = await searchParams;

  if (params.error === 'decision_failed') {
    return (
      <OAuthConsentError
        title="OAuth-Entscheidung nicht möglich"
        description="Die Anfrage ist abgelaufen oder konnte nicht verarbeitet werden. Starte die Verbindung bitte erneut in deinem Agent-Client."
      />
    );
  }

  const authorizationId = parseBubblophyOAuthAuthorizationId(
    typeof params.authorization_id === 'string' ? params.authorization_id : null
  );

  if (!authorizationId) {
    return (
      <OAuthConsentError
        title="Ungültige OAuth-Anfrage"
        description="Der Verbindungsaufruf enthält keine gültige Autorisierungs-ID. Starte die Verbindung bitte erneut in deinem Agent-Client."
      />
    );
  }

  const consentPath = `/oauth/consent?authorization_id=${encodeURIComponent(authorizationId)}`;
  const session = await requireBubblophySession({ nextPath: consentPath });
  const supabase = await createBubblophyServerSupabaseClient();
  const { data, error } =
    await supabase.auth.oauth.getAuthorizationDetails(authorizationId);

  if (error || !data) {
    return <OAuthConsentUnavailable />;
  }

  if (!('authorization_id' in data)) {
    redirect(data.redirect_url);
  }

  if (
    data.authorization_id !== authorizationId ||
    data.user.id !== session.user.id
  ) {
    return <OAuthConsentUnavailable />;
  }

  const scopes = data.scope.split(/\s+/).filter(Boolean);

  return (
    <main className="grid min-h-dvh place-items-center bg-background px-4 py-10 text-foreground sm:px-6">
      <div className="flex w-full max-w-xl flex-col gap-4">
        <div className="flex flex-col gap-1 text-center">
          <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
            Bubblophy Verbindung
          </p>
          <p className="text-sm text-muted-foreground">
            Angemeldet als {session.email}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              <h1 className="text-xl font-semibold text-balance">
                {data.client.name} verbinden?
              </h1>
            </CardTitle>
            <CardDescription>
              Dieser Client möchte in deinem Namen auf Bubblophy zugreifen.
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-5">
            <section
              className="flex flex-col gap-3"
              aria-labelledby="scope-title">
              <div className="flex flex-col gap-1">
                <h2 id="scope-title" className="font-medium">
                  Angeforderter Zugriff
                </h2>
                <p className="text-sm text-pretty text-muted-foreground">
                  Bubblophy prüft deine aktuellen Projektrollen bei jedem
                  Werkzeugaufruf erneut.
                </p>
              </div>

              {scopes.length > 0 ? (
                <ul className="flex flex-col gap-2">
                  {scopes.map((scope) => (
                    <li key={scope} className="flex items-center gap-3">
                      <Badge variant="outline">{scope}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {scopeDescriptions[scope] ??
                          'Vom Client angeforderte OAuth-Berechtigung'}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Der Client hat keine zusätzlichen OAuth-Scopes angefordert.
                </p>
              )}
            </section>

            <Separator />

            <section
              className="flex flex-col gap-1"
              aria-labelledby="callback-title">
              <h2 id="callback-title" className="font-medium">
                Registriertes Rücksprungziel
              </h2>
              <p className="font-mono text-xs break-all text-muted-foreground">
                {data.redirect_uri}
              </p>
            </section>
          </CardContent>

          <CardFooter className="border-t">
            <BubblophyOAuthConsentForm authorizationId={authorizationId} />
          </CardFooter>
        </Card>

        <p className="text-center text-xs text-pretty text-muted-foreground">
          Deine Bubblophy-Anmeldung wird nicht mit dem Client geteilt. Der
          Datenzugriff bleibt auf deine aktuellen Projektrollen begrenzt.
        </p>
      </div>
    </main>
  );
}

/** Renders a neutral shell while session and OAuth details are checked. */
function OAuthConsentFallback() {
  return (
    <main className="grid min-h-dvh place-items-center bg-background px-4 py-10 text-foreground sm:px-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>
            <h1 className="text-xl font-semibold text-balance">
              Verbindung wird geprüft
            </h1>
          </CardTitle>
          <CardDescription>
            Bubblophy lädt die OAuth-Anfrage und deine aktuellen Rechte.
          </CardDescription>
        </CardHeader>
      </Card>
    </main>
  );
}

/** Renders the generic state for expired or untrusted OAuth requests. */
function OAuthConsentUnavailable() {
  return (
    <OAuthConsentError
      title="OAuth-Anfrage nicht verfügbar"
      description="Die Anfrage ist ungültig, abgelaufen oder gehört nicht zu dieser Anmeldung. Starte die Verbindung bitte erneut in deinem Agent-Client."
    />
  );
}

/** Renders a safe consent error without leaking Supabase response details. */
function OAuthConsentError({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <main className="grid min-h-dvh place-items-center bg-background px-4 py-10 text-foreground sm:px-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>
            <h1 className="text-xl font-semibold text-balance">{title}</h1>
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      </Card>
    </main>
  );
}
