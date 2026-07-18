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
  Projektänderungen sperren Projekt und aktuelle Manager-Mitgliedschaft vor der
  Autorisierungsentscheidung, sodass paralleler Rollenentzug zuerst wirksam
  wird.
- Der Projektbereich zeigt Mitglieder eines ausgewählten Projekts aus
  `bubblophy_project_members`. Ohne Profil- oder Invite-Modell zeigt die UI die
  technische Auth-User-ID als Fallback und bietet noch kein Add-by-E-Mail an.
- Owner und Maintainer können Nicht-Owner-Mitglieder zwischen `maintainer`,
  `member` und `viewer` umstellen oder entfernen. Owner-Rollen, Owner-Removal
  und Self-Removal bleiben im MVP konservativ gesperrt. Projekt und beteiligte
  Mitgliedschaften werden vor der Autorisierungsentscheidung gesperrt;
  Rollenänderung und Entfernung verwenden die sichtbare Ausgangsrolle als
  Compare-and-set-Grenze und überschreiben keine parallelen Änderungen.
- In einer leeren Datenbank führt der UI-Flow von `Neues Projekt` direkt in
  den ausgewählten Projektkontext und bietet dort das erste persistierte Issue
  für dieses Projekt an.
- Projektkarten und Issue-Zeilen sind auswählbare Controls mit sichtbarem
  Zustand. Issue-Zeilen reagieren auf Klick, Enter und Leertaste;
  Projektfilter können gelöst werden; Sidebar-Links führen auf echte
  Dashboard-Sections statt auf Platzhalter.
- Der Issue-Dialog bietet bei aktiver Datenbankquelle `Issue erstellen`; bei
  Sample- oder Fallback-Daten bleibt er bewusst lokal und markiert Drafts als
  nicht gespeichert.
- Im Issue-Detail können Menschen bei aktiver Datenbankquelle den Status eines
  gespeicherten Issues ändern. Die Änderung schreibt ein `status_changed`-Event
  und startet keinen Agent-Run. Projekt, Issue und Membership bleiben während
  der Prüfung gesperrt; das UI sendet den sichtbaren Status als
  `expectedStatus` und zeigt parallele Änderungen als Konflikt statt sie zu
  überschreiben.
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
- `GET /api/agent-runs/[runId]` liefert lokalen Agenten mit
  `Authorization: Bearer <agent-token>` und Scope `issues:read` einen kleinen
  read-only Kontext für freigegebene oder laufende Runs aus Run, Projekt,
  Issue und latest Plan. Der Endpoint prüft Token-Hash, Projektbindung,
  Token-Status/Ablauf und aktualisiert `last_used_at`.
- `PATCH /api/agent-runs/[runId]` nimmt Agent-Statusupdates mit
  `Authorization: Bearer <agent-token>` entgegen. Der Endpoint akzeptiert nur
  `running`, `needs_review`, `completed` und `failed`, prüft Token-Hash,
  Scope `runs:update`, Projektbindung, Token-Status/Ablauf und schreibt
  `last_used_at` plus Audit-Event.
- Der Agent-Token-Bereich zeigt einen lokalen Handoff für diesen bestehenden
  Kontext- und Statusupdate-Pfad. Andere Scope-Werte im Schema sind reserviert,
  bis eigene sichere Agent-API-Endpunkte existieren.
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
  ein projektweites Audit-Event ohne Plaintext oder Hash. Erstellung, Pause,
  Fortsetzung und Widerruf prüfen Projekt und Manager-Mitgliedschaft unter
  stabilen Locks; Lifecycle-Zustände werden erst unter dem Token-Lock bewertet.
- Der Auth- und Sicherheitsplan liegt in
  `documentation/auth-security-plan.md`.
- Der Nach-MVP-Umfang, beginnend mit einem providerneutralen Remote-MCP über
  Supabase OAuth 2.1, liegt in `documentation/phase-2-roadmap.md`.
- Das plattformübergreifende Setup für Supabase, Codex und Claude Code samt
  Audience-Hook, Staging-Gate und Fehlerdiagnose liegt in
  `documentation/mcp-operations.md`.
- `/mcp` stellt den stateless Streamable-HTTP-Transport für den kommenden
  persönlichen OAuth-Zugriff bereit. Die Route validiert Supabase-OAuth-JWTs
  lokal über öffentliche asymmetrische JWKS und verweist bei fehlender oder
  ungültiger Authentifizierung über `WWW-Authenticate` auf Bubblophys
  Protected-Resource-Metadaten.
