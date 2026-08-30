# Bubblophy MCP betreiben und verbinden

Dieses Runbook trennt Repository-Code, einmalige Supabase-Konfiguration und die
persönliche Client-Anmeldung. Es enthält keine echten Tokens oder Secrets.

## Zugriffsmodell

- Jede Person verbindet Codex, Claude Code oder einen anderen MCP-Client einmal
  selbst über Supabase OAuth 2.1. Gemeinsame Agent-Tokens sind dafür nicht nötig.
- Der Client speichert Access- und Refresh-Token lokal für diese Person und
  erneuert sie. Bubblophy speichert diese Tokens nicht.
- Das OAuth-Token enthält die Supabase-User-ID in `sub` und die registrierte
  Client-ID in `client_id`.
- `list_projects` lädt bei jedem Aufruf die aktuellen Mitgliedschaften dieser
  `sub` aus `bubblophy_project_members`. Martin und andere Mitglieder sehen
  deshalb unabhängig von Betriebssystem und Agent-Client nur ihre eigenen
  Projekte und Rollen.
- Direkter PostgREST-Zugriff mit OAuth-JWTs bleibt durch Migration `0004` auf
  allen Bubblophy-Tabellen gesperrt. Daten verlassen den Server nur durch den
  engeren MCP-Werkzeugvertrag.

## Was bereits im Repository liegt

- Streamable HTTP unter `POST /mcp`, stateless und OAuth-pflichtig.
- RFC-9728-Metadaten unter
  `/.well-known/oauth-protected-resource/mcp` sowie am kompatiblen
  Origin-Alias.
- Lokale Prüfung asymmetrisch signierter Supabase-JWTs gegen Issuer, Ablauf,
  `sub`, `client_id` und die exakte Audience `<APP_URL>/mcp`.
- Persönlicher Consent unter `/oauth/consent` mit explizitem Erlauben/Ablehnen.
- Read-only-Werkzeuge `list_projects`, paginiertes `list_issues`, `get_issue`,
  `get_issue_plan`, `get_run` und `list_run_targets` mit request-aktueller
  Membership-Prüfung.
- Kontrolliertes Schreibwerkzeug `propose_plan`: neue OAuth-attributierte
  Draft-Version nur für Contributor-Rollen in aktiven Projekten, ohne Approval
  oder Run-Start.
- Kontrolliertes Schreibwerkzeug `add_note`: append-only OAuth-attributierte
  Issue-Notiz für Contributor in aktiven Projekten, ohne Workflow-Mutation.
- Kontrolliertes Schreibwerkzeug `create_issue`: OAuth-attributierter,
  nicht zugewiesener Triage-Draft für Contributor in aktiven Projekten, ohne
  Plan, Approval oder Run.
- `list_run_targets` liefert höchstens 20 aktuell ausführbare
  Same-Project-Agent-Tokens pro Seite für Contributor in aktiven Projekten,
  jeweils nur mit ID und Label. `query` ist eine optionale literale
  Präfixsuche; `nextAfter` wird als `after` fortgesetzt. Für gefilterte
  Folgeseiten muss derselbe `query` erneut gesendet werden. Token-Hash, Scopes,
  Zustand, Ablauf, Creator- und Nutzungsdaten bleiben serverintern.
- Kontrolliertes Schreibwerkzeug `request_run`: legt für ein sichtbares Issue
  und ein erneut geprüftes Run-Ziel nur einen OAuth-attributierten Run im
  Zustand `requested` an. Approval, Ausführung und Issue-Status bleiben
  unverändert; Token- und Actor-IDs fehlen im Output.
- Kontrolliertes Schreibwerkzeug `update_issue_status`: setzt einen der sieben
  bestehenden Issue-Status nur, wenn der zuvor gelesene `expectedStatus` unter
  dem Writer-Lock weiterhin gilt. `blocked` und `done` brauchen einen Grund;
  Konflikte erzeugen weder Update noch Event. Der Tool-Output bleibt frei von
  Actor-, Audit-, Plan-, Approval- und Run-Daten.

## Umgebungsvertrag

Jede Umgebung verwendet ein eigenes Supabase-Projekt und eine feste öffentliche
App-URL. Die Werte müssen zusammenpassen:

```dotenv
NEXT_PUBLIC_APP_URL=https://<bubblophy-host>
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable-or-anon-key>
DATABASE_URL=<server-only-postgres-url>
```

`NEXT_PUBLIC_APP_URL` ist die kanonische Quelle für Consent-Origin,
Protected-Resource-Metadaten und MCP-Audience. Keine Preview-URL und keinen Pfad
eintragen. Der daraus abgeleitete Resource-Identifier ist exakt:

```text
https://<bubblophy-host>/mcp
```

