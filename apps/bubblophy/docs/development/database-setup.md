# Bubblophy Database Setup

Diese Notiz beschreibt den reviewbaren Datenbank-Stand für Bubblophy. Sie ist
als reproduzierbarer Migrationspfad im Repo gedacht: SQL wird lokal reviewt,
committed und erst danach bewusst gegen eine ausgewählte Ziel-Datenbank
angewendet.

## Monorepo-Konvention

- Bubblophy nutzt wie `apps/dashboard` und `apps/the-coding-vault` Drizzle Kit
  mit `drizzle.config.ts`, `schema: './drizzle/db/schema.ts'` und
  `out: './drizzle'`.
- Migrationen liegen als SQL-Dateien direkt unter `apps/*/drizzle/`; Drizzle
  Meta-Snapshots liegen unter `apps/*/drizzle/meta/`.
- Schema-Änderungen werden lokal mit `bunx drizzle-kit generate` erzeugt und
  als Review-Artefakt committed. Anwenden passiert separat und bewusst mit der
  passenden Datenbank-URL.
- Handgeschriebene SQL-Schritte wie RLS-Policies werden als Drizzle-Custom-
  Migration erzeugt, damit sie im Journal stehen und von `drizzle-kit migrate`
  beziehungsweise `d-mig-bun` mit ausgeführt werden.

## Vorbereitete Migration

Die Struktur, RLS-Härtung, OAuth-Audit-Attribution und Einladungsbasis liegen
aktuell in elf lokalen Migrationen:

