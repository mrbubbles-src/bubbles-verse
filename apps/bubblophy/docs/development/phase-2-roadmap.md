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
  `update_issue_status` ergänzt konfliktgeschützte Statusänderungen mit
  aktuellem Expected-Status. Menschliche Run-Freigabe bleibt getrennt.
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

- Status: bestehende Rollenmutationen transaktions- und konfliktfest gehärtet;
  Projektverwaltung und Agent-Token-Manager-Writer sind ebenfalls gegen
  parallelen Rollenentzug gesichert. Auch menschliche Run-Entscheidungen prüfen
  Rolle, Run-Zustand und Token unter geordneten Locks. Issue-Inhalt, Priorität
  und Zuweisung verwenden ebenfalls Projekt-, Issue- und sortierte
  Membership-Locks. Damit ist das Autorisierungs-Race-Gate vor der
  Einladungspersistenz abgeschlossen. Projekt- und Agent-Token-Controls werden
  zusätzlich pro Projekt nur für aktuelle Owner/Maintainer angeboten;
  Inhaltsänderungen an archivierten Projekten lehnt auch die gelockte
  Servergrenze ab.
- Die Einladungspersistenz ist mit normalisierter E-Mail, Nicht-Owner-Rolle,
  gehashtem Token, Ablauf- und konfliktfreien Terminalzuständen angelegt.
  Direkte RLS-Reads bleiben vollständig geschlossen. Create, Reinvite und
  Revoke verwenden gesperrte Manager-Autorisierung, rotierende Einmal-Tokens,
  Compare-and-set und E-Mail-/Token-freie Audit-Ereignisse. Der redigierte
  Manager-Snapshot bindet Owner-/Maintainer-Autorisierung und Einladungsdaten
  in einem Statement und projiziert keine Token-Hashes oder Actor-IDs. Damit
  ist Task 3 abgeschlossen.
- Die Annahme- und Auth-Grenze ist abgeschlossen: Ein öffentlicher Deep-Link
  entfernt das Token vor dem Login aus der URL, hält es kurzlebig und
  `HttpOnly`, und nur der exakte tokenfreie Annahmepfad darf eine verifizierte
  Supabase-Identität vor ihrer ersten Projektmitgliedschaft passieren. Die
  Annahme gleicht Session-E-Mail und Token unter geordneten Locks ab und
  schreibt Mitgliedschaft plus redigiertes Audit atomar. Terminale,
  konkurrierende und falsche Identitäten bleiben fail-closed.
- Die Manager-UX ist abgeschlossen: Der normale Team-Workflow ersetzt die
  technische Auth-ID-Eingabe durch E-Mail-Einladungen, zeigt den vollständigen
  Link nur unmittelbar nach Create oder Reinvite lokal an und bildet offene,
  abgelaufene, angenommene und widerrufene Zustände mit statusgerechten Aktionen
  ab. Archivierte Projekte und Nicht-Manager bleiben schreibgeschützt; die
  direkte Mitglieds-Action bleibt nur als kompatibler Backend-Vertrag bestehen.
- Die verständliche Identitätsanzeige ist umgesetzt: Ein minimales Profil wird
  ausschließlich aus der verifizierten Session synchronisiert und nur als
  optionale Projektion auf Mitgliedschaften gelesen. Namen sind für gemeinsame
  Projektmitglieder sichtbar; E-Mail-Adressen nur für Owner/Maintainer und die
  eigene Person. Profile gewähren niemals Zugriff. Assignee-ID und Label sind
  getrennt, und der Profil-Read revalidiert die Actor-Mitgliedschaft in
  demselben Statement.
- Die Rollen-UX zeigt die aktuelle eigene Rolle, erklärt Owner, Maintainer,
  Member und Viewer in einer kompakten aufklappbaren Übersicht und weist bei
  archivierten Projekten auf die operative Schreibsperre sowie die weiterhin
  mögliche Wiederherstellung durch Owner/Maintainer hin. Rollen- und
  Einladungsoberflächen verwenden dieselben zentralen Bezeichnungen.
- Einladungszustände, Ablauf, Annahme und Widerruf auditierbar machen.
- Der detaillierte Slice-Plan liegt unter
  `docs/superpowers/plans/2026-07-18-bubblophy-roles-invitations.md`.

