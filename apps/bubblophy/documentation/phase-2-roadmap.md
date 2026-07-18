# Bubblophy Phase 2

Phase 2 baut auf dem abgeschlossenen MVP auf. Die vorhandenen Verträge bleiben
erhalten: Projektzugriff ist mitgliedschaftsbasiert, Agent-Runs bleiben
human-in-the-loop und neue externe Schreibrechte werden nur als eng begrenzte,
auditierte Werkzeuge ergänzt.

## Reihenfolge

### 1. Sicherheitsgate vor dem Remote-MCP

Status: abgeschlossen.

- Redirects akzeptieren nur lokale, normalisierte Pfade.
- Viewer bleiben in UI und serverseitigen Issue-, Plan- und Run-Mutationen
  read-only.
- Agent-Run-Reads und -Updates sind zusätzlich an das Token gebunden, das den
  Run tatsächlich ausführen soll.
- Direkte RLS-Reads auf rohe Run-Resultate und Issue-Event-Payloads bleiben
  geschlossen; öffentliche DTOs werden ausschließlich serverseitig erzeugt.
- Vor Freigabe von `/mcp` prüfen Run-Anfrage und -Freigabe denselben
  ausführbaren Token-Vertrag: aktiv, nicht abgelaufen und mit den erforderlichen
  Scopes. Zustandswechsel verwenden Compare-and-set statt Last-write-wins.

### 2. Providerneutraler Remote-MCP

- Streamable-HTTP-Endpunkt für Codex, Claude und andere MCP-Clients.
- Supabase Auth als OAuth-2.1-Authorization-Server mit PKCE, dynamischer
  Client-Registrierung, Consent und automatisch erneuerten Tokens.
- Bubblophy als Resource-Server mit eigener Protected-Resource-Metadata.
- Berechtigungen werden bei jedem Tool-Aufruf aus der aktuellen
  `bubblophy_project_members`-Zeile ermittelt und nicht als Projektliste im
  Token eingefroren.
- Supabase-OAuth-Scopes beschränken keine Bubblophy-Werkzeuge. Toolzugriff wird
  ausschließlich aus aktueller DB-Rolle und Bubblophy-Client-Policy bestimmt.
- Read-first-Werkzeuge: `list_projects`, `list_issues`, `get_issue`,
  `get_issue_plan`, `get_run` und die enge Auswahl ausführbarer Agent-Tokens
  über `list_run_targets`.
- Kontrollierte Schreibwerkzeuge folgen separat: `propose_plan` als ungeprüfter
  Agent-Entwurf, `add_note` als append-only Aktivität und `create_issue` als
  freigabepflichtiger Triage-Draft sind vorhanden. `request_run` legt nach
  erneuter Rollen- und Tokenprüfung ausschließlich einen ungeprüften Run an.
  Danach folgen kontrollierte Statusänderungen; menschliche Freigabe bleibt
  getrennt.
- Bestehende projektgebundene Agent-Tokens bleiben für unbeaufsichtigte
  Runner und Service-Accounts erhalten. Persönliche Codex-/Claude-Verbindungen
  verwenden OAuth statt gemeinsam genutzter Agent-Tokens.

### 3. Security- und Deployment-Härtung

- RLS-Verträge, OAuth-Audience, Redirects und Runtime-Konfiguration gesondert
  prüfen.
- Supabase OAuth 2.1, dynamische Client-Registrierung und asymmetrische
  Signaturschlüssel für die Zielumgebung konfigurieren.
- Monitoring, Rate Limits, Secret-Handling, Backups und Restore-Ablauf
  dokumentieren und testen.
- Signing-Key-Rotation erst nach mindestens 20 Minuten JWKS-Propagation
  durchführen; für dringende Revocations einen getesteten Cache-Bust- oder
  Remote-Validation-Ablauf festlegen.
- Staging-Smoke für Codex und Claude vor dem Produktions-Rollout.
- Plattformübergreifendes Verbindungs- und Betriebsrunbook für Codex und Claude
  Code: abgeschlossen; realer Staging-Smoke bleibt offen.

### 4. Rollen und Einladungen

- Mitglieder über Profil oder E-Mail statt technischer Auth-User-ID einladen.
- Einladungszustände, Ablauf, Annahme und Widerruf auditierbar machen.
- Rollenansichten und Mutationsrechte für Owner, Maintainer, Member und Viewer
  verständlich abbilden.

### 5. Arbeiten mit größeren Datenmengen

- Suche, Filter, Sortierung und Pagination für Projekte, Issues, Runs und
  Audit-Ereignisse ergänzen.
- Filterzustand in URL und Deep Links stabil halten.
- Datenbankabfragen und Cache-Tags auf größere Projektmengen prüfen.

### 6. Benachrichtigungen und Team-Arbeit

- Benachrichtigungen für Review-Zustände, fehlgeschlagene Runs und offene
  Freigaben ergänzen.
- Kommentar-Threads, bessere Audit-Diffs, Aktivitätsfilter und rollenbasierte
  Ansichten als getrennte Slices umsetzen.
- Agent-Handoffs um klare Client-Anleitungen, Laufzeithinweise und
  Copy-/Command-UX erweitern.

### 7. Dauerhafte Qualitätsgates

- Kritische UI-Flows in stabilen Viewports automatisiert prüfen.
- OAuth-/MCP-Verbindungsaufbau mit Test-Identitäten und getrennten
  Projektmitgliedschaften abdecken.
- Security-, Browser- und Restore-Smokes in die Release-Checkliste aufnehmen.

## Slice-Regeln

- Jeder Slice hat einen überprüfbaren Nutzer- oder API-Vertrag.
- Funktionale Änderungen enthalten Tests, Dokumentation und Changelog.
- Jeder fertige Slice durchläuft Review, Formatierung, Lint, Typecheck und
  relevante Tests, bevor er separat committed wird.
- Große oder gekoppelte Änderungen werden vor etwa 800 bis 1000
  handgeschriebenen Diff-Zeilen erneut zerlegt.
- Kein Slice führt stillen Autopilot, breite Agent-Schreibrechte oder
  Service-Role-Secrets in Clients ein.

## Aktueller Slice

Das Sicherheitsgate ist abgeschlossen. Transport, Protected-Resource-Discovery,
lokale Supabase-JWT-Validierung, das membership-basierte read-only Werkzeug
`list_projects`, das paginierte membership-basierte `list_issues`, die
membership-basierten Detailwerkzeuge `get_issue`, `get_issue_plan` und
`get_run`, die OAuth-vs.-Data-API-RLS-Grenze und der persönliche
OAuth-Consent-Flow sowie die kontrollierten Schreibwerkzeuge `propose_plan`,
`add_note` und `create_issue` sowie die sichere Run-Zielauswahl
`list_run_targets` und die kontrollierte Run-Anfrage `request_run` sind
vorhanden. Ohne
gültige Signatur, Issuer, Ablauf, Subject, OAuth-Client-ID und exakte
MCP-Audience bleibt der Zugriff fail-closed. Als Nächstes folgen die genaue
Supabase-Staging-Konfiguration, der reale Codex-/Claude-Smoke und weitere
Human-in-the-loop-Schreibwerkzeuge wie Statusänderungen nach
`documentation/mcp-operations.md`.
Der detaillierte Plan liegt unter
`docs/superpowers/plans/2026-07-18-bubblophy-mcp-foundation.md`.
