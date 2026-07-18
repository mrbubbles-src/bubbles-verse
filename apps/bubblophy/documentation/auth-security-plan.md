# Bubblophy Auth- und Sicherheitsplan

Bubblophy trennt menschliche Anmeldung und agentische API-Zugriffe strikt.
Menschen nutzen Supabase Auth mit GitHub OAuth. Agenten wie Codex oder Claude
Code erhalten keine Mensch-Session, keinen Supabase-Service-Role-Key und keine
dauerhaften Autopilot-Rechte.

## Menschen

- Supabase Auth ist die einzige Login-Schicht für UI-Nutzer.
- `/login`, `/auth/callback` und `/auth/logout` schützen das MVP-Dashboard
  unter `/` mit einer menschlichen Supabase-Session.
- Die Autorisierung bleibt fail-closed und DB-basiert: Ein aktiver Eintrag in
  `private.dashboard_github_allowlist` erlaubt Owner-/Bootstrap-Zugang; eine
  vorhandene Zeile in `bubblophy_project_members` erlaubt projektbezogenen
  Zugang für genau diese Supabase-User-ID.
- Ein optimistischer Proxy läuft nur für explizite Browser-Page-Pfade und
  `/login`. Er prüft nur Supabase-Session-Cookie-Präsenz, erhält sichere
  Deep-Link-`next`-Werte, verhindert Login-UI-Flashes und ersetzt keine
  serverseitige Autorisierung.
- Projektzugriff kommt aus `bubblophy_project_members`.
- Server-seitige Datenzugriffe prüfen immer die Supabase-User-ID und die
  Projektrolle, bevor DTOs an React-Komponenten gehen.
- Owner, Maintainer:innen und Members dürfen Issue-, Plan- und Run-Mutationen
  auslösen. Viewer bleiben in UI und serverseitigen Stores read-only.
- Issue-Inhaltsänderungen sind serverseitig an die Issue-Projektbindung
  gekoppelt. Owner, Maintainer:innen und Members dürfen Titel/Beschreibung
  ändern; Viewer bleiben lesend.
- Projektverwaltung ist enger: Nur Owner und Maintainer dürfen
  Name/Beschreibung ändern oder Projekte archivieren/wiederherstellen.
  Archivierte Projekte bleiben sichtbar, sind aber keine aktive
  Mutationsfläche.
- Request-bezogene Session-Checks dürfen React `cache()` nutzen, aber nicht in
  `use cache` landen.
- Die Route `/` ist nicht öffentlich. App-Zugang und Projektumfang werden
  getrennt geprüft: Der App-Gate lässt nur DB-berechtigte Menschen rein, und
  Datenzugriffe bleiben zusätzlich membership-scoped.
- Supabase Auth muss
  `http://bubblophy.mrbubbles.test:3005/auth/callback` als erlaubte Redirect
  URL kennen. Wenn ein Login nach
  `http://dashboard.mrbubbles.test:3004/?code=...` zurückfällt, fehlt diese
  Bubblophy-Redirect-URL wahrscheinlich oder die Dashboard Site URL wird noch
  als Fallback verwendet.

## Agenten

- Unbeaufsichtigte Runner und Service-Accounts authentifizieren sich weiter
  über projektgebundene Bubblophy-Agent-Tokens. Persönliche Codex-, Claude- und
  andere MCP-Verbindungen authentifizieren die handelnde Person über Supabase
  OAuth 2.1 und erhalten keine gemeinsam genutzten Agent-Tokens.
- Jede Person autorisiert jeden lokalen Client selbst. Codex beziehungsweise
  Claude Code speichert und erneuert die eigenen OAuth-Credentials im lokalen
  Credential Store; Bubblophy persistiert weder Access- noch Refresh-Tokens.
  Betriebssystem und Agent-Anbieter ändern die serverseitige Membership-Prüfung
  nicht.
- Agent/API-Routen bleiben außerhalb des menschlichen Login-Proxys. Fehlende
  oder ungültige Bearer-Tokens müssen als route-spezifische JSON/Auth-Fehler
  zurückkommen, nicht als Redirect zu `/login`.
- Agenten verwenden weder die Supabase-Browsercookies noch die
  Supabase-Service-Role. Login/Callback nutzen ausschließlich öffentliche
  Supabase-Anon-Konfiguration.