### 5. Arbeiten mit größeren Datenmengen

- Der bestehende Projekt-/Issue-Deep-Link-Vertrag reagiert nach dem Mount auf
  Browser-Zurück und -Vorwärts, ohne die History-Auswahl mit veraltetem lokalen
  State zu überschreiben. Das ist das URL-Gate vor zusätzlichen Queue-Filtern.
- Der server-only IssuePage-Vertrag ist als getrennte Dashboard-Datengrenze
  vorhanden: ein konkretes sichtbares Projekt, feste 25er-Seiten, Cursor über
  die unveränderliche Issue-Nummer, `newest`/`oldest`, leichte rohe DTOs und ein
  finales Membership-Gate ohne interne Projekt-/Issue-IDs.
- Der unabhängige IssueDetail-Read lädt ein Issue direkt über seinen stabilen
  Key, also auch außerhalb der ersten Queue-Seite oder späterer Filter. Er
  bindet Issue und neuesten Plan im selben Membership-Statement, normalisiert
  Plan-Schritte defensiv, lädt höchstens die neuesten 50 explizit markierten
  Issue-Notizen und revalidiert die Mitgliedschaft danach vor dem DTO. Ein
  `hasMoreNotes`-Signal kennzeichnet ältere, noch nicht geladene Historie;
  allgemeines Audit, Runs und interne Datenbank-IDs bleiben außerhalb.
- Der IssuePage-Read akzeptiert serverseitig validierte Suche über Titel,
  Issue-Nummer und öffentlichen Key sowie je einen Status- und Prioritätsfilter.
  Suche und Filter sitzen mit dem Cursor im Issue-Join, sodass sichtbare
  Projekte ohne Treffer als leere Ergebnisse erhalten bleiben. Ein realer
  Datenbank-EXPLAIN und daraus abgeleitete Such-/Composite-Indizes bleiben vor
  dem Deployment ein eigener Härtungsslice.
- Die konkrete Projekt-Queue nutzt den begrenzten Read jetzt im Dashboard:
  `q`, `status`, `priority`, `sort` und der Vorwärts-Cursor `after` sind
  kanonischer URL-State. Filter- und Seitenwechsel setzen das ausgewählte Issue
  zurück; ein direkter Issue-Key wird unabhängig von Seite und Filtern geladen.
  Lokale Drafts und bestätigte Mutationen werden per öffentlichem Issue-Key
  darübergelegt. Archivierte Projekte bleiben lesbar, alle Writes bleiben
  gesperrt. Page- und Detailfehler fallen nicht still auf Snapshot-Issues
  zurück. Page-Ergebnisse werden nur bei exakt passendem Projekt-, Filter-,
  Sortier- und Cursor-Request verwendet; Detail-Ergebnisse nur beim passenden
  direkten Key. Ein transient nicht verfügbares Detail bewahrt den Deep Link.
  Meldet das finale Page-Gate fehlenden Zugriff, werden alle Snapshot-Daten des
  Projekts vor dem Client-DTO redigiert und ein konkurrierend erfolgreiches
  Detail verworfen. Frisch gelesene Rollen und Archivzustände sind für die
  Issue-Write-Gates autoritativ.
- Der server-only AllProjectIssuePage-Vertrag ist vorhanden: feste 25er-Seiten,
  serverseitige Suche sowie Status-/Prioritätsfilter, `newest`/`oldest` und ein
  stabiler öffentlicher `(updatedAt, projectKey, issueNumber)`-Cursor. Die
  Candidate-Abfrage beginnt bei der aktuellen Mitgliedschaft und schließt
  archivierte Projekte aus; ein zweiter Access-Read aktualisiert Rolle, Name,
  Key und Archivstand und bindet jedes Issue erneut an dasselbe Projekt. Bei
  gleichzeitig entzogenen Kandidaten füllt ein interner Rohcursor weiter bis
  zur gültigen 25er-Seite plus Sentinel auf. Interne Projekt-/Issue-IDs bleiben
  aus dem DTO. Die projektübergreifende UI nutzt diesen Vertrag mit den
  kanonischen Filtern und separaten `allAfterAt`, `allAfterProject` und
  `allAfterIssue`-URL-Feldern. Direkte Details werden unabhängig von der Seite
  über den öffentlichen Issue-Key geladen. Exakte Request-Fingerprints,
  fail-closed Fehlerzustände und revalidierte Rollen verhindern Snapshot-
  Fallbacks und veraltete Schreib-Gates. Der Snapshot enthält keine Issues
  mehr; Page-, AllPage- und Detail-Verträge sind die einzigen serverseitigen
  Issue-Quellen. Bestätigte Mutationen bleiben nur für den aktuell ausgewählten
  Key als lokales Overlay sichtbar. Projektmetriken kommen aus unabhängigen
  SQL-Aggregaten.
