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
- Ein optimistischer Proxy läuft nur für die expliziten Page-Pfade `/` und
  `/login`. Er prüft nur Supabase-Session-Cookie-Präsenz, verhindert
  Login-UI-Flashes und ersetzt keine serverseitige Autorisierung.
- Projektzugriff kommt aus `bubblophy_project_members`.
- Server-seitige Datenzugriffe prüfen immer die Supabase-User-ID und die
  Projektrolle, bevor DTOs an React-Komponenten gehen.
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
- Agenten verwenden weder die Supabase-Browsercookies noch die
  Supabase-Service-Role. Login/Callback nutzen ausschließlich öffentliche
  Supabase-Anon-Konfiguration.
- Tokens werden nur einmal im Klartext gezeigt. Persistiert wird ausschließlich
  ein starker Hash in `bubblophy_agent_tokens.token_hash`.
- Jedes Token ist auf genau ein Projekt begrenzt.
- Scopes sind explizit und klein: `projects:read`, `issues:read`,
  `issues:write`, `plans:write`, `runs:create`, `runs:update`.
- Tokens können pausiert, widerrufen und mit Ablaufdatum versehen werden.

## Human-in-the-loop

- `bubblophy_issues.requires_human_approval` ist standardmäßig aktiv.
- `bubblophy_issue_plans` speichern Planversionen getrennt von Runs.
- Agent-Runs starten erst, wenn ein Mensch die Arbeit freigibt.
- Agenten dürfen keine dauerhaften Hintergrund-Runs planen.

## Audit und RLS

- Relevante Änderungen landen in `bubblophy_issue_events`.
- Events erfassen entweder `actor_auth_user_id` oder `actor_agent_token_id`.
- RLS-Policies sollen Projektmitgliedschaften für Menschen und Projektgrenzen
  für Agent-Tokens erzwingen.
- Service-Role-Zugriff bleibt ausschließlich serverseitiger Infrastruktur
  vorbehalten und wird nicht an lokale Agenten weitergegeben.