Lokale Unit-, Integrations- und Build-Checks laufen mit der `.test`-URL. Ein
realer Remote-MCP-OAuth-Smoke läuft gegen ein HTTPS-Staging, weil Remote-Clients
und OAuth-Redirects eine dauerhaft erreichbare, kanonische URL brauchen.

## Supabase einmalig pro Umgebung konfigurieren

Die folgenden Schritte verändern externe Infrastruktur und werden bewusst erst
nach Auswahl der Zielumgebung ausgeführt.

1. Alle journalisierten Migrationen `0000` bis `0004` gegen die Ziel-Datenbank
   anwenden. Danach den RLS-Smoke weiter unten ausführen.
2. Unter **Authentication > URL Configuration** die kanonische
   `NEXT_PUBLIC_APP_URL` als Site URL setzen und
   `<NEXT_PUBLIC_APP_URL>/auth/callback` als erlaubte Redirect-URL hinterlegen.
3. Unter **Authentication > Signing Keys** einen asymmetrischen ES256- oder
   RS256-Schlüssel aktivieren. Vor einer Rotation den neuen Standby-Key
   mindestens 20 Minuten über JWKS sichtbar lassen.
4. Unter **Authentication > OAuth Server** OAuth 2.1 aktivieren, als
   Authorization Path exakt `/oauth/consent` setzen und Dynamic Client
   Registration aktivieren.
5. Den folgenden Custom-Access-Token-Hook mit der echten, umgebungsspezifischen
   MCP-URL anlegen. Der Platzhalter darf nicht deployed werden.

```sql
create or replace function private.bubblophy_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  claims jsonb := event -> 'claims';
begin
  if jsonb_typeof(claims) = 'object'
     and nullif(claims ->> 'client_id', '') is not null then
    claims := jsonb_set(
      claims,
      '{aud}',
      to_jsonb('https://<bubblophy-host>/mcp'::text),
      true
    );
    event := jsonb_set(event, '{claims}', claims, true);
  end if;

  return event;
end;
$$;

grant usage on schema private to supabase_auth_admin;
grant execute on function private.bubblophy_access_token_hook(jsonb)
  to supabase_auth_admin;
revoke execute on function private.bubblophy_access_token_hook(jsonb)
  from authenticated, anon, public;
```

6. Unter **Authentication > Hooks** die Postgres-Funktion
   `private.bubblophy_access_token_hook` als **Custom Access Token** Hook
   aktivieren. Sie lässt normale Browser-JWTs unverändert und setzt für jedes
   JWT mit `client_id` die exakte MCP-Audience.
7. Deployment neu starten und die öffentlichen Discovery-Endpunkte prüfen:

```bash
curl --fail --silent --show-error \
  https://<bubblophy-host>/.well-known/oauth-protected-resource/mcp
curl --fail --silent --show-error \
  https://<project-ref>.supabase.co/.well-known/oauth-authorization-server/auth/v1
```

Das Supabase-Projekt dient aktuell nur Bubblophy als externer OAuth-Resource.
Bevor dasselbe Projekt eine zweite Resource ausstellt, muss der Hook einen
expliziten serverseitigen Client-/Resource-Vertrag erhalten. Clientname oder
ein frei gewähltes ID-Präfix sind dafür keine sichere Freigabe.

## Codex verbinden

Der CLI-Ablauf ist auf macOS, Windows und Linux gleich. Die Konfiguration gilt
für den persönlichen Codex-Host und wird von Codex CLI, IDE-Erweiterung und
Codex-App dieses Hosts gemeinsam genutzt.

```bash
codex mcp add bubblophy --url https://<bubblophy-host>/mcp
codex mcp login bubblophy
codex mcp list
```

`codex mcp login` öffnet den Browser. Nach Supabase-Login und Zustimmung landet
das OAuth-Ergebnis wieder im lokalen Client. Codex speichert die OAuth-Daten
standardmäßig über `mcp_oauth_credentials_store = "auto"` im geeigneten lokalen
Credential Store. Sie werden nicht in das Repository geschrieben.

Danach reicht in jeder neuen Aufgabe beispielsweise:

```text
Zeige mir mit Bubblophy, an welchen Projekten ich gerade arbeiten kann.
```

Lokale Verbindung entfernen:

```bash
codex mcp logout bubblophy
codex mcp remove bubblophy
```

## Claude Code verbinden

Für persönlichen Zugriff über alle lokalen Projekte wird der Server im
User-Scope gespeichert. Der Befehl funktioniert in PowerShell, Windows
Terminal sowie üblichen macOS-/Linux-Shells:

```bash
claude mcp add --transport http --scope user bubblophy https://<bubblophy-host>/mcp
claude mcp list
```

Danach in Claude Code `/mcp` öffnen, **bubblophy** auswählen und den
Browser-Login abschließen. Claude Code speichert die Tokens lokal sicher und
erneuert sie automatisch. Ein Repo-Checkout enthält weder Martins noch andere
persönliche Zugangsdaten.