- Agent-Run-Statusupdates begrenzen den gesamten PATCH-Envelope beim Streamen
  auf 64 KiB tatsächliche UTF-8-Bytes. Die Service-Grenze akzeptiert auch bei
  direkten Aufrufern höchstens 48 KiB Result-JSON mit 12 Ebenen und 1000
  Knoten; zyklische, wiederverwendete, sparse, accessor-basierte und
  nicht-plain Datenstrukturen werden vor dem Store abgelehnt. Ein während der
  Prüfung erzeugter Plain-Snapshot schließt Proxy- und Mutations-TOCTOU aus.
- Konkrete Projekt-RunQueues lesen eine eigene newest-first 20er-RunPage mit
  stabilem `(updated_at, run_id)`-Cursor. Das Run-Statement bindet aktuelle
  Membership, Projekt, Issue und projektgleiches Token gemeinsam; leere Seiten
  erhalten ein finales Membership-Gate. Runs anderer Projekte können das
  ausgewählte Projekt damit nicht mehr aus dem alten globalen 20er-Limit
  verdrängen. Ein `(issue_id, updated_at, id)`-Index unterstützt den
  projektgebundenen Join und Cursor. Globale Run-Karten navigieren unabhängig
  von der geladenen Issue-Seite direkt zum öffentlichen Issue-Key.
- Der Legacy-Issue-Graph ist entfernt. Der Dashboard-Read lädt keine
  ungruppierten Issue-Details, Planhistorien oder Notizen mehr. Projektmetriken
  werden weiterhin vollständig pro Projekt aggregiert; leere und archivierte
  Projekte bleiben sichtbar. Das finale Membership-Gate bindet Projektzeilen
  und alle abhängigen Key-Gruppen erneut an aktuelle IDs, Keys und Rollen.
- Der erste Audit-Ausbau ist abgeschlossen: Eine membership-scoped
  newest-first 20er-ActivityPage führt Projekt- und Issue-Ereignisse über den
  stabilen öffentlichen `(occurredAt, source, eventId)`-Cursor zusammen. Ein
  minimaler Ereignisart-Filter, vollständige URL-Isolation, erneute
  Resource-Bindung und ehrliche Leer-/Fehlerzustände sind im Dashboard
  integriert. Suche, Akteure, einzelne Eventtypen und Audit-Diffs bleiben
  getrennte spätere Slices.
- Das Mitgliederpanel nutzt eine membership-scoped 20er-MemberPage mit
  stabilem `(createdAt, authUserId)`-Cursor, finalem Rollen-Recheck und
  URL-Pagination. Assignee-Labels werden in den begrenzten Issue-Verträgen
  final membership-geprüft; die Auswahl nutzt einen eigenen issue-gebundenen
  20er-Read mit begrenzter Nutzer-ID-Präfixsuche ohne E-Mail-Adressen. Der unbeschränkte
  Mitglieder-Root-Read ist entfernt. Auch Run-Anfragen hängen nicht mehr von
  der unbeschränkten Token-Verwaltungsliste ab: Ein eigener issue-gebundener
  20er-Selektor filtert aktive, nicht abgelaufene `issues:read`- plus
  `runs:update`-Ziele, gibt nur ID und Label aus und verwendet den stabilen
  `(lower(label), id)`-Cursor. Auch die RunQueue hängt nicht mehr von dieser
  Verwaltungsliste ab: Ein redigiertes Boolean bildet State, Ablauf und
  `runs:update` des exakt dem Run zugeordneten Tokens sowie den Archivstatus
  des Projekts ab. Die
  Verwaltungsansicht für Agent-Tokens bleibt bis zum nächsten Slice
  unpaginiert.
