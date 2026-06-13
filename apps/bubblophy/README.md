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
- Die lokalen Datenbankmigrationen liegen unter `drizzle/`; darunter ist eine
  additive, journalisierte Drizzle-Custom-Migration für die RLS-Baseline, die
  vor einer Remote-Anwendung separat reviewt werden muss.
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
- Owner und Maintainer können im Projektbereich Name/Beschreibung bearbeiten
  sowie Projekte über `is_archived` archivieren oder wiederherstellen.
  Archivierte Projekte bleiben sichtbar markiert, wirken aber nicht als aktive
  Arbeitsfläche für neue Issues, Run-Anfragen oder Agent-Token-Aktionen.
- Der Projektbereich zeigt Mitglieder eines ausgewählten Projekts aus
  `bubblophy_project_members`. Ohne Profil- oder Invite-Modell zeigt die UI die
  technische Auth-User-ID als Fallback und bietet noch kein Add-by-E-Mail an.
- Owner und Maintainer können Nicht-Owner-Mitglieder zwischen `maintainer`,
  `member` und `viewer` umstellen oder entfernen. Owner-Rollen, Owner-Removal
  und Self-Removal bleiben im MVP konservativ gesperrt.
- In einer leeren Datenbank führt der UI-Flow von `Neues Projekt` direkt in
  den ausgewählten Projektkontext und bietet dort das erste persistierte Issue
  für dieses Projekt an.
- Projektkarten und Issue-Zeilen sind auswählbare Controls mit sichtbarem
  Zustand. Issue-Zeilen reagieren auf Klick, Enter und Leertaste;
  Projektfilter können gelöst werden; Sidebar-Links führen auf echte
  Dashboard-Sections statt auf Platzhalter.
- Der Issue-Dialog bietet bei aktiver Datenbankquelle zusätzlich
  `In Datenbank speichern`; bei Sample- oder Fallback-Daten bleibt er bewusst
  lokal und markiert Drafts als nicht gespeichert.
- Im Issue-Detail können Menschen bei aktiver Datenbankquelle den Status eines
  gespeicherten Issues ändern. Die Änderung schreibt ein `status_changed`-Event
  und startet keinen Agent-Run.
- Im Issue-Detail können Menschen bei aktiver Datenbankquelle Titel und
  Beschreibung eines gespeicherten Issues bearbeiten. Die Änderung prüft
  Projektrolle, schreibt ein eindeutig als Issue-Update markiertes
  `commented`-Audit-Event und startet keinen Agent-Run.
- Im Issue-Detail können Menschen bei aktiver Datenbankquelle einen Agent-Run
  anfragen, wenn ein aktives Projekt-Token existiert. Die RunQueue zeigt den
  neuen Eintrag lokal als wartend; es wird kein Agent gestartet.
- In der RunQueue können Menschen angefragte Runs freigeben oder abbrechen,
  wenn die echte Server-Action verfügbar ist. Die Entscheidung prüft
  Projektmitgliedschaft, schreibt einen Statuswechsel plus Audit-Event und
  startet weiterhin keinen Agenten.
- `PATCH /api/agent-runs/[runId]` nimmt Agent-Statusupdates mit
  `Authorization: Bearer <agent-token>` entgegen. Der Endpoint akzeptiert nur
  `running`, `needs_review`, `completed` und `failed`, prüft Token-Hash,
  Scope `runs:update`, Projektbindung, Token-Status/Ablauf und schreibt
  `last_used_at` plus Audit-Event.
- Im Issue-Detailpanel können Menschen bei aktiver Datenbankquelle einen
  Plan-Entwurf speichern. Der server-only Plan-Service schreibt eine neue
  Planversion plus `plan_updated`-Event, normalisiert leere Schritte weg und
  startet keinen Agent-Run.
- Der Datenbank-Snapshot lädt für gespeicherte Issues die neueste Planversion
  mit Summary und Steps, sodass Planinhalte nach einem Reload im Detailpanel
  erhalten bleiben.
- Im Agent-Token-Bereich können Owner/Maintainer bei aktiver Datenbankquelle
  ein projektbegrenztes Token erstellen. Der Klartext wird nur einmal gezeigt;
  gespeichert wird ausschließlich der Hash. Die Erstellung schreibt zusätzlich
  ein projektweites Audit-Event ohne Plaintext oder Hash.
- Der Auth- und Sicherheitsplan liegt in
  `documentation/auth-security-plan.md`.
- Die UI nutzt einen typisierten Dashboard-Snapshot als View Model. Der
  server-only Read-Pfad unter `lib/dashboard/data.ts` kann Datenbankzeilen
  inklusive Projekten, Issues mit Beschreibungen, öffentlichen
  Agent-Token-Summaries und Project-Events abfragen. Er unterscheidet echte
  Datenbankdaten, eine
  erreichbare aber leere Datenbank und einen sicheren Setup-Zustand, wenn
  Datenbank oder Tabellen fehlen.

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
- Ein optimistischer Proxy für geschützte Browserseiten und `/login`
  verhindert Login-UI-Flashes anhand vorhandener Supabase-Session-Cookies. Er
  erhält Deep-Link-`next`-Werte, ersetzt keine Autorisierung und lässt
  `/api/*` sowie `/auth/*` bei ihren route-spezifischen Auth-Verträgen.
