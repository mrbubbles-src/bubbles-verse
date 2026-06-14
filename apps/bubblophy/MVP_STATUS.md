# Bubblophy MVP Status

Stand: 2026-06-14

Bubblophy ist als MVP feature-fertig. Die App ist im Bubblesverse-Monorepo als
eigene Next.js-App umgesetzt und dient als human-in-the-loop Issue- und
Agent-Orchestrierungsoberfläche für mehrere Projekte.

## MVP fertig

- Bubblophy nutzt die gemeinsame Bubblesverse-Sidebar statt einer eigenen
  Sidebar-Implementierung.
- Projekte und Issues sind klickbar, Auswahlzustand und Deep-Link-Parameter
  werden sinnvoll wiederhergestellt.
- Issue-Drafts und Planungsflow sind echt nutzbar: lokale Drafts sind klar
  markiert, persistierte Issues und Planversionen überleben Reloads.
- Projekt-CRUD für den MVP ist vorhanden: Projekte erstellen, bearbeiten,
  archivieren und wiederherstellen.
- Issue-CRUD für den MVP ist vorhanden: Issues erstellen, bearbeiten,
  Status wechseln, priorisieren und zuweisen.
- Projektmitglieder können mit Rollen verwaltet werden; Owner-Schutz und
  konservative Sperren verhindern riskante Self-/Owner-Entfernungen.
- Agent-Tokens sind projektgebunden, gehasht gespeichert und haben Status,
  Ablaufdatum, Scopes und einmalige Secret-Anzeige.
- Agent-Runs bleiben human-in-the-loop: Menschen können Runs anfragen,
  freigeben oder abbrechen; es gibt keine Fake-Autostarts.
- Agent-Endpoints sind eng begrenzt: lokale Agenten können Kontext lesen und
  Status/Message/Result melden, aber keinen Code ausführen und keine Issues
  eigenständig schreiben.
- Supabase Auth, DB-basierter Zugang, Projektmitgliedschaften, RLS-Baseline,
  Agent-Token-Guards und serverseitige Actions sind umgesetzt.
- Auth/No-UI-Flash ist stabil: geschützte Seiten werden vor dem App-Render
  server-/proxyseitig gegated.
- Empty-, Error- und Pending-States sind bewusst formuliert und vermeiden
  stille Demo-/Sample-Fallbacks für operative Daten.
- Die App wurde im Codex-In-App-Browser responsive geprüft:
  - Mobile `390x844`
  - Tablet `768x1024`
  - Laptop `1366x768`
  - Desktop `1440x900`
- In den geprüften Viewports gab es keinen horizontalen Body-Overflow, keine
  offscreen Elemente, keine Login-Zwischenstation und keine Browser-Error-Logs.
- Der mobile Sidebar-Toggle wurde separat geprüft; nach dem Öffnen sind
  `Übersicht`, `Projekte`, `Issues`, `Agent-Tokens`, `Runs` und `Audit`
  sichtbar.
- Die Abschlusschecks waren grün: `bun run test:run`, `bun run lint`,
  `bun run typecheck` und `git diff --check`.

## Noch sinnvoll / nächste Ausbaustufen

- Visuelle Regressionen dauerhaft automatisieren, z. B. über einen späteren
  Browser-Check oder Screenshot-Flow, sobald dafür ein stabiler Projektpfad
  feststeht.
- Suche, Filter und Sortierung für viele Projekte, Issues, Runs und Audit-
  Events ausbauen.
- Benachrichtigungen für Review-Zustände, fehlgeschlagene Runs und offene
  Freigaben ergänzen.
- Agent-Handoff weiter verfeinern, inklusive besserer Copy-/Command-UX und
  eindeutiger Laufzeit-Hinweise für externe Agenten.
- Rollen- und Einladungsmodell ausbauen, damit Mitglieder komfortabler über
  Profile oder E-Mail statt technischer Auth-User-IDs verwaltet werden können.
- Deployment-Härtung vorbereiten: Domain-Konfiguration, Supabase Redirects,
  Runtime-Umgebungen, Monitoring und Backup-/Restore-Strategie.
- RLS-Policies und Security-Verträge vor Remote-/Produktionsnutzung nochmal
  gesondert reviewen.
- Optional weitere Agent-Endpoints erst nach separatem Sicherheitsdesign
  ergänzen, z. B. für planbare, eng gescopte Schreiboperationen.
- Produktpolitur für größere Teams: Aktivitätsfilter, Kommentar-Threads,
  bessere Audit-Diffs und rollenbasierte Ansichten.

## Nicht Teil des MVP

- Kein vollautomatischer Autopilot.
- Kein dauerhafter Cloud-Agent-Runner.
- Keine Mensch-Logins für Agenten.
- Kein Supabase-Service-Role-Key im Client oder in Agent-Handoffs.
- Keine freien Agent-Schreibrechte ohne menschliche Freigabe.
