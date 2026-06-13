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

Die Initialmigration liegt in:

```text
apps/bubblophy/drizzle/0000_premium_psynapse.sql
```

Sie erzeugt:

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

Prüfung der generierten Migration:

- Keine `DROP`-, `DELETE`-, `TRUNCATE`- oder destruktiven
  `ALTER TABLE ... DROP`-Statements.
- Keine Service-Role-Annahmen.
- Keine RLS-Policies. Das ist Absicht; siehe Phase 2.

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

## Phase 2: RLS und Zugriff

Die Initialmigration stellt nur die Struktur bereit. RLS wird separat
entworfen, damit wir die Policy-Grenzen reviewen können, bevor sie live gehen.

Geplante Richtung:

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

Offene RLS-TODOs:

- Helper-Funktionen im `private` Schema nach Dashboard-Muster entwerfen,
  z. B. für Projektmitgliedschaft und Agent-Token-Projektgrenzen.
- `alter table ... enable row level security` für alle Bubblophy-Tabellen in
  einer separaten Migration aktivieren.
- Policies für Menschen und Agent-Token-Pfade getrennt definieren.
- Audit-Schreibpfade für `bubblophy_issue_events` so begrenzen, dass entweder
  ein menschlicher Actor oder ein gültiges Agent-Token nachvollziehbar ist.
- Entscheiden, ob Server-internes `DATABASE_URL` als privileged Backend-Pfad
  zusätzlich zu RLS verwendet wird oder ob alle App-Zugriffe strict durch RLS
  laufen sollen.