- Das erste MCP-Werkzeug `list_projects` gibt ausschließlich öffentliche
  Projektfelder, Archivstatus und die aktuelle Rolle der authentifizierten
  Person zurück. Die Mitgliedschaften werden bei jedem Aufruf neu aus
  `bubblophy_project_members` gelesen; Agent-Token-, Issue-, Run-, Audit- und
  andere Userdaten gehören nicht zu diesem Read-Vertrag.
- Das read-only Werkzeug `list_issues` lädt nach einer aktuellen
  Projektmitgliedschaft maximal 100 Issue-Summaries pro Seite. Es liefert
  sichtbaren Issue-Key, Titel, Status, Priorität, Human-Approval-Flag und
  Aktualisierungszeit, aber keine Beschreibungen, User-IDs, Pläne, Runs,
  Agent-Tokens oder Auditdaten. Der stabile Cursor ist die Issue-Nummer.
  Archivierte Mitgliedschaftsprojekte bleiben als markierte historische
  read-only Ansicht lesbar; operative Mutationen bleiben gesperrt.
- Das read-only Werkzeug `get_issue` lädt über Projekt-ID plus Issue-Nummer
  den Titel, die Beschreibung, Status, Priorität, Approval-Flag und Zeitstempel.
  Es bindet das Detail in derselben Abfrage an die aktuelle Membership und gibt
  keine internen Issue- oder User-IDs, Pläne, Runs, Tokens oder Events aus.
- Das read-only Werkzeug `get_issue_plan` lädt für ein sichtbares Issue nur die
  neueste Planversion. Es kennzeichnet sie ausdrücklich als `draft` oder
  `approved`, liefert bei noch fehlendem Plan erfolgreich `plan: null` und gibt
  keine internen Issue-/Plan- oder Actor-IDs aus.
- Das read-only Werkzeug `get_run` bindet Projekt-ID und Run-ID in einer
  Abfrage an die aktuelle Membership, das Issue und das zugeordnete
  Projekt-Token. Es liefert State, Agent-Label und Zeitstempel; rohe
  Result-JSON wird ausschließlich serverintern in die bestehende
  Secret-filternde Kurzfassung überführt. User- und Token-IDs bleiben verborgen.
- Das read-only Werkzeug `list_run_targets` liefert Contributor-Rollen für ein
  aktives Projekt nur ID und Label aktuell ausführbarer Agent-Tokens. Zustand,
  Scopes, Ablauf, Hash, Creator- und Nutzungsdaten bleiben serverintern. Damit
  kann `request_run` ein Ziel referenzieren, ohne den breiteren Token-Vertrag
  offenzulegen; Viewer und archivierte Projekte bleiben gesperrt.
- `request_run` erzeugt für ein sichtbares Issue und ein erneut geprüftes
  Same-Project-Run-Ziel ausschließlich einen OAuth-attributierten Run im Zustand
  `requested`. Projekt, Issue, Membership und Token werden transaktional
  gesperrt; Approval, Worker, Tool-Aufruf, Polling und Issue-Status bleiben
  unangetastet. Der Output enthält weder Token- noch Actor- oder Event-IDs.
- `update_issue_status` ändert für Contributor den Status eines sichtbaren
  aktiven Issues nur, wenn `expectedStatus` unter dem Issue-Lock noch aktuell
  ist. Alle sieben menschlichen Statusziele bleiben erreichbar; `blocked` und
  `done` verlangen im Remote-Vertrag einen Grund. Der Output enthält keine
  Actor-, Audit-, Plan-, Approval- oder Run-Daten.
- `/oauth/consent` übernimmt die einmalige persönliche Zustimmung für neue
  MCP-Clients. Bubblophy zeigt Clientname, angeforderte Standard-Scopes und das
  registrierte Rücksprungziel; Erlauben oder Ablehnen läuft ausschließlich über
  einen Cookie-authentifizierten same-origin `POST`. Der Client-Callback stammt
  danach nur aus Supabase und wird als `303 See Other` aufgerufen.
