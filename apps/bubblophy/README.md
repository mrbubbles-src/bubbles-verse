# Bubblophy

Bubblophy ist eine neue Next.js-App im Bubblesverse-Monorepo. Sie bündelt
Projekt-Issues, Issue-Pläne, Agent-Tokens, Agent-Runs und Audit-Aktivität in
einem bewusst human-gesteuerten Kontrollzentrum.

## Stack

- Next.js 16 App Router
- React 19
- Tailwind CSS 4 über `@bubbles/ui`
- `@bubbles/theme` und `@bubbles/ui`
- Supabase Auth für Menschen
- Drizzle/Postgres für Bubblophy-Daten

## Aktueller Umfang

- `/` rendert das erste Arbeits-Dashboard für Projekte, Issues, Agent-Tokens,
  Runs und Audit-Aktivität hinter einem menschlichen Supabase/GitHub-Login.
- `/login`, `/auth/callback` und `/auth/logout` bereiten den Supabase/GitHub
  Login für Menschen vor.
- Das Drizzle-Grundschema liegt unter `drizzle/db/schema.ts`.
- Die lokale Initialmigration liegt unter `drizzle/0000_premium_psynapse.sql`;
  `documentation/database-setup.md` beschreibt Review, Anwendung und RLS-TODOs.
- Eine erste server-only Repository-/Mapper-Grenze für Projekt-/Issue-Zeilen
  liegt unter `lib/issues/repository.ts`.
- Ein server-only Create-Vertrag für Projekte liegt unter
  `lib/projects/create.ts`; er erstellt Projekt plus Owner-Mitgliedschaft ohne
  Issues, Agent-Tokens oder Runs als Nebeneffekt.
- Ein server-only Create-Vertrag für persistierte menschliche Issue-Drafts
  liegt unter `lib/issues/create.ts`; die UI nutzt bis zur expliziten Anbindung
  weiter klar markierte lokale Drafts.
- Der Projektbereich bietet bei aktiver Datenbankquelle `Neues Projekt`; bei
  Sample- oder Fallback-Daten wird kein DB-Projektbutton angeboten.
- Der Issue-Dialog bietet bei aktiver Datenbankquelle zusätzlich
  `In Datenbank speichern`; bei Sample- oder Fallback-Daten bleibt er bewusst
  lokal und markiert Drafts als nicht gespeichert.
- Im Issue-Detailpanel können Menschen bei aktiver Datenbankquelle einen
  Plan-Entwurf speichern. Der server-only Plan-Service schreibt eine neue
  Planversion plus `plan_updated`-Event und startet keinen Agent-Run.
- Im Agent-Token-Bereich können Owner/Maintainer bei aktiver Datenbankquelle
  ein projektbegrenztes Token erstellen. Der Klartext wird nur einmal gezeigt;
  gespeichert wird ausschließlich der Hash.
- Der Auth- und Sicherheitsplan liegt in
  `documentation/auth-security-plan.md`.
- Die UI nutzt einen typisierten Dashboard-Snapshot als View Model. Der
  server-only Read-Pfad unter `lib/dashboard/data.ts` kann Datenbankzeilen
  abfragen und fällt in Dev kontrolliert auf Sample-Daten zurück, wenn die
  Datenbank nicht verfügbar ist.

## Lokal starten

Vom Monorepo-Root:

```bash
bun install
bunx turbo dev --filter=bubblophy
```

Aus dem App-Ordner:

```bash
cd apps/bubblophy
bun run dev
```

Der Dev-Server bindet an `http://bubblophy.mrbubbles.test:3005`.
Der Hostname braucht lokal einen Hostfile-Eintrag auf `127.0.0.1`, analog zu
den anderen Bubblesverse-Apps.

## Qualität

```bash
cd apps/bubblophy
bun run test:run
bun run lint
bun run typecheck
bun run build
```

## Sicherheit