Wenn der Browser-Callback auf einem Rechner nicht automatisch zurückkehrt,
zeigt Claude Code eine URL-Eingabe an; dort die vollständige Callback-URL aus
der Browser-Adresszeile einfügen. Ein fester Callback-Port ist bei aktivierter
dynamischer Registrierung normalerweise nicht nötig.

## Staging-Gate vor Produktion

Der MCP-Foundation-Slice ist erst nach diesem realen Smoke vollständig:

Der lokale Store-Test prüft die erzeugten Lock-Klauseln, ihre Reihenfolge und
ein Serialisierungsmodell. Er ersetzt keinen echten PostgreSQL-Konkurrenztest;
insbesondere Schritt 7 bleibt deshalb ein offenes Produktions-Gate.

1. Zwei Testpersonen mit disjunkten Projektmitgliedschaften vorbereiten; eine
   dritte gemeinsame Mitgliedschaft darf unterschiedliche Rollen haben.
2. Person A über Codex verbinden. Person B getrennt über Claude Code verbinden.
3. In beiden Clients `list_projects` aufrufen. Jeder Client darf nur seine
   aktuelle Projektmenge und Rolle sehen. Anschließend `list_issues` für ein
   eigenes, ein gemeinsames und eine fremde Projekt-ID aufrufen. Issue-Listen
   dürfen nur für aktuelle Memberships erscheinen und keine Beschreibungen,
   User-IDs, Pläne, Runs, Tokens oder Audit-Payloads enthalten.
   `get_issue` darf die Beschreibung nur für ein sichtbares Listen-Issue
   ergänzen und weiterhin keine internen Issue-/User-IDs oder Folgeobjekte
   ausgeben. `get_issue_plan` muss nur die neueste Planversion samt
   `draft`-/`approved`-Status liefern; interne Plan-/Actor-IDs bleiben verborgen
   und ein sichtbares Issue ohne Plan liefert `plan: null`. `get_run` darf nur
   einen sichtbaren Projekt-Run mit öffentlichem State, Agent-Label,
   Zeitstempeln und Secret-gefilterter Result-Kurzfassung liefern, nie rohe
   Result-JSON oder User-/Token-IDs.
4. Eine Membership ändern und alle fünf Werkzeuge ohne neue Anmeldung erneut
   aufrufen. `list_projects`, `list_issues`, `get_issue`, `get_issue_plan` und
   `get_run` müssen die Änderung sofort widerspiegeln; nach Entfernung dürfen
   auch Detail, Plan und Run nicht mehr geladen werden.
5. In einem eigenen Staging-Issue `propose_plan` als Owner/Member aufrufen und
   die neue Version über `get_issue_plan` als `draft` zurücklesen. Audit-
   Attribution auf User plus OAuth-Client prüfen. Derselbe Aufruf muss als
   Viewer und in einem archivierten Projekt scheitern; es darf kein Run
   entstehen. Das Test-Issue anschließend über den normalen menschlichen
   Workflow bereinigen oder archivieren.
6. Am selben Staging-Issue `add_note` als Owner/Member aufrufen und die
   `commented`-Aktivität samt User- und OAuth-Client-Attribution prüfen. Viewer,
   entfernte Membership und archivierte Projekte müssen scheitern. Plan,
   Status, Approval und Runs müssen unverändert bleiben.
7. In einem gemeinsamen aktiven Projekt `create_issue` zeitgleich als zwei
   verschiedene Contributor aufrufen. Es müssen genau zwei Issues mit
   aufeinanderfolgenden, eindeutigen Nummern, Status `triage`, leerer Zuweisung
   und aktivem Human-Approval-Flag entstehen. Beide `created`-Events müssen den
   jeweiligen User und OAuth-Client ausweisen. Es dürfen keine Pläne, Approvals
   oder Runs entstehen. Viewer, entfernte Membership und archivierte Projekte
   müssen scheitern.
8. `list_run_targets` als Contributor aufrufen. Nur aktuell aktive,
   nicht abgelaufene Same-Project-Tokens mit `issues:read` und `runs:update`
   dürfen mit ID und Label erscheinen. Pausierte, widerrufene, abgelaufene oder
   unvollständig berechtigte Tokens sowie alle Hash-, Scope-, Lifecycle-,
   Creator- und Nutzungsfelder müssen fehlen. Mehr als 20 Treffer müssen über
   `nextAfter`/`after` fortgesetzt werden; bei einer Präfixsuche ist derselbe
   `query` auf jeder Folgeseite erneut mitzusenden.
   Viewer, entfernte Membership und archivierte Projekte müssen scheitern.