- Supabase-OAuth-JWTs tragen `client_id`, laufen aber nicht durch die normalen
  Browser-RLS-Freigaben: Eine restrictive Policy auf allen Bubblophy-Tabellen
  sperrt ihren direkten Data-API-Zugriff. OAuth-Datenzugriff erfolgt dadurch nur
  über die explizit registrierten MCP-Werkzeuge und deren serverseitige
  Membership-/Rollenprüfung.
- Planversionen sowie Issue-/Projekt-Audit-Events besitzen getrennte nullable
  OAuth-Client-Attribution. Persönliche MCP-Schreibvorgänge können dadurch die
  menschliche `authUserId` und zusätzlich die konkrete `client_id` festhalten,
  ohne bestehende UI- oder Agent-Actor-Verträge umzudeuten.
- Das erste MCP-Schreibwerkzeug `propose_plan` legt für ein sichtbares aktives
  Issue ausschließlich eine neue ungeprüfte Planversion an. Der vorhandene
  transaktionale Planpfad prüft Membership und Contributor-Rolle erneut,
  schreibt menschliche User- plus OAuth-Client-Attribution und ein Audit-Event.
  Viewer und archivierte Projekte bleiben gesperrt; kein Agent-Run wird
  angelegt oder freigegeben.
- `add_note` hängt für Contributor eine OAuth-attributierte Notiz als
  append-only Issue-Event an. Plan, Status, Approval und Runs bleiben dabei
  unverändert. Plan- und Notizpfad teilen sich dieselbe gesperrte Projekt-,
  Issue- und Membership-Prüfung; Viewer und archivierte Projekte bleiben
  gesperrt.
- `create_issue` erzeugt für Contributor in einem sichtbaren aktiven Projekt
  genau ein OAuth-attributiertes Triage-Issue. Eine Projektsperre serialisiert
  die laufende Issue-Nummer auch bei gleichzeitigen Aufrufen verschiedener
  Mitglieder; die Membership wird danach gesperrt erneut geprüft. Das Issue
  bleibt nicht zugewiesen und freigabepflichtig. Plan, Approval und Run werden
  nicht angelegt.
- `/.well-known/oauth-protected-resource/mcp` veröffentlicht Bubblophys fest
  konfigurierte MCP-Resource und den Supabase-Auth-Issuer. Der Origin-Pfad ohne
  `/mcp` bleibt als kompatibler Alias verfügbar. Eingereichte Host- oder
  Forwarding-Header können diese Discovery-Ziele nicht verändern.
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

Ein echter persönlicher Remote-MCP-Login braucht eine kanonische HTTPS-
Staging- oder Produktions-URL. Nach dem einmaligen Supabase-Browserlogin
speichert der jeweilige Codex-/Claude-Client seine eigenen OAuth-Credentials;
niemand muss Agent-Tokens zwischen Rechnern oder Betriebssystemen kopieren.

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
- Der neue Remote-MCP-Transport ist fail-closed: Nur Supabase-OAuth-JWTs mit
  gültiger Signatur, Issuer, Ablauf, `sub`, `client_id` und exakt Bubblophys
  `/mcp`-Audience erreichen den Transport. `list_projects` verwendet danach
  ausschließlich die validierte `sub` als Membership-Filter. `list_issues`
  verlangt zusätzlich eine aktuelle Membership für die angefragte Projekt-ID;
  fremde und nicht vorhandene Projekte liefern denselben Fehler.
- Ein Agent-Client startet die Supabase-OAuth-Verbindung. Nach dem einmaligen
  Browser-Login und der Zustimmung speichert und erneuert der jeweilige Client
  seine Access- und Refresh-Tokens selbst; Bubblophy persistiert diese Tokens
  nicht.
- Die Auth-Grundstruktur nutzt nur `NEXT_PUBLIC_*` Supabase-Anon-Konfiguration.
- Das Dashboard unter `/` verlangt eine Supabase-Session und prüft
  serverseitig DB-basierten Zugang. Ein aktiver Eintrag in
  `private.dashboard_github_allowlist` dient als Owner-/Bootstrap-Zugang;
  projektbezogene Kollaborateur:innen dürfen über
  `bubblophy_project_members.auth_user_id` rein.
- Ein optimistischer Proxy für geschützte Browserseiten und `/login`
  verhindert Login-UI-Flashes anhand vorhandener Supabase-Session-Cookies. Er
  erhält Deep-Link-`next`-Werte, ersetzt keine Autorisierung und lässt
  `/api/*` sowie `/auth/*` bei ihren route-spezifischen Auth-Verträgen.
