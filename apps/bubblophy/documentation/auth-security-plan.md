# Bubblophy Auth- und Sicherheitsplan

Bubblophy trennt menschliche Anmeldung und agentische API-Zugriffe strikt.
Menschen nutzen Supabase Auth mit GitHub OAuth. Agenten wie Codex oder Claude
Code erhalten keine Mensch-Session, keinen Supabase-Service-Role-Key und keine
dauerhaften Autopilot-Rechte.

## Menschen

- Supabase Auth ist die einzige Login-Schicht für UI-Nutzer.
- `/login`, `/auth/callback` und `/auth/logout` schützen das MVP-Dashboard
  unter `/` mit einer menschlichen Supabase-Session.
- Bis Projektmitgliedschaft und RLS angebunden sind, bleibt die Autorisierung
  fail-closed über die server-only Komma-Liste
  `BUBBLOPHY_ALLOWED_AUTH_EMAILS`.
- Ein optimistischer Proxy läuft nur für explizite Browser-Page-Pfade und
  `/login`. Er prüft nur Supabase-Session-Cookie-Präsenz, erhält sichere
  Deep-Link-`next`-Werte, verhindert Login-UI-Flashes und ersetzt keine
  serverseitige Autorisierung.
- Projektzugriff kommt aus `bubblophy_project_members`.
- Server-seitige Datenzugriffe prüfen immer die Supabase-User-ID und die
  Projektrolle, bevor DTOs an React-Komponenten gehen.
- Issue-Inhaltsänderungen sind serverseitig an die Issue-Projektbindung
  gekoppelt. Owner, Maintainer:innen und Members dürfen Titel/Beschreibung
  ändern; Viewer bleiben lesend.
- Projektverwaltung ist enger: Nur Owner und Maintainer dürfen
  Name/Beschreibung ändern oder Projekte archivieren/wiederherstellen.
  Archivierte Projekte bleiben sichtbar, sind aber keine aktive
  Mutationsfläche.
- Request-bezogene Session-Checks dürfen React `cache()` nutzen, aber nicht in
  `use cache` landen.
- Die aktuelle MVP-Route `/` nutzt noch Snapshot-Daten, ist aber nicht mehr
  öffentlich. Diese temporäre E-Mail-Sperre muss durch Projektmitgliedschaft,
  RLS und server-only Datenzugriff ersetzt werden.
- Supabase Auth muss
  `http://bubblophy.mrbubbles.test:3005/auth/callback` als erlaubte Redirect
  URL kennen. Wenn ein Login nach
  `http://dashboard.mrbubbles.test:3004/?code=...` zurückfällt, fehlt diese
  Bubblophy-Redirect-URL wahrscheinlich oder die Dashboard Site URL wird noch
  als Fallback verwendet.

## Agenten

- Agenten authentifizieren sich über Bubblophy-Agent-Tokens, nicht über
  Supabase Auth.
- Agent/API-Routen bleiben außerhalb des menschlichen Login-Proxys. Fehlende
  oder ungültige Bearer-Tokens müssen als route-spezifische JSON/Auth-Fehler
  zurückkommen, nicht als Redirect zu `/login`.
- Agenten verwenden weder die Supabase-Browsercookies noch die
  Supabase-Service-Role. Login/Callback nutzen ausschließlich öffentliche
  Supabase-Anon-Konfiguration.
- Tokens werden nur einmal im Klartext gezeigt. Persistiert wird ausschließlich
  ein starker Hash in `bubblophy_agent_tokens.token_hash`.
- Jedes Token ist auf genau ein Projekt begrenzt.
- Scopes sind explizit und klein: `projects:read`, `issues:read`,
  `issues:write`, `plans:write`, `runs:create`, `runs:update`. Im aktuellen
  MVP haben `issues:read` und `runs:update` operative Agent-API-Pfade:
  `GET /api/agent-runs/[runId]` liest nur minimalen Run-/Issue-/Plan-Kontext
  für freigegebene oder laufende Runs, `PATCH /api/agent-runs/[runId]`
  schreibt nur Status, Message und Result-JSON.
  Die übrigen Scope-Werte sind reserviert, bis es eigene sichere Endpunkte
  gibt.
- Tokens können pausiert, widerrufen und mit Ablaufdatum versehen werden.
- Erfolgreiche `GET`- und `PATCH`-Zugriffe aktualisieren `last_used_at`; beim
  `GET` ist das die einzige Mutation.
- Lokale Handoff-Beispiele nutzen Platzhalter wie `<agent-token>` und sollen
  keine echten Tokens in Shell-History, Logs, README oder Snapshots schreiben.

## Human-in-the-loop

- `bubblophy_issues.requires_human_approval` ist standardmäßig aktiv.
- `bubblophy_issue_plans` speichern Planversionen getrennt von Runs.
- Agent-Runs starten erst, wenn ein Mensch die Arbeit freigibt.
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
- Geplante RLS-Lesepolicies: Projektmitglieder lesen Projekte, Issues, Pläne,
  Agent-Token-Summaries und Project Events nur für ihre Projekte.
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