- Menschen loggen sich über Supabase/GitHub ein.
- Die Auth-Grundstruktur nutzt nur `NEXT_PUBLIC_*` Supabase-Anon-Konfiguration.
- Das Dashboard unter `/` verlangt eine Supabase-Session und prüft temporär
  `BUBBLOPHY_ALLOWED_AUTH_EMAILS` serverseitig fail-closed, bis
  Projektmitgliedschaften und RLS diese Sperre ersetzen.
- Ein optimistischer Proxy für `/` und `/login` verhindert Login-UI-Flashes
  anhand vorhandener Supabase-Session-Cookies. Er ersetzt keine Autorisierung;
  die echte Prüfung bleibt serverseitig.
- Persistierte Issue-Erfassung läuft serverseitig über Projektmitgliedschaft,
  schreibt nur Issue plus `created`-Event und startet keine Agent-Runs.
- Persistierte Plan-Erfassung läuft serverseitig über Issue-Projektmitgliedschaft,
  schreibt eine neue Planversion plus `plan_updated`-Event und startet keine
  Agent-Runs.
- Persistierte Projekt-Erfassung läuft serverseitig über die menschliche
  Session, schreibt Projekt plus Owner-Mitgliedschaft und startet keine
  Agent-Runs.
- Persistierte Agent-Token-Erstellung läuft serverseitig über Owner- oder
  Maintainer-Mitgliedschaft, schreibt nur den Token-Hash und startet keine
  Agent-Runs. Projektweite `agent_token_created`-Audit-Events folgen in einer
  eigenen Schema-/RLS-Scheibe; sie werden bewusst nicht in issue-zentrierte
  Events hineingetrickst.
- Agenten nutzen eingeschränkte Bubblophy-Agent-Tokens mit Hash, Scopes,
  Projektgrenze, Status und Ablaufdatum.
- Agenten erhalten keine Mensch-Logins und keinen Supabase-Service-Role-Key.
- Alles bleibt human-in-the-loop; Agent-Runs brauchen explizite Freigabe.
- Datenzugriff auf `DATABASE_URL` ist in `drizzle/db/index.ts` durch
  `server-only` auf Server-Bundles begrenzt.
- Projektmitgliedschaften, RLS-Policies und Agent-Scopes sind im Schema
  vorbereitet, ersetzen die temporäre Allowlist aber erst nach einer späteren
  Migration und Policy-Umsetzung.
- Die aktuelle Issue-Nummer-Vergabe passiert im MVP transaktional über
  `max(issue_number) + 1` pro Projekt und wird vom eindeutigen DB-Index
  abgesichert. Ein späterer Projekt-Counter kann parallele Kollisionen
  nutzerfreundlicher retryen.

## Environment

```env
NEXT_PUBLIC_APP_URL=http://bubblophy.mrbubbles.test:3005
NEXT_PUBLIC_AUTH_COOKIE_DOMAIN=.mrbubbles.test
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
BUBBLOPHY_ALLOWED_AUTH_EMAILS=mrbubbles@example.com
DATABASE_URL=...
```

`NEXT_PUBLIC_AUTH_COOKIE_DOMAIN` ist optional, sollte aber zur lokalen
Subdomain passen, sobald Bubblophy denselben Supabase-OAuth-Flow wie die
anderen Bubblesverse-Apps nutzt.

`BUBBLOPHY_ALLOWED_AUTH_EMAILS` ist eine temporäre, server-only
Komma-Liste erlaubter Supabase-Auth-E-Mails. Ohne Eintrag bleibt Bubblophy
absichtlich geschlossen.

## Supabase Auth Redirects

Die Supabase Auth URL Configuration muss
`http://bubblophy.mrbubbles.test:3005/auth/callback` als erlaubte Redirect URL
enthalten. Der lokale Login-Button setzt diese URL als `redirect_to`.

Wenn der GitHub/Supabase-Login stattdessen auf
`http://dashboard.mrbubbles.test:3004/?code=...` endet, fehlt sehr
wahrscheinlich die Bubblophy-Redirect-URL in Supabase oder Supabase nutzt noch
die Dashboard Site URL als Fallback.
