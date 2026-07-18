# Bubblophy MCP Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eine persönliche, providerneutrale Remote-MCP-Verbindung liefert nach einmaligem Supabase-OAuth-Login alle Bubblophy-Projekte, in denen die authentifizierte Person aktuell Mitglied ist.

**Architecture:** Supabase Auth übernimmt OAuth 2.1, PKCE, dynamische Client-Registrierung sowie Access-/Refresh-Tokens. Bubblophy veröffentlicht Protected-Resource-Metadata, validiert ausschließlich Supabase-OAuth-Tokens mit MCP-Audience und `client_id` und lädt Berechtigungen bei jedem Tool-Aufruf aus `bubblophy_project_members`. Der MCP-Endpunkt bleibt stateless und bietet im ersten Slice nur `list_projects` an.

**Tech Stack:** Next.js 16 Route Handlers, Supabase Auth 2.1, `mcp-handler`, MCP TypeScript SDK, Zod 4, Drizzle/Postgres, Vitest.

## Global Constraints

- Bestehende projektgebundene Agent-Tokens und Agent-API-Routen bleiben unverändert.
- OAuth-Zugriffe erhalten weder Supabase-Service-Role-Key noch Agent-Token-Hashes.
- Die aktuelle Projektmitgliedschaft und Rolle werden bei jedem Tool-Aufruf serverseitig geprüft.
- Supabase unterstützt keine Bubblophy-spezifischen OAuth-Scopes. Werkzeugrechte folgen ausschließlich aktueller DB-Rolle und Bubblophy-Client-Policy.
- OAuth-JWTs mit `client_id` dürfen bestehende Browser-RLS-Policies nicht direkt nutzen; restrictive Policies halten Tabellenzugriff hinter dem MCP-Werkzeugvertrag.
- MCP-Werkzeuge bleiben zunächst read-only; Schreibwerkzeuge sind spätere Slices.
- OAuth-Zustimmung muss Clientname, angeforderte Scopes und Ablehnen/Erlauben zeigen.
- Produktionsbetrieb verlangt HTTPS, asymmetrische Supabase-JWT-Signaturen und eine MCP-spezifische Audience.
- Änderungen folgen den aktuellen Next.js-Dokumenten unter `node_modules/next/dist/docs/`.
- Access- und Refresh-Tokens werden vom jeweiligen MCP-Client gespeichert und automatisch erneuert, nicht von Bubblophy.

---

### Task 0: Sicherheitsgate schließen

**Files:**

- Modify: bestehende Auth-, Run- und RLS-Grenzen
- Test: zugehörige Unit-, Store- und Migrationstests

- [x] **Step 1: Bestehende Autorisierungsfehler schließen**

Relative Redirects gegen Backslashes härten, Viewer-Mutationen verweigern, Agent-Runs an ihr ausführendes Token binden und direkte RLS-Reads roher Run-/Event-Payloads schließen.

- [x] **Step 2: Ausführbaren Token-Vertrag vereinheitlichen**

Run-Anfrage und Run-Freigabe verlangen denselben Token: projektgebunden, aktiv, nicht abgelaufen sowie mit `issues:read` und `runs:update`. Abbruch bleibt unabhängig davon möglich.

- [x] **Step 3: Run-Zustandswechsel atomar machen**

Menschliche und agentische Transitionen schreiben mit Compare-and-set auf ID plus bisherigen Zustand. Ein konkurrierender Zustandswechsel liefert einen Konflikt und erzeugt kein widersprüchliches Audit-Event.

- [x] **Step 4: Vollständige Gates und Review**

Formatierung, Lint, Typecheck, Tests, Build und laufenden Reviewer abschließen. `/mcp` wird erst danach angelegt.

---

### Task 1: MCP-Abhängigkeiten und Route-Handler-Vertrag

**Files:**

- Modify: `apps/bubblophy/package.json`
- Modify: `bun.lock`
- Create: `apps/bubblophy/app/mcp/route.ts`
- Test: `apps/bubblophy/__tests__/app/mcp-route.test.ts`