- Datenbankabfragen und Cache-Tags auf größere Projektmengen prüfen.

### 6. Benachrichtigungen und Team-Arbeit

- Benachrichtigungen für Review-Zustände, fehlgeschlagene Runs und offene
  Freigaben ergänzen.
- Kommentar-Threads, bessere Audit-Diffs, Aktivitätsfilter und rollenbasierte
  Ansichten als getrennte Slices umsetzen.
- Agent-Handoffs um klare Client-Anleitungen, Laufzeithinweise und
  Copy-/Command-UX erweitern.

### 7. Dauerhafte Qualitätsgates

- Der zweistufige Dashboard-Read ist gehärtet: Die erste Membership-Abfrage
  begrenzt nur die Kandidaten. Ein zweites, fail-closed Gate bindet unmittelbar
  vor dem DTO-Mapping alle Projekt-, Token- und Run-Zeilen erneut an die
  aktuelle Mitgliedschaft und Rolle. Die getrennten Issue-, Member-, Assignee-,
  Run-Target- und Activity-Reads revalidieren ihre jeweilige
  Projekt-/Resource-Bindung ebenfalls und redigieren sensible Felder nach
  Rollenänderungen erneut.
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
`add_note` und `create_issue` sowie die sichere, auf 20 Treffer pro Seite
begrenzte und optional per Label-Präfix durchsuchbare Run-Zielauswahl
`list_run_targets` und die kontrollierte Run-Anfrage `request_run` sind
vorhanden. Konfliktsichere Statusänderungen laufen über
`update_issue_status`. Ohne
gültige Signatur, Issuer, Ablauf, Subject, OAuth-Client-ID und exakte
MCP-Audience bleibt der Zugriff fail-closed. Der reale Codex-/Claude-Staging-
Smoke bleibt bis zum gemeinsamen Deployment geparkt. Der lokale Rollen- und
Einladungsbereich besitzt nach der Manager-UX nun auch die
session-synchronisierte Identitäts-UX gemäß
`docs/superpowers/plans/2026-07-18-bubblophy-roles-invitations.md`. Die erneute
Membership- und Rollenbindung aller Dashboard-Datengruppen ist ebenfalls
abgeschlossen. Die verständliche Rollenrechte-Erklärung ist ebenfalls im UI
vorhanden. Die begrenzten server-only IssuePage- und direkten IssueDetail-
Verträge einschließlich des serverseitigen IssuePage-Filtervertrags und ihre
konkrete Queue-/URL-Integration sowie der auf 50 Einträge begrenzte Notes-Read
im direkten IssueDetail sind ebenfalls vorhanden. Der inzwischen entfernte
Legacy-Issue-Graph war vor seiner Ablösung ebenfalls auf diesen Vertrag
gehärtet. Die Run-Result-Größenhärtung begrenzt nun Route und Service
unabhängig voneinander. Die
projektgebundene 20er-RunPage mit stabilem URL-Cursor ist ebenfalls vorhanden.
Der begrenzte server-only AllProjectIssuePage-Read und seine konkrete
All-Projekte-URL-/Dashboard-Integration sind ebenfalls vorhanden. Der
unbeschränkte Legacy-Issue-Graph wurde aus dem Dashboard-Snapshot entfernt;
Issue-Listen und Details stammen nur noch aus den begrenzten Page-/Detail-
Verträgen. Die begrenzte ActivityPage und ihre URL-/Dashboard-Integration sind
ebenfalls abgeschlossen. Mitgliederpanel, Issue-Assignee-Labels und
Assignee-Auswahl besitzen inzwischen eigene begrenzte Verträge; der globale
Mitglieder-Root-Read ist entfernt. Run-Anfragen besitzen außerdem eine eigene
begrenzte ausführbare Token-Auswahl. Als nächste größere Datenmenge bleibt die
Agent-Token-Verwaltungsansicht. Die
MCP-Grundlage bleibt unter
`docs/superpowers/plans/2026-07-18-bubblophy-mcp-foundation.md` dokumentiert.