- Persistierte Issue-Erfassung läuft serverseitig über Projektmitgliedschaft,
  verlangt Owner-, Maintainer- oder Member-Rolle, schreibt nur Issue plus
  `created`-Event und startet keine Agent-Runs. Viewer bleiben read-only.
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
- Persistierte Prioritäts- und Zuweisungsänderungen verwenden denselben
  gesperrten Contributor-Kontext. Bei Zuweisungen werden Actor und Zielmitglied
  gemeinsam in stabiler Reihenfolge gesperrt; entfernte oder projektfremde
  Zielmitglieder ergeben `invalid_assignee` statt eines ungeschützten Writes.
- Persistierte Agent-Run-Anfragen laufen serverseitig über
  Projektmitgliedschaft und ausführbare Same-Project-Tokens. Ausführbar bedeutet
  aktiv, nicht abgelaufen und mit `issues:read` plus `runs:update`. Sie schreiben
  nur einen wartenden Run plus `agent_run_requested`-Event; es gibt keinen
  Worker, Toolcall, Polling-Loop oder Autopilot.
- Persistierte Agent-Run-Freigaben und -Abbrüche laufen serverseitig über
  Projektmitgliedschaft und erlauben nur den atomaren Übergang aus `requested`.
  Freigaben prüfen den ausführbaren Token erneut; Abbrüche bleiben bei einem
  inzwischen nicht verfügbaren Token möglich. Projekt, handelnde
  Mitgliedschaft, Run und Token werden in dieser Reihenfolge gesperrt, damit
  paralleler Rollenentzug oder Token-Widerruf nicht mit der Entscheidung
  kollidiert. Andere Issue-Writes verwenden dafür einen serialisierenden
  `NO KEY UPDATE`-Lock, der mit dem impliziten Fremdschlüssel-Lock ihrer
  Audit-Events kompatibel bleibt.
- Agent-Kontextreads laufen über gehashte Bearer-Tokens mit Scope
  `issues:read`, Projektbindung und aktivem/nicht abgelaufenem Token. Der
  Endpoint verlangt zusätzlich das dem Run zugeordnete Token, gibt nur Run,
  Projekt, Issue und latest Plan zurück, aktualisiert `last_used_at` und liest
  keine Token-, Member-, User- oder Audit-DTOs aus.
- Agent-Statusupdates laufen über gehashte Bearer-Tokens mit Scope
  `runs:update`, Projektbindung, aktivem/nicht abgelaufenem Token und enger
  State-Machine. Auch hier muss das Token dem Run zugeordnet sein. Der Endpoint
  speichert nur Status, Message, Result-JSON, `last_used_at` und Audit-Events;
  er führt keinen Code aus und wird nicht in den menschlichen
  Login-Redirect-Flow umgebogen. Zustandsupdates verwenden Compare-and-set und
  erzeugen nach einem verlorenen konkurrierenden Update kein Audit-Event.
- Relative Auth-Redirects lehnen Backslash- und Host-Umgehungen ab.
- Direkte `authenticated`-RLS-Reads auf rohe Agent-Run-Resultate und
  Issue-Event-Payloads sind geschlossen. Diese Daten werden nur über
  membership-geprüfte serverseitige DTOs ausgegeben.
- Projekt-Einladungen besitzen eine server-only Persistenzbasis mit
  normalisierter E-Mail, Nicht-Owner-Rolle, SHA-256-Token-Hash, Ablauf und
  widerspruchsfreien Annahme-/Widerrufsfeldern. Direkte RLS-Grants oder
  -Policies gibt es für diese Tabelle nicht; eine Einladung gewährt vor der
  späteren atomaren Annahme keinerlei Mitgliedschaft oder MCP-Zugriff.
- Owner und Maintainer können Einladungen serverseitig erstellen, erneut
  ausstellen und widerrufen. Erneutes Ausstellen rotiert Token und Ablauf;
  konkurrierende oder terminale Änderungen überschreiben sich nicht. Nur der
  erfolgreiche Create-/Reinvite-Aufruf erhält das Klartext-Token einmalig,
  während Audit-Ereignisse weder E-Mail noch Token oder Token-Hash enthalten.