- Persistierte Issue-Erfassung läuft serverseitig über Projektmitgliedschaft,
  schreibt nur Issue plus `created`-Event und startet keine Agent-Runs.
- Persistierte Issue-Statuspflege läuft serverseitig über Projektmitgliedschaft,
  schreibt nur den neuen Status plus `status_changed`-Event und startet keine
  Agent-Runs. Identische Zielstatus werden als No-op behandelt, damit keine
  Audit-Events gespammt werden.
- Persistierte Issue-Inhaltsänderungen laufen serverseitig über
  Projektmitgliedschaft und erlauben Ownern, Maintainer:innen und Members das
  Bearbeiten von Titel/Beschreibung. Viewer erhalten `forbidden`. Identische
  Inhalte werden als No-op behandelt. Issue-Archivierung ist noch nicht
  implementiert, weil `bubblophy_issues` aktuell kein `archived_at` oder
  `is_archived` besitzt.
- Persistierte Agent-Run-Anfragen laufen serverseitig über
  Projektmitgliedschaft und aktive Same-Project-Tokens. Sie schreiben nur einen
  wartenden Run plus `agent_run_requested`-Event; es gibt keinen Worker,
  Toolcall, Polling-Loop oder Autopilot.
- Persistierte Agent-Run-Freigaben und -Abbrüche laufen serverseitig über
  Projektmitgliedschaft und erlauben nur den Übergang aus `requested`.
- Agent-Statusupdates laufen über gehashte Bearer-Tokens mit Scope
  `runs:update`, Projektbindung, aktivem/nicht abgelaufenem Token und enger
  State-Machine. Der Endpoint speichert nur Status, Message, Result-JSON,
  `last_used_at` und Audit-Events; er führt keinen Code aus und wird nicht in
  den menschlichen Login-Redirect-Flow umgebogen.
- Persistierte Plan-Erfassung läuft serverseitig über Issue-Projektmitgliedschaft,
  schreibt eine neue Planversion plus `plan_updated`-Event und startet keine
  Agent-Runs.
- Persistierte Projekt-Erfassung läuft serverseitig über die menschliche
  Session, schreibt Projekt plus Owner-Mitgliedschaft und startet keine
  Agent-Runs.
- Persistierte Projektänderungen und Archivierung laufen serverseitig über
  Owner/Maintainer-Mitgliedschaft. Sie schreiben `project_updated`-Events mit
  klarer Payload (`entity: "project"`, `action`, `changedFields`) ohne
  Inhaltsduplikate.
- Persistierte Projektmitgliedschaftsänderungen laufen serverseitig über
  Owner/Maintainer-Mitgliedschaft und sind für archivierte Projekte gesperrt.
  Rollenänderungen betreffen nur Nicht-Owner-Rollen; Entfernen löscht mangels
  Statusfeld die Mitgliedschaftszeile hart und schreibt ein
  `project_updated`-Event mit `entity: "project_member"` ohne E-Mail- oder
  Profilfelder.
- Archivierte Projekte werden serverseitig für operative Mutationen
  ausgeschlossen: Issue Create/Edit/Status/Plan, Run Request/Human Transition,
  Agent-Run-Tokenupdates und Agent-Token Create/Lifecycle prüfen vorhandene
  Projektbindung gegen nicht archivierte Projekte.
- Persistierte Agent-Token-Erstellung läuft serverseitig über Owner- oder
  Maintainer-Mitgliedschaft, schreibt nur den Token-Hash und startet keine
  Agent-Runs. Projektweite `agent_token_created`-Audit-Events landen in
  `bubblophy_project_events`, nicht in issue-zentrierten Events.
- Der Datenbank-Snapshot liest Agent-Token-Summaries und Project-Events nur für
  Projekte mit menschlicher Mitgliedschaft. Token-Plaintext und `token_hash`
  werden nicht selektiert und nicht an die UI gegeben.
- Der Datenbank-Snapshot liest Planinhalte nur über membership-scoped Issues.
  Ungültige oder leere JSONB-Step-Einträge werden nicht gerendert; ohne
  Planversion bleibt die UI im echten Empty-State.
- Sample-Daten markieren Agent-Tokens und Audit-Aktivität als Beispielvorschau.
  Wenn die Datenbank nicht bereit ist, bleibt der Snapshot leer und zeigt einen
  Setup-Hinweis statt Beispielprojekte als stillen Ersatz. Der Run-Bereich zeigt
  dort keine operative Queue und keine Run-Start- oder Prüfaktion.
- Agenten nutzen eingeschränkte Bubblophy-Agent-Tokens mit Hash, Scopes,
  Projektgrenze, Status und Ablaufdatum.
- Agenten erhalten keine Mensch-Logins und keinen Supabase-Service-Role-Key.
- Alles bleibt human-in-the-loop; Agent-Runs brauchen explizite Freigabe.
- Datenzugriff auf `DATABASE_URL` ist in `drizzle/db/index.ts` durch
  `server-only` auf Server-Bundles begrenzt.
- Projektmitgliedschaften, RLS-Policies und Agent-Scopes sind im Schema und in
  einer lokalen Drizzle-Custom-Migration für die RLS-Baseline vorbereitet.
  Direkte Supabase-Zugriffe bleiben membership-scoped;
  `bubblophy_agent_tokens` wird wegen `token_hash` nicht direkt für
  `authenticated` geöffnet. Server Actions behalten zusätzlich ihre
  serverseitigen Membership-Prüfungen.
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
