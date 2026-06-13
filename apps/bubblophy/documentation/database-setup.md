# Bubblophy Database Setup

Diese Notiz beschreibt den reviewbaren Datenbank-Stand für Bubblophy. Sie ist
bewusst lokal vorbereitet: Es wurde keine Remote-Migration ausgeführt und keine
Supabase-Datenbank verändert.

## Monorepo-Konvention

- Bubblophy nutzt wie `apps/dashboard` und `apps/the-coding-vault` Drizzle Kit
  mit `drizzle.config.ts`, `schema: './drizzle/db/schema.ts'` und
  `out: './drizzle'`.
- Migrationen liegen als SQL-Dateien direkt unter `apps/*/drizzle/`; Drizzle
  Meta-Snapshots liegen unter `apps/*/drizzle/meta/`.
- Schema-Änderungen werden lokal mit `bunx drizzle-kit generate` erzeugt und
  als Review-Artefakt committed. Anwenden passiert separat und bewusst mit der
  passenden Datenbank-URL.

## Vorbereitete Migration

Die Struktur und die erste RLS-Baseline liegen aktuell in drei lokalen
Migrationen:

```text
apps/bubblophy/drizzle/0000_premium_psynapse.sql
apps/bubblophy/drizzle/0001_chilly_hiroim.sql
apps/bubblophy/drizzle/0002_bubblophy_rls_baseline.sql
```

`0000_premium_psynapse.sql` erzeugt:

- Enums: Projektrollen, Issue-Status, Issue-Prioritäten, Issue-Event-Typen,
  Agent-Token-Status und Agent-Run-Status.
- Tabellen: `bubblophy_projects`, `bubblophy_project_members`,
  `bubblophy_issues`, `bubblophy_issue_plans`, `bubblophy_issue_events`,
  `bubblophy_agent_tokens`, `bubblophy_agent_runs`.
- Foreign Keys mit projekt- und issuebezogenen Cascade-/Set-Null-Regeln.
- Unique Constraints/Indexes für Projekt-Slug, Projekt-Key,
  Projektmitgliedschaft, Issue-Nummer pro Projekt, Planversion pro Issue und
  Agent-Token-Hash.
- Query-Indexes für Projektmitgliedschaften, Issue-Status, zugewiesene User,
  Agent-Runs, Agent-Token-State und Issue-Events.

`0001_chilly_hiroim.sql` ergänzt:

- `bubblophy_project_event_type` für projektweite Audit-Ereignisse wie
  `agent_token_created`, Token-Revoke- und spätere Run-Freigabe-Ereignisse.
- `bubblophy_project_events` mit `project_id NOT NULL`, Actor-Feldern,
  optionaler Run-Referenz, Summary, Payload und Zeitstempel.
- Foreign Keys auf Projekt, optionales Actor-Agent-Token und optionalen Run.
- Query-Indexes für Projekt-Zeitachse, menschliche Actor, Agent-Token-Actor und
  Agent-Run-Bezug.

Der alte Issue-Event-Enum-Wert `agent_token_created` bleibt aus
Migrationskompatibilität im Baseline-Enum, wird aber nicht mehr als aktiver
Schreibpfad genutzt. Neue Token-Audit-Ereignisse gehören in
`bubblophy_project_events`.

Prüfung der generierten Migration:

- Keine `DROP`-, `DELETE`-, `TRUNCATE`- oder destruktiven
  `ALTER TABLE ... DROP`-Statements.
- Keine Service-Role-Annahmen.

`0002_bubblophy_rls_baseline.sql` ergänzt:

- `private` Helper-Funktionen nach Dashboard-Muster, um den aktuellen
  Supabase-Auth-User und Projektmitgliedschaft für Policies zu prüfen.
- `alter table ... enable row level security` für alle Bubblophy-Tabellen.
- Membership-gebundene direkte `select` Policies für Projekte,
  Projektmitgliedschaften, Issues, Pläne, Issue-Events, Projekt-Events und
  Agent-Runs.
- Keine direkten Browser-Write-Policies. Mutationen bleiben weiterhin über
  server-only Server Actions mit eigener Membership-Prüfung begrenzt.
- Keine direkte `authenticated` Select-Freigabe auf `bubblophy_agent_tokens`,
  weil PostgreSQL-RLS keine Spalten maskiert und `token_hash` geheim bleiben
  muss. Öffentliche Token-Summaries laufen aktuell server-only; eine sichere
  View kann später separat ergänzt werden.