- `/mcp` validiert persönliche OAuth-Access-Tokens lokal über Supabases
  öffentliche asymmetrische JWKS. Akzeptiert werden nur Tokens mit dem
  konfigurierten Supabase-Issuer, gültigem Ablauf, `sub`, `client_id` und exakt
  Bubblophys kanonischer `/mcp`-Audience. Ungültige Tokens werden nicht geloggt;
  Claims werden nicht pauschal an Werkzeuge weitergereicht.
- Der MCP-Server cached Supabases JWKS explizit höchstens zehn Minuten und
  begrenzt erneute Fetches nach einem Erfolg für 30 Sekunden; Supabases Edge
  cached dasselbe Dokument zusätzlich ungefähr zehn Minuten. Vor einer
  Signing-Key-Rotation muss ein Standby-Key deshalb mindestens 20 Minuten lang
  sichtbar sein. Bei einer dringenden Revocation kann der MCP-Server einen
  widerrufenen Schlüssel innerhalb dieses Stalenessfensters noch akzeptieren.
  Ein Produktions-Runbook muss dafür MCP-Instanzen neu starten und, falls die
  verbleibende Supabase-Edge-Latenz nicht tragbar ist, vor dem Rollout einen
  separaten Remote-Validation-/Cache-Bust-Pfad festlegen.
- Das read-only MCP-Werkzeug `list_projects` beginnt seine Datenbankabfrage bei
  `bubblophy_project_members` und filtert auf die validierte OAuth-`sub`. Es
  liest Rollen bei jedem Aufruf neu und gibt nur Projekt-ID, Key, Name,
  Beschreibung, Archivstatus und aktuelle Rolle zurück. Agent-Token-, Issue-,
  Run-, Audit- und andere Userdaten werden nicht selektiert.
- Das read-only MCP-Werkzeug `list_issues` startet ebenfalls bei
  `bubblophy_project_members` und bindet User-ID plus angefragte Projekt-ID in
  dieselbe Abfrage. Es liefert höchstens 100 öffentliche Summaries pro Seite;
  Beschreibung, Assignee-/Creator-IDs, Pläne, Runs, Tokens und Events werden
  nicht selektiert. Fehlende und fremde Projekte bleiben ununterscheidbar.
  Archivierte Mitgliedschaftsprojekte sind nur für historische Reads sichtbar
  und werden im Ergebnis ausdrücklich als archiviert markiert.
- Das read-only MCP-Werkzeug `get_issue` verwendet Projekt-ID und Issue-Nummer
  aus der Liste und bindet beides zusammen mit OAuth-`sub` an eine aktuelle
  Membership. Der Detailvertrag ergänzt die Beschreibung und Zeitstempel, aber
  keine internen Issue-/User-IDs, Pläne, Runs, Tokens oder Events.
- Die OAuth-Zustimmungsseite verlangt zusätzlich zur Supabase-Cookie-Session
  den aktuellen DB-basierten Bubblophy-Zugang. Die Decision-Route akzeptiert nur
  URL-encoded `POST`-Formulare mit exakt passendem kanonischem Origin; zusammen
  mit den `SameSite=Lax`-Auth-Cookies bildet das den CSRF-Schutz. ID, Entscheidung
  und User-Zuordnung werden vor jedem Approve/Deny erneut geprüft.
- OAuth-Callback-URLs werden niemals aus Query- oder Formwerten übernommen.
  Ausschließlich Supabases `redirect_url` nach erfolgreicher Entscheidung wird
  als `303 See Other` verwendet, damit der Consent-POST nicht an den Client
  weitergesendet wird. Authorization-ID, Code, State und rohe Auth-Fehler werden
  weder angezeigt noch protokolliert.
- Supabase-Standard-Scopes begrenzen keinen direkten Datenbankzugriff.
  `0004_close_oauth_direct_reads.sql` ergänzt deshalb auf jeder
  Bubblophy-Tabelle eine restrictive `FOR ALL`-Policy: JWTs mit `client_id`
  scheitern bei `USING` und `WITH CHECK`. Normale menschliche Sessions ohne
  `client_id` behalten die bestehenden Membership-Policies; MCP-Zugriffe laufen
  über den serverseitigen Datenbankpfad und dessen eigenen Toolvertrag.
- Der umgebungsspezifische Custom-Access-Token-Hook setzt `aud` nur für JWTs
  mit `client_id` auf Bubblophys exakte `/mcp`-Resource. Normale Browser-JWTs
  bleiben unverändert. Der vollständige Betriebs- und Smoke-Vertrag liegt in
  `mcp-operations.md`.
- Tokens werden nur einmal im Klartext gezeigt. Persistiert wird ausschließlich
  ein starker Hash in `bubblophy_agent_tokens.token_hash`.