```text
apps/bubblophy/drizzle/0000_premium_psynapse.sql
apps/bubblophy/drizzle/0001_chilly_hiroim.sql
apps/bubblophy/drizzle/0002_bubblophy_rls_baseline.sql
apps/bubblophy/drizzle/0003_close_sensitive_direct_reads.sql
apps/bubblophy/drizzle/0004_close_oauth_direct_reads.sql
apps/bubblophy/drizzle/0005_add_oauth_audit_attribution.sql
apps/bubblophy/drizzle/0006_add_project_invitations.sql
apps/bubblophy/drizzle/0007_add_bubblophy_user_profiles.sql
apps/bubblophy/drizzle/0008_add_run_page_cursor_index.sql
apps/bubblophy/drizzle/0009_normal_monster_badoon.sql
apps/bubblophy/drizzle/0010_giant_cannonball.sql
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

Prüfung der vorbereiteten Migrationen:

- Keine `DROP TABLE`-, `DELETE`-, `TRUNCATE`- oder destruktiven
  `ALTER TABLE ... DROP`-Statements. `0009` ersetzt ausschließlich zwei
  bestehende Cursor-Indizes durch ihre um `id` erweiterten Varianten.
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

Diese RLS-Baseline ist additiv und lokal reviewbar. Sie liegt nicht als lose
SQL-Datei neben dem Drizzle-Flow, sondern als journalisierte Custom-Migration
vor.

`0003_close_sensitive_direct_reads.sql` entzieht Browser-Sessions zusätzlich
direkte Reads auf rohe Agent-Run-Ergebnisse und Issue-Events.

`0004_close_oauth_direct_reads.sql` trennt normale menschliche Sessions von
Supabase-OAuth-Clients. Jede Bubblophy-Tabelle erhält eine restrictive
`FOR ALL`-Policy mit `USING` und `WITH CHECK`, die nur JWTs ohne `client_id`
zulässt. Ein OAuth-Client kann damit weder bestehende permissive
Membership-Policies noch spätere direkte Write-Policies über PostgREST nutzen.
Sein Datenzugriff bleibt auf Bubblophys serverseitig registrierte MCP-Werkzeuge
begrenzt.

`0005_add_oauth_audit_attribution.sql` ergänzt nullable
`created_by_oauth_client_id` an Planversionen sowie `actor_oauth_client_id` an
Issue- und Projekt-Events. Dadurch können persönliche MCP-Schreibvorgänge neben
der menschlichen Auth-User-ID den verwendeten OAuth-Client festhalten, während
bestehende UI- und Agent-Schreibpfade kompatibel bleiben.

`0006_add_project_invitations.sql` ergänzt den server-only Vorzustand für
Projektmitgliedschaften. Die Tabelle speichert normalisierte E-Mail-Adressen,
Nicht-Owner-Rollen und ausschließlich SHA-256-Token-Hashes. Checks koppeln
Annahme- und Widerrufszeitpunkte an ihre Actor-IDs, schließen widersprüchliche
Terminalzustände aus und erzwingen ein echtes Ablaufdatum. Pro Projekt und
E-Mail darf nur eine nicht angenommene, nicht widerrufene Einladung bestehen.
RLS ist aktiviert; direkte Grants und Policies für `public`, `anon` und
`authenticated` fehlen absichtlich, damit E-Mail und Token-Hash nur über
serverseitige Verträge gelesen werden können.

Die serverseitigen Create-/Reinvite-/Revoke-Verträge sperren zuerst Projekt
und handelnde Mitgliedschaft, danach die betroffene offene Einladung. Nur
Owner und Maintainer dürfen Nicht-Owner-Rollen einladen. Reinvite rotiert
Token-Hash und Sieben-Tage-Ablauf; Reinvite und Revoke vergleichen zusätzlich
`updated_at`; erfolgreiche Übergänge erhöhen diese Version auch bei gleicher
oder rückläufiger Instanzuhr strikt. Dadurch enden parallele Entscheidungen als
Konflikt und erzeugen kein veraltetes Audit-Ereignis. Klartext-Tokens werden
ausschließlich beim erfolgreichen Create oder Reinvite einmalig zurückgegeben.

Der serverseitige Manager-Snapshot verbindet Projekt, aktuelle
Owner-/Maintainer-Mitgliedschaft und Einladungen in einem einzigen
`SELECT`. So kann zwischen Autorisierungsprüfung und Ergebnis kein zweiter
Read auseinanderlaufen. Die Projektion enthält normalisierte E-Mail, Rolle,
Zustandszeitpunkte und `updated_at`, aber weder Token-Hash noch eine der
Einladungs-Actor-IDs. Ein fehlendes Projekt und fehlende Managerrechte werden
beide als `not_found` ausgegeben.

Die Annahme startet über `/invite/<token>`, entfernt das Secret vor jedem
OAuth-Redirect aus der URL und hält es höchstens 30 Minuten in einem
`HttpOnly`-/`SameSite=Lax`-Cookie. Der tokenfreie Annahmepfad akzeptiert eine
echte Supabase-Session auch vor dem ersten Bubblophy-Zugriff, während alle
anderen App- und Server-Action-Pfade weiterhin eine bestehende Mitgliedschaft
verlangen. Die Transaktion sperrt Projekt, vorhandene Mitgliedschaft und
Einladung in dieser Reihenfolge, gleicht die normalisierte verifizierte
Session-E-Mail ab und schreibt Annahme, Mitgliedschaft und E-Mail-/Token-freies
Audit atomar. Ablauf, Widerruf, Archivierung, falsche Identität und verlorene
Compare-and-set-Races erzeugen keine Teilmutation.

`0007_add_bubblophy_user_profiles.sql` ergänzt eine optionale, reine
Anzeigeprojektion pro Supabase-Auth-User. Der geschützte Dashboard-Pfad
synchronisiert normalisierte Session-E-Mail und einen bereinigten Namen aus der
Provider-Identität; Browserdaten bestimmen weder Auth-User-ID noch E-Mail. Der
Sync ist best effort und wird nie zum Dashboard-Zugangsgate.
RLS ist aktiv und direkte Zugriffe für `public`, `anon` und `authenticated`
bleiben vollständig widerrufen. Der serverseitige Mitglieder-Read verbindet
Zielmitgliedschaften, aktuelle Actor-Mitgliedschaft und Profile in einem
Statement. Namen sind projektweit sichtbar, E-Mail-Adressen nur für
Owner/Maintainer und die eigene Person. Die Profilzeile besitzt absichtlich
keinen Membership-Fremdschlüssel und gewährt allein keinen Projektzugriff.

`0008_add_run_page_cursor_index.sql` ergänzt den stabilen RunPage-Index
`(issue_id, updated_at, id)`. `0009_normal_monster_badoon.sql` erweitert die
bestehenden Issue- und Projekt-Event-Indizes jeweils um `id`, damit die
ActivityPage ihren Gleichstand im newest-first Cursor deterministisch auflösen
kann. `0010_giant_cannonball.sql` ergänzt den stabilen MemberPage-Index
`(project_id, created_at, auth_user_id)`.

Die Zielumgebung braucht zusätzlich einen Supabase-Custom-Access-Token-Hook,
der JWTs mit `client_id` die exakte Audience `<NEXT_PUBLIC_APP_URL>/mcp` gibt.
Der Hook ist absichtlich umgebungsspezifische Auth-Infrastruktur und nicht Teil
der portablen Schema-Migrationen. Vollständiges SQL, Grants und Dashboard-
Aktivierung stehen in `mcp-operations.md`.

## Lokal reviewen

Aus dem App-Ordner:

```bash
cd apps/bubblophy
bunx drizzle-kit generate
```

Für handgeschriebene RLS-/Policy-/Function-SQL:

```bash
cd apps/bubblophy
bunx drizzle-kit generate --custom --name bubblophy_rls_baseline
```

Danach wird der SQL-Inhalt in die erzeugte Custom-Migration geschrieben und
reviewt. Weil diese Migration in `drizzle/meta/_journal.json` steht, wird sie
von `bunx drizzle-kit migrate` beziehungsweise `d-mig-bun` angewendet. Ältere
Dashboard-RLS-Dateien zeigen noch das historische manuelle Muster; Bubblophy
nutzt für neue RLS-SQL den journalisierten Custom-Migration-Pfad.

Der von Drizzle erzeugte Snapshot beschreibt weiterhin das TypeScript-Schema.
Custom-RLS-SQL wird dort nicht vollständig als `policies` oder
`isRLSEnabled` modelliert; maßgeblich sind die journalisierte SQL-Datei und der
Migrationstest.

Nur zum Anwenden gegen eine bewusst ausgewählte Datenbank:

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
- Supabase-OAuth-Tokens mit `client_id` sind vom direkten Tabellenzugriff
  ausgeschlossen; ihre Standard-Scopes steuern OIDC-Profildaten, nicht RLS.
- Die OAuth-Audience kommt aus dem pro Umgebung konfigurierten Access-Token-
  Hook und muss bytegenau mit Bubblophys kanonischer `/mcp`-Resource
  übereinstimmen.
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