Diese RLS-Baseline ist additiv und lokal reviewbar. Sie wurde nicht remote
angewendet.

## Lokal reviewen

Aus dem App-Ordner:

```bash
cd apps/bubblophy
bunx drizzle-kit generate
```

Nur zum Anwenden gegen eine bewusst ausgewählte Datenbank, nicht während
Review-Arbeit:

```bash
cd apps/bubblophy
bunx drizzle-kit migrate
```

Vor einem echten `migrate` muss `DATABASE_URL` auf die gewünschte Zielumgebung
zeigen. Für hosted Supabase sollte dafür eine sichere direkte
Migrationsverbindung genutzt werden, nicht ein Browser-Anon-Key und kein
Service-Role-Key im Frontend.

Die Migration nutzt `gen_random_uuid()` für Text-IDs. Supabase-Projekte stellen
diese Funktion üblicherweise über die passende Postgres-Extension bereit. Falls
eine Ziel-Datenbank beim Anwenden der Migration meldet, dass
`gen_random_uuid()` fehlt, muss die Funktion beziehungsweise Extension bewusst
in dieser Zielumgebung aktiviert werden, bevor die Strukturmigration läuft.
Das ist eine Datenbank-Setup-Aufgabe und gehört nicht in Frontend-Code oder
Browser-seitige Service-Role-Konfiguration.

## Setup-Zustand im Dashboard erkennen

Das Dashboard unterscheidet beim server-only Read-Pfad drei operative Zustände:

- `database`: Tabellen sind lesbar und es gibt Daten für Projekte, Issues,
  Agent-Token-Summaries oder Projekt-Events.
- `empty_database`: Die Datenbank ist erreichbar, aber der eingeloggte Mensch
  hat noch keine Projekte. Das ist der echte Erstbenutzungszustand; die UI zeigt
  `Neues Projekt`.
- `database_unavailable`: `DATABASE_URL` fehlt, die Verbindung schlägt fehl
  oder die Bubblophy-Tabellen wirken noch nicht vorhanden. Die UI zeigt einen
  sicheren Setup-Hinweis und keine Beispielprojekte als Ersatz.

Wenn nach Login `Datenbank nicht bereit` erscheint, zuerst lokale Env und
Dev-Server-Neustart prüfen. Bei `schema_missing` danach die oben genannten
Migrationen gegen die bewusst ausgewählte Zielumgebung anwenden. Fehlerdetails,
Stacktraces und Datenbank-URLs werden nicht an die UI weitergegeben.

## RLS- und Zugriff-Baseline

Die `0002`-Migration ist die erste konkrete RLS-Baseline. Sie schützt direkte
Supabase-`authenticated` Zugriffe konservativ, ersetzt aber nicht die
serverseitigen Prüfungen in Bubblophy.

Aktuelle Richtung:

- Menschen melden sich über Supabase Auth an.
- Projektzugriff für Menschen basiert auf `bubblophy_project_members` und
  `auth.uid()`.
- Server Actions und server-only Loader verwenden `DATABASE_URL`, prüfen die
  menschliche Session und geben keine Client-`authUserId`-Eingaben weiter.
- Agenten verwenden später Bubblophy-Agent-Tokens mit Hash, Scopes,
  Projektgrenze, Status und Ablaufdatum. Sie bekommen keine Mensch-Session und
  keinen Supabase-Service-Role-Key.
- Agent-Runs werden nicht automatisch durch Issue- oder Projekt-Erstellung
  gestartet; menschliche Freigabe bleibt explizit.

Offene Phase-2-Punkte:

- Sichere View oder RPC für öffentliche Agent-Token-Summaries, falls Browser
  sie direkt über Supabase lesen soll. Die Basistabelle bleibt wegen
  `token_hash` geschlossen.
- Direkte Browser-Write-Policies nur dann ergänzen, wenn sie dieselben Grenzen
  wie die bestehenden Server Actions ausdrücken können.
- Agent-Token-API-Policies getrennt von Mensch-Sessions entwerfen. Agenten
  bekommen keine Supabase-Mensch-Session und keinen Service-Role-Key.
- Entscheiden, ob Server-internes `DATABASE_URL` langfristig als privileged
  Backend-Pfad zusätzlich zu RLS verwendet wird oder ob alle App-Zugriffe strict
  durch RLS laufen sollen.