- Jedes Token ist auf genau ein Projekt begrenzt.
- Run-Kontext und Statusupdates verlangen zusätzlich, dass das authentifizierte
  Token dem angefragten Run zugeordnet ist. Ein anderes Token desselben Projekts
  erhält keinen Zugriff.
- Scopes sind explizit und klein: `projects:read`, `issues:read`,
  `issues:write`, `plans:write`, `runs:create`, `runs:update`. Im aktuellen
  MVP haben `issues:read` und `runs:update` operative Agent-API-Pfade:
  `GET /api/agent-runs/[runId]` liest nur minimalen Run-/Issue-/Plan-Kontext
  für freigegebene oder laufende Runs, `PATCH /api/agent-runs/[runId]`
  schreibt nur Status, Message und Result-JSON.
  Die übrigen Scope-Werte sind reserviert, bis es eigene sichere Endpunkte
  gibt.
- Tokens können pausiert, widerrufen und mit Ablaufdatum versehen werden.
- Run-Anfrage und menschliche Freigabe verwenden denselben ausführbaren
  Token-Vertrag: projektgebunden, aktiv, nicht abgelaufen sowie mit
  `issues:read` und `runs:update`. Ein Abbruch bleibt auch bei einem später
  pausierten, abgelaufenen oder widerrufenen Token möglich.
- Erfolgreiche `GET`- und `PATCH`-Zugriffe aktualisieren `last_used_at`; beim
  `GET` ist das die einzige Mutation.
- Lokale Handoff-Beispiele nutzen Platzhalter wie `<agent-token>` und sollen
  keine echten Tokens in Shell-History, Logs, README oder Snapshots schreiben.

## Human-in-the-loop

- `bubblophy_issues.requires_human_approval` ist standardmäßig aktiv.
- `bubblophy_issue_plans` speichern Planversionen getrennt von Runs.
- Agent-Runs starten erst, wenn ein Mensch die Arbeit freigibt.
- Menschliche und agentische Run-Zustandswechsel verwenden Compare-and-set auf
  Run-ID und bisherigen Zustand. Verliert eine konkurrierende Mutation, wird
  kein widersprüchliches Audit-Event geschrieben.
- Agenten dürfen keine dauerhaften Hintergrund-Runs planen.

## Audit und RLS

- Issue- und Plan-Änderungen landen in `bubblophy_issue_events`.
- Issue-Inhaltsänderungen nutzen den vorhandenen `commented`-Eventtyp mit
  eindeutiger Payload (`entity: "issue"`, `action: "updated"`,
  `changedFields`) statt stiller Datenänderung.
- Projektweite Änderungen wie `agent_token_created`, spätere Token-Revoke- und
  Run-Freigabe-Ereignisse landen in `bubblophy_project_events`.
- Projektänderungen und Archivstatuswechsel nutzen `project_updated` mit
  eindeutiger Payload (`entity: "project"`, `action`, `changedFields`) und ohne
  kopierte Projektinhalte.
- `bubblophy_project_events` ist projektgebunden (`project_id NOT NULL`) und
  hält nur öffentliche Metadaten. Token-Plaintext und Token-Hash gehören weder
  in Audit-Payloads noch in Logs.
- Events erfassen entweder `actor_auth_user_id` oder `actor_agent_token_id`.
- RLS-Lesepolicies erlauben Projektmitgliedern nur projektgebundene, dafür
  vorgesehene Tabellen. Direkte `authenticated`-Reads auf
  `bubblophy_agent_runs` und `bubblophy_issue_events` sind geschlossen, weil
  rohe Result- und Event-Payloads sensible Inhalte enthalten können. Diese
  Daten verlassen den Server nur über membership-geprüfte DTOs.
- Geplante RLS-Schreibpolicies für Menschen: Issue-/Plan-Schreibpfade prüfen
  Projektmitgliedschaft; Token-Erstellung bleibt Owner/Maintainer-only über
  serverseitige Actions.
- Geplante Agent-Token-Policies: Agenten nutzen nur projektbegrenzte API-Pfade
  mit Hash-Token, Status, Scopes und Ablaufdatum. Sie erhalten keine
  Mensch-Session und keinen Service-Role-Key.
- Project Events werden nur über serverseitige Mutationen oder spätere
  agentische API-Grenzen geschrieben, nicht direkt aus dem Browser.
- Service-Role-Zugriff bleibt ausschließlich serverseitiger Infrastruktur
  vorbehalten und wird nicht an lokale Agenten weitergegeben.