**Interfaces:**

- Consumes: Web-Standard `Request`/`Response` aus Next.js Route Handlers.
- Produces: `GET`, `POST` und `DELETE` für den stateless Streamable-HTTP-Endpunkt `/mcp`.

- [x] **Step 1: Abhängigkeiten vom Repository-Root installieren**

Run:

```bash
bun add mcp-handler@1.1.0 @modelcontextprotocol/sdk@1.26.0 --filter=bubblophy
```

Expected: `apps/bubblophy/package.json` enthält beide direkten Abhängigkeiten und `bun.lock` ist aktualisiert.

- [x] **Step 2: Failing Route-Test schreiben**

Der Test sendet einen MCP-`initialize`-Request an `POST` und erwartet ohne Bearer-Token `401`, `WWW-Authenticate: Bearer` und einen `resource_metadata`-Verweis auf Bubblophys Well-Known-Route.

- [x] **Step 3: Minimalen stateless Handler anlegen**

`app/mcp/route.ts` erstellt den Handler mit `createMcpHandler`, deaktiviert Legacy-SSE und exportiert `GET`, `POST` sowie `DELETE`. Die Auth-Hülle wird in Task 3 angeschlossen.

- [x] **Step 4: Route-Test ausführen**

Run:

```bash
bun --bun vitest run apps/bubblophy/__tests__/app/mcp-route.test.ts
```

Expected: Der Auth-Vertrag schlägt bis Task 3 gezielt fehl; Transport-Imports und Handler-Erstellung kompilieren.

### Task 2: OAuth-Discovery und MCP-Audience

**Files:**

- Create: `apps/bubblophy/lib/mcp/oauth-metadata.ts`
- Create: `apps/bubblophy/app/.well-known/oauth-protected-resource/route.ts`
- Create: `apps/bubblophy/app/.well-known/oauth-protected-resource/mcp/route.ts`
- Test: `apps/bubblophy/__tests__/lib/mcp/oauth-metadata.test.ts`

**Interfaces:**

- Consumes: `NEXT_PUBLIC_APP_URL` und `NEXT_PUBLIC_SUPABASE_URL`.
- Produces: `getBubblophyMcpResourceUrl(): string`, `getBubblophyOAuthIssuerUrl(): string` und RFC-9728-Metadaten für `/mcp`.

- [x] **Step 1: Failing Metadata-Tests schreiben**

Die Tests erwarten als Resource `${NEXT_PUBLIC_APP_URL}/mcp`, als Authorization Server `${NEXT_PUBLIC_SUPABASE_URL}/auth/v1` und keine geheimen Umgebungswerte in der Antwort.

- [x] **Step 2: URL-Helfer implementieren**

Die Helfer normalisieren nur abschließende Slashes und akzeptieren keine frei eingereichten Request-Hosts. Dadurch können Host-Header die OAuth-Metadaten nicht umbiegen.

- [x] **Step 3: Protected-Resource-Route implementieren**

Die Route verwendet `protectedResourceHandler` aus `mcp-handler` und nennt ausschließlich den konfigurierten Supabase-Issuer. Eine `OPTIONS`-Antwort erlaubt Discovery durch Remote-Clients.

- [x] **Step 4: Tests ausführen**

Run:

```bash
bun --bun vitest run apps/bubblophy/__tests__/lib/mcp/oauth-metadata.test.ts
```

Expected: PASS.

### Task 3: Supabase-OAuth-Tokenvalidierung

**Files:**

- Create: `apps/bubblophy/lib/mcp/auth.ts`
- Modify: `apps/bubblophy/app/mcp/route.ts`
- Test: `apps/bubblophy/__tests__/lib/mcp/auth.test.ts`
- Test: `apps/bubblophy/__tests__/app/mcp-route.test.ts`

**Interfaces:**