9. Eines der sichtbaren Ziele mit `request_run` für ein eigenes Staging-Issue
   auswählen. Es müssen genau ein Run im Zustand `requested` und ein
   `agent_run_requested`-Event mit User- plus OAuth-Client-Attribution entstehen.
   Approval-, Start- und Abschlussfelder sowie Issue-Status müssen unverändert
   bleiben. Der Output darf keine Token-, User-, OAuth-Client- oder Event-ID
   enthalten. Viewer, entfernte Membership, archivierte Projekte und ein
   zwischen Auswahl und Schreiben pausiertes Ziel müssen scheitern.
10. `get_issue` aufrufen, dessen Status als `expectedStatus` in
    `update_issue_status` verwenden und einen nichtterminalen Status setzen.
    Das `status_changed`-Event muss User plus OAuth-Client attribuieren; Plan,
    Approval, Runs und Assignee bleiben unverändert. Danach zwischen
    `get_issue` und Write den Status menschlich ändern: Der MCP-Aufruf muss mit
    Konflikt ohne zweites Update/Event enden. Viewer, entfernte Membership und
    archivierte Projekte müssen scheitern. `blocked` und `done` ohne Grund
    müssen bereits an der Toolgrenze scheitern.
11. Beide Clients schließen und neu starten. Der Zugriff muss ohne erneuten
    manuellen Token-Transfer funktionieren.
12. In Staging die Access-Token-Laufzeit vorübergehend kurz genug setzen, um nach
    Ablauf einen erneuten Werkzeugaufruf zu prüfen. Der Client muss per
    Refresh-Token fortfahren; danach die normale Laufzeit wiederherstellen.
13. Mit einem echten OAuth-JWT gegen die Supabase Data API prüfen, dass Reads und
    Writes auf alle acht Bubblophy-Tabellen durch `0004` blockiert bleiben.
    Dasselbe mit einer normalen menschlichen JWT und vorhandener Membership
    gegen die vorgesehenen Select-Policies gegenprüfen.
14. Negativfälle prüfen: falsche Audience, abgelaufenes Token, entfernte
    Membership, unbekannter User und der Versuch, fremde Projekt-IDs zu erraten.
    Archivierte Mitgliedschaftsprojekte bleiben dagegen absichtlich sichtbar
    und müssen mit `isArchived: true` samt historischer Issue-Summaries
    zurückkommen; operative Mutationen bleiben für sie gesperrt.
15. Keine Tokens in Terminalausgabe, Screenshots, Logs oder Testartefakte
    übernehmen. Nur Clientname, Testperson, erwartete/sichtbare Projekt-IDs,
    Zeitstempel und Pass/Fail dokumentieren.

## Rollback und Störungen

- Bei falscher Audience zuerst Hook-Ziel und `NEXT_PUBLIC_APP_URL` vergleichen;
  beide müssen bytegenau auf `<APP_URL>/mcp` hinauslaufen.
- Bei Discovery-Fehlern `WWW-Authenticate` von `/mcp`, Bubblophys
  Protected-Resource-Metadaten und Supabases Authorization-Server-Metadaten
  einzeln prüfen.
- Wenn der Custom-Access-Token-Hook die normale JWT-Ausstellung stört, unter
  **Authentication > Hooks** zuerst nur diesen Hook deaktivieren. Menschliche
  Logins funktionieren dann wieder; neu ausgestellte OAuth-Tokens scheitern am
  exakten Audience-Check von `/mcp` weiterhin fail-closed. Die korrigierte
  Funktion zuerst in Staging prüfen und erst danach wieder aktivieren. Direkt
  nach Deaktivierung und Reaktivierung jeweils einen menschlichen Login sowie
  einen Session-Refresh prüfen. Bereits ausgestellte, gültige Tokens behalten
  ihre Claims bis Ablauf oder Revocation.
- Bei dringender Signing-Key-Revocation alle MCP-Instanzen neu starten, damit
  der lokale JWKS-Cache verworfen wird. Die verbleibende Supabase-Edge-Latenz
  bleibt ein operatives Restrisiko.
- Clientseitiges Logout entfernt lokale Credentials, ersetzt aber noch keine
  serverseitige Grant-Verwaltung. Eine Bubblophy-Oberfläche zum Anzeigen und
  Widerrufen erteilter OAuth-Verbindungen ist ein eigener Phase-2-Slice.

## Referenzen

- [Supabase OAuth 2.1 Server](https://supabase.com/docs/guides/auth/oauth-server/getting-started)
- [Supabase MCP Authentication](https://supabase.com/docs/guides/auth/oauth-server/mcp-authentication)
- [Supabase Token Security und RLS](https://supabase.com/docs/guides/auth/oauth-server/token-security)
- [Codex MCP](https://learn.chatgpt.com/docs/extend/mcp)
- [Claude Code MCP](https://code.claude.com/docs/en/mcp)