- Der Manager-Snapshot liest Autorisierung und Einladungen in einem
  Datenbank-Statement. Er zeigt E-Mail, Nicht-Owner-Rolle, abgeleiteten Zustand
  und Lebenszyklus-Zeitpunkte, schließt aber Token-Hash sowie Einladenden-,
  Annahme- und Widerruf-User-ID aus. Nicht-Manager erhalten kein
  unterscheidbares Einladungs-Ergebnis.
- Öffentliche Einladungslinks legen das Klartext-Token höchstens 30 Minuten in
  einem `HttpOnly`-/`SameSite=Lax`-Cookie ab und leiten sofort auf den
  tokenfreien Pfad `/invitations/accept` um. Nur dieser exakte Pfad darf einen
  bereits bei Supabase angemeldeten Nutzer vor der ersten Mitgliedschaft durch
  das normale Bubblophy-Zugangsgate führen. Die Annahme bindet Token und
  verifizierte Session-E-Mail unter Projekt-, Membership- und Einladungs-Locks,
  erstellt Mitgliedschaft und Audit atomar. Das Token erscheint weder in
  Client-JavaScript, Markup noch Action-Ergebnis; die E-Mail ist nur für den
  authentifizierten Nutzer sichtbar. Audit-Payloads enthalten weder E-Mail,
  Token noch Hash.
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
- Der projektgebundene Agent-Token-API-Vertrag bleibt eng: Lokale Runner können
  mit
  Scope `issues:read` minimalen Run-/Issue-/Plan-Kontext über
  `GET /api/agent-runs/[runId]` für freigegebene oder laufende Runs lesen und
  mit Scope `runs:update` Status, Message und Result-JSON für freigegebene Runs an
  `PATCH /api/agent-runs/[runId]` melden. Dieser Token-Vertrag kann keine Pläne,
  Issues oder Runs anlegen. Persönliche OAuth-MCP-Clients können getrennt davon
  ungeprüfte Pläne vorschlagen, Notizen anhängen und freigabepflichtige
  Triage-Issues erstellen; keiner dieser Schreibpfade startet einen Run.
- Alles bleibt human-in-the-loop; Agent-Runs brauchen explizite Freigabe.
- Datenzugriff auf `DATABASE_URL` ist in `drizzle/db/index.ts` durch
  `server-only` auf Server-Bundles begrenzt.
- Projektmitgliedschaften, RLS-Policies und Agent-Scopes sind im Schema und in
  einer lokalen Drizzle-Custom-Migration für die RLS-Baseline vorbereitet.
  Direkte Supabase-Zugriffe bleiben membership-scoped;
  `bubblophy_agent_tokens` wird wegen `token_hash` nicht direkt für
  `authenticated` geöffnet. Server Actions behalten zusätzlich ihre
  serverseitigen Membership-Prüfungen.
- Die Issue-Nummer-Vergabe liest transaktional `max(issue_number) + 1` pro
  Projekt. Ein `FOR NO KEY UPDATE`-Lock auf dem aktiven Projekt serialisiert
  parallele Erstellungen; der eindeutige DB-Index bleibt zusätzliche Absicherung.

## Environment

```env
NEXT_PUBLIC_APP_URL=http://bubblophy.mrbubbles.test:3005
NEXT_PUBLIC_AUTH_COOKIE_DOMAIN=.mrbubbles.test
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
DATABASE_URL=...
```

`NEXT_PUBLIC_AUTH_COOKIE_DOMAIN` ist optional, sollte aber zur lokalen
Subdomain passen, sobald Bubblophy denselben Supabase-OAuth-Flow wie die
anderen Bubblesverse-Apps nutzt.

Bubblophy liest keine erlaubten Menschen aus der Env. Supabase Auth liefert
die Identität; die Datenbank entscheidet über Zugang und Projektumfang.

## Supabase Auth Redirects

Die Supabase Auth URL Configuration muss
`http://bubblophy.mrbubbles.test:3005/auth/callback` als erlaubte Redirect URL
enthalten. Der lokale Login-Button setzt diese URL als `redirect_to`.

Wenn der GitHub/Supabase-Login stattdessen auf
`http://dashboard.mrbubbles.test:3004/?code=...` endet, fehlt sehr
wahrscheinlich die Bubblophy-Redirect-URL in Supabase oder Supabase nutzt noch
die Dashboard Site URL als Fallback.