- Consumes: `Authorization: Bearer <Supabase OAuth access token>`.
- Produces: `verifyBubblophyMcpToken(request, bearerToken): Promise<AuthInfo | undefined>` mit `extra.authUserId`, `clientId` und validierter MCP-Audience.

- [x] **Step 1: Failing Auth-Tests schreiben**

Abdecken: fehlendes Token, ungültiger JWT, fehlender `client_id`, falsche Audience, fehlendes `sub` und gültiges OAuth-Token. Supabase-Validierung wird im Unit-Test injiziert; echte Secrets kommen in keine Fixture.

- [x] **Step 2: Kleinen Auth-Service implementieren**

Der Service validiert das asymmetrisch signierte JWT lokal über Supabase JWKS und verlangt gültige Signatur, `iss`, `exp`, optionales `nbf`, `sub`, `client_id` und exakt die konfigurierte MCP-Resource als Audience. Claim-Decoding oder ein Remote-User-Lookup allein reichen nicht. Fehler werden als nicht authentifiziert behandelt und nicht mit Tokeninhalt geloggt.

- [x] **Step 3: MCP-Handler mit `withMcpAuth` schützen**

Die Auth-Hülle verweist auf den für `/mcp` abgeleiteten Pfad `/.well-known/oauth-protected-resource/mcp` und liefert für fehlende/ungültige Tokens den standardisierten Discovery-Header.

- [x] **Step 4: Auth- und Route-Tests ausführen**

Run:

```bash
bun --bun vitest run apps/bubblophy/__tests__/lib/mcp/auth.test.ts apps/bubblophy/__tests__/app/mcp-route.test.ts
```

Expected: PASS.

### Task 4: Mitgliedschaftsbasiertes `list_projects`

**Files:**

- Create: `apps/bubblophy/lib/mcp/projects.ts`
- Create: `apps/bubblophy/lib/mcp/projects-database-read.ts`
- Modify: `apps/bubblophy/app/mcp/route.ts`
- Test: `apps/bubblophy/__tests__/lib/mcp/projects.test.ts`
- Test: `apps/bubblophy/__tests__/app/mcp-route.test.ts`

**Interfaces:**

- Consumes: validierte `authUserId` aus `AuthInfo.extra`.
- Produces: `listBubblophyMcpProjects(authUserId, options?)` mit aktiven und archivierten Projekten, jeweils `id`, `key`, `name`, `description`, `role`, `isArchived`.

- [x] **Step 1: Failing Service-Tests schreiben**

Abdecken: leere User-ID, keine Mitgliedschaften, mehrere Rollen, archiviertes Projekt und fehlende Datenbankkonfiguration.

- [x] **Step 2: Membership-Read implementieren**

Die Abfrage startet bei `bubblophy_project_members`, filtert auf exakt `auth_user_id` und joint nur öffentliche Projektfelder. Agent-Token-Tabellen werden nicht gelesen.

- [x] **Step 3: MCP-Tool registrieren**

`list_projects` hat keine Eingabeparameter, ist als read-only annotiert und gibt strukturiertes JSON plus kurze Textzusammenfassung zurück. Die User-ID kommt ausschließlich aus dem validierten Auth-Kontext.

- [x] **Step 4: Tool- und Servicetests ausführen**

Run:

```bash
bun --bun vitest run apps/bubblophy/__tests__/lib/mcp/projects.test.ts apps/bubblophy/__tests__/app/mcp-route.test.ts
```

Expected: PASS.

### Task 5: Persönliche OAuth-Zustimmung

**Files:**

- Create: `apps/bubblophy/app/oauth/consent/page.tsx`
- Create: `apps/bubblophy/app/oauth/consent/consent-form.tsx`
- Create: `apps/bubblophy/app/api/oauth/decision/route.ts`
- Modify: `apps/bubblophy/lib/auth/redirects.ts`
- Test: `apps/bubblophy/__tests__/app/oauth-consent.test.tsx`
- Test: `apps/bubblophy/__tests__/app/oauth-decision-route.test.ts`

**Interfaces:**

- Consumes: Supabase `authorization_id` und bestehende menschliche Cookie-Session.
- Produces: Consent-Seite mit Clientname, Scope-Anzeige, Erlauben/Ablehnen sowie sicherem Redirect zur Client-Callback-URL aus Supabase.

- [x] **Step 1: Failing Consent-Tests schreiben**

Abdecken: fehlende ID, anonymer Login-Redirect mit erhaltener ID, ungültige Anfrage, bereits erteilte Zustimmung, sichtbarer Clientname/Scopes sowie approve/deny.

- [x] **Step 2: Consent-Seite implementieren**

Die Server-Komponente verwendet den vorhandenen Cookie-Supabase-Client, prüft die menschliche Session und lädt Details über `supabase.auth.oauth.getAuthorizationDetails`.

- [x] **Step 3: Decision-Route implementieren**

Die Route akzeptiert ausschließlich same-origin, CSRF-geschützte `POST`-Requests mit `approve` oder `deny`, validiert die ID, ruft die entsprechende Supabase-OAuth-Methode auf und redirectet erst nach Erfolg ausschließlich auf die von Supabase zurückgegebene URL. Restrictive RLS-Policies sperren OAuth-JWTs mit `client_id` zusätzlich vom direkten Data-API-Zugriff aus.

- [x] **Step 4: Consent-Tests ausführen**

Run:

```bash
bun --bun vitest run apps/bubblophy/__tests__/app/oauth-consent.test.tsx apps/bubblophy/__tests__/app/oauth-decision-route.test.ts
```

Expected: PASS.

### Task 6: Konfiguration, Dokumentation und Slice-Gates

**Files:**

- Modify: `apps/bubblophy/README.md`
- Modify: `apps/bubblophy/CHANGELOG.md`
- Modify: `apps/bubblophy/documentation/auth-security-plan.md`
- Modify: `apps/bubblophy/documentation/database-setup.md`
- Modify: `apps/bubblophy/documentation/phase-2-roadmap.md`
- Create: `apps/bubblophy/documentation/mcp-operations.md`
- Modify: `apps/bubblophy/.env.example`

**Interfaces:**

- Consumes: implementierten MCP-/OAuth-Vertrag.
- Produces: genaue lokale, Staging- und Produktionsschritte für Supabase OAuth Server, Authorization Path `/oauth/consent`, dynamische Client-Registrierung, asymmetrische Signaturschlüssel, MCP-Audience-Hook sowie Codex-/Claude-Verbindung.

- [x] **Step 1: Betriebsvertrag dokumentieren**

Keine geheimen Werte oder echten Tokens aufnehmen. Klar trennen zwischen Repository-Code und einmaliger Supabase-Dashboard-Konfiguration.

Vor späteren OAuth-Schreibwerkzeugen wird das Audit-Aktormodell um menschliche `authUserId` plus OAuth-`client_id`/Verbindung erweitert, damit MCP- und manuelle UI-Schreibvorgänge unterscheidbar bleiben.

- [x] **Step 2: Vollständige Checks ausführen**

Run aus `apps/bubblophy`:

```bash
bun run format
bun run lint
bun run typecheck
bun run test:run
bun run build
git diff --check
```

Expected: Alle Befehle exit `0`.

- [x] **Step 3: Laufenden Reviewer beauftragen**

Der Reviewer prüft Diff und betroffene Dateien auf Auth-Bypass, falsche Audience, Projekt-Leaks, Token-Logging, unnötige Komplexität, fehlende Tests und Regressionen bestehender Agent-Token-Routen. P0/P1/P2 werden vor dem Commit behoben oder explizit blockierend dokumentiert.

- [x] **Step 4: Fertigen Slice committen**

Mit Commit-Writer aus dem tatsächlichen staged Diff einen fokussierten Conventional Commit erstellen.

- [ ] **Step 5: Staging-Ende-zu-Ende-Smoke**

Dynamische Client-Registrierung, PKCE, Consent, Tokenrefresh, `list_projects`,
`list_issues` und `get_issue` mit getrennten Projektmitgliedschaften real gegen
Staging prüfen: einmal mit Codex, einmal mit Claude. Erst dieser Smoke schließt
den Slice ab.

### Task 7: Paginiertes read-only `list_issues`

**Files:**

- Create: `apps/bubblophy/lib/mcp/issues.ts`
- Create: `apps/bubblophy/lib/mcp/issues-database-read.ts`
- Create: `apps/bubblophy/__tests__/lib/mcp/issues.test.ts`
- Create: `apps/bubblophy/__tests__/lib/mcp/issues-database-read.test.ts`
- Modify: `apps/bubblophy/lib/mcp/register-tools.ts`
- Modify: `apps/bubblophy/__tests__/app/mcp-route.test.ts`

**Contract:** Eine angefragte Projekt-ID wird in derselben Abfrage an die
aktuelle OAuth-`sub`-Membership gebunden. Pro Aufruf werden höchstens 100
öffentliche Issue-Summaries nach unveränderlicher Issue-Nummer geliefert.
Beschreibung, User-IDs, Pläne, Runs, Tokens und Events bleiben außerhalb des
Werkzeugvertrags; fremde und fehlende Projekte sind nicht unterscheidbar.
Archivierte Mitgliedschaftsprojekte bleiben als markierte historische
read-only Ansicht lesbar.

- [x] **Step 1: Service- und Datenbanktests zuerst schreiben**
- [x] **Step 2: Membership-gejointe Cursor-Abfrage implementieren**
- [x] **Step 3: Read-only MCP-Werkzeug registrieren**
- [x] **Step 4: Reviewer und vollständige Slice-Gates ausführen**
- [x] **Step 5: Fertigen Slice separat committen**

### Task 8: Membership-scoped read-only `get_issue`

**Files:**

- Create: `apps/bubblophy/lib/mcp/issue-detail.ts`
- Create: `apps/bubblophy/lib/mcp/issue-detail-database-read.ts`
- Create: `apps/bubblophy/__tests__/lib/mcp/issue-detail.test.ts`
- Create: `apps/bubblophy/__tests__/lib/mcp/issue-detail-database-read.test.ts`
- Modify: `apps/bubblophy/lib/mcp/register-tools.ts`
- Modify: `apps/bubblophy/__tests__/app/mcp-route.test.ts`

**Contract:** `projectId` plus positive `issueNumber` aus `list_issues` laden
ein Detail in derselben Membership-gejointen Abfrage. Beschreibung und
Zeitstempel sind öffentlich für Mitglieder; interne Issue-/User-IDs, Pläne,
Runs, Tokens und Events bleiben ausgeschlossen. Fehlende und fremde Ressourcen
sind nicht unterscheidbar.

- [x] **Step 1: Service- und Datenbanktests zuerst schreiben**
- [x] **Step 2: Membership-gejointe Detailabfrage implementieren**
- [x] **Step 3: Read-only MCP-Werkzeug registrieren**
- [x] **Step 4: Reviewer und vollständige Slice-Gates ausführen**
- [x] **Step 5: Fertigen Slice separat committen**

### Task 9: Membership-scoped read-only `get_issue_plan`

**Files:**

- Create: `apps/bubblophy/lib/mcp/issue-plan.ts`
- Create: `apps/bubblophy/lib/mcp/issue-plan-database-read.ts`
- Create: `apps/bubblophy/__tests__/lib/mcp/issue-plan.test.ts`
- Create: `apps/bubblophy/__tests__/lib/mcp/issue-plan-database-read.test.ts`
- Modify: `apps/bubblophy/lib/mcp/register-tools.ts`
- Modify: `apps/bubblophy/__tests__/app/mcp-route.test.ts`

**Contract:** `projectId` plus positive `issueNumber` laden die neueste
Planversion in derselben Membership-gejointen Abfrage. Der Vertrag liefert
Zusammenfassung, normalisierte Schritte, Version, Erstellungszeit und den
ausdrücklichen Status `draft` oder `approved`, aber keine internen Issue-, Plan-
oder Actor-IDs. Ein sichtbares Issue ohne Plan liefert erfolgreich `plan: null`;
fehlende und fremde Ressourcen sind nicht unterscheidbar. Archivierte
Mitgliedschaftsprojekte bleiben historische read-only Ansichten.

- [x] **Step 1: Service- und Datenbanktests zuerst schreiben**
- [x] **Step 2: Membership-gejointe Latest-Plan-Abfrage implementieren**
- [x] **Step 3: Read-only MCP-Werkzeug registrieren**
- [x] **Step 4: Reviewer und vollständige Slice-Gates ausführen**
- [x] **Step 5: Fertigen Slice separat committen**

### Task 10: Membership-scoped read-only `get_run`

**Files:**

- Create: `apps/bubblophy/lib/mcp/run-detail.ts`
- Create: `apps/bubblophy/lib/mcp/run-detail-database-read.ts`
- Create: `apps/bubblophy/__tests__/lib/mcp/run-detail.test.ts`
- Create: `apps/bubblophy/__tests__/lib/mcp/run-detail-database-read.test.ts`
- Modify: `apps/bubblophy/lib/mcp/register-tools.ts`
- Modify: `apps/bubblophy/__tests__/app/mcp-route.test.ts`

**Contract:** `projectId` plus `runId` laden einen Run in derselben
Membership-gejointen Abfrage. Projekt, Issue, Run und zugeordnetes Agent-Token
werden miteinander gebunden. Der Vertrag liefert öffentliche Run-ID, State,
Agent-Label und Zeitstempel, aber keine User-, Token- oder Event-IDs. Rohe
Result-JSON bleibt serverintern und wird höchstens als bestehende
Secret-filternde Kurzfassung ausgegeben. Fremde und fehlende Ressourcen sind
nicht unterscheidbar; archivierte Mitgliedschaftsprojekte bleiben historische
read-only Ansichten.

- [x] **Step 1: Service- und Datenbanktests zuerst schreiben**
- [x] **Step 2: Membership-gejointe Run-Abfrage implementieren**
- [x] **Step 3: Read-only MCP-Werkzeug registrieren**
- [x] **Step 4: Reviewer und vollständige Slice-Gates ausführen**
- [x] **Step 5: Fertigen Slice separat committen**

### Task 11: OAuth-Audit-Attribution für Schreibwerkzeuge

**Files:**

- Modify: `apps/bubblophy/drizzle/db/schema.ts`
- Create: `apps/bubblophy/drizzle/0005_add_oauth_audit_attribution.sql`
- Create: `apps/bubblophy/drizzle/meta/0005_snapshot.json`
- Modify: `apps/bubblophy/drizzle/meta/_journal.json`
- Modify: `apps/bubblophy/__tests__/drizzle/schema.test.ts`
- Create: `apps/bubblophy/__tests__/drizzle/oauth-audit-attribution-migration.test.ts`

**Contract:** Planversionen speichern optional `created_by_oauth_client_id`;
Issue- und Projekt-Events optional `actor_oauth_client_id`. Persönliche
MCP-Schreibvorgänge können dadurch menschliche `authUserId` plus OAuth-
`client_id` unterscheiden. Bestehende UI-/Agent-Schreiber bleiben durch
nullable additive Spalten kompatibel; Tokens oder Secrets werden nicht
persistiert.

- [x] **Step 1: Schema- und Migrationstests zuerst schreiben**
- [x] **Step 2: Additive Drizzle-Migration generieren**
- [x] **Step 3: Reviewer und vollständige Slice-Gates ausführen**
- [x] **Step 4: Fertigen Slice separat committen**
