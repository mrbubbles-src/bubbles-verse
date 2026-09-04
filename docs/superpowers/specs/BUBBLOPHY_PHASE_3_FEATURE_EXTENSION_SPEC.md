# Bubblophy Phase 3 – Agentenübergreifende Orchestrierungs- und Wissensschicht

**Dokumenttyp:** Feature-Erweiterungsspezifikation  
**Status:** Produktentwurf als Input für einen späteren Implementierungsplan  
**Adressat:** Lio  
**Nicht Gegenstand:** konkrete Architektur-, Datenbank-, UI- oder Implementierungsentscheidungen

## 1. Zweck dieses Dokuments

Phase 3 soll Bubblophy von einer human-gesteuerten Issue- und Agent-Orchestrierungsoberfläche zu einer gemeinsamen, agenten- und providerübergreifenden Orchestrierungs- und Wissensschicht erweitern.

Der praktische Ausgangspunkt ist der Logging-V2-Workflow: Viele spezialisierte Agenten, mehrere Repositories, lange Chatverläufe, versionierte Spezifikationen, große Traceability-Matrices, wiederholte Reviews und wechselnde Kandidaten erzeugten einen Zustand, den Menschen und Agenten nur mit hohem Aufwand korrekt rekonstruieren konnten. Insbesondere wurden fachliche Arbeitsblöcke, technische Tasks, Agent-Runs, Findings, Evidence, Entscheidungen und Freigaben zeitweise miteinander verwechselt. Ältere Aussagen wurden erneut als aktuell behandelt, Matrixzahlen wirkten wie Produktdefekte, und Menschen mussten Informationen zwischen getrennten Agenten und Chats transportieren.

Bubblophy soll diese Probleme nicht durch mehr freien Agentendialog lösen, sondern durch einen strukturierten, aktuellen und nachvollziehbaren Projektzustand. Unterschiedliche Agenten sollen über denselben fachlichen Vertrag arbeiten und ihre Ergebnisse als kontrollierte Zustandsänderungen hinterlassen.

## 2. Produktthese

Bubblophy wird zur gemeinsamen Wahrheitsschicht zwischen Menschen und Agenten:

> Menschen setzen Ziele, Grenzen und normative Entscheidungen. Agenten planen, untersuchen, implementieren und reviewen innerhalb dieser Grenzen. Bubblophy hält den aktuellen Vertrag, die Herkunft aller Aussagen, den Arbeitszustand und die Übergaben konsistent zusammen.

Das Produkt ersetzt weder menschliche Verantwortung noch Git, GitHub, Codex, Claude, Copilot oder andere Arbeitswerkzeuge. Es stellt den gemeinsamen Kontext bereit, gegen den diese Werkzeuge arbeiten.

## 3. Bestehendes Fundament, das erhalten und wiederverwendet werden muss

Phase 3 baut additiv auf dem vorhandenen Bubblophy-Modell auf:

- **Projekte und Projektmitgliedschaften** bleiben die Zugriffsgrenze. Die aktuelle Mitgliedschaft und Rolle bleiben die maßgebliche Quelle für Projektzugriff.
- **Issues** bleiben die bestehenden verfolgbaren Arbeitseinheiten.
- **Versionierte Issue-Pläne** bleiben erhalten. Ein Agentenvorschlag ist weiterhin ein Draft und nicht automatisch freigegeben.
- **Agent-Runs** bleiben nachvollziehbare Ausführungen mit enger Zustandsmaschine.
- **Audit-Aktivität** bleibt die Grundlage für Attribution und Historie.
- **Projektrollen** `owner`, `maintainer`, `member` und `viewer` bleiben unverändert in ihrer Bedeutung. Phase-3-Arbeitsrollen dürfen diese Berechtigungsrollen nicht umdeuten.
- **Agent-Tokens** bleiben projektgebunden und eng gescopt; persönliche MCP-Clients verwenden weiterhin die vorhandene OAuth- und Membership-Grenze.
- **Human-in-the-loop** bleibt verbindlich: Eine Run-Anfrage startet keinen Agenten, eine Planänderung ist keine Freigabe und ein Agent darf keine Produktentscheidung durch bloße Statusänderung ersetzen.
- **Bestehender MCP** bleibt die Integrationsbasis. Vorhandene Reads und kontrollierte Writes werden wiederverwendet und nur um fachlich notwendige Orchestrierungsfähigkeiten ergänzt.
- **Archivierte Projekte** bleiben historische Read-only-Ansichten und dürfen nicht durch Phase 3 wieder operativ beschreibbar werden.
- **Auditierbarkeit, serverseitige Autorisierung, konfliktgeschützte Writes und Datenminimierung** bleiben Produktinvarianten.

Phase 3 ist damit keine zweite Orchestrierungsanwendung neben Issues, Plänen und Runs. Sie ergänzt über diesen bestehenden Objekten eine fachliche Ebene, die Zusammenhang, Gültigkeit und Autorität ausdrückt.

## 4. Ziele

### 4.1 Gemeinsamer aktueller Projektvertrag

Jeder berechtigte Mensch und Agent soll für ein größeres Vorhaben zuverlässig erkennen können:

- was aktuell erreicht werden soll;
- welche Grenzen und Nicht-Ziele gelten;
- welche Entscheidungen aktuell normativ sind;
- welche älteren Entscheidungen ersetzt wurden;
- welche fachlichen Arbeitsblöcke existieren;
- welcher Block gerade ausführbar, blockiert, in Review oder abgeschlossen ist;
- welche Findings offen sind;
- welche Evidence welche konkrete Aussage auf welchem Kandidaten trägt;
- was ein Agent selbstständig fortsetzen darf;
- wo eine menschliche Entscheidung erforderlich ist;
- wer oder welcher Agent zuletzt woran gearbeitet hat;
- wie ein anderer Mensch oder Provider die Arbeit sicher übernehmen kann.

### 4.2 Agenten- und providerübergreifende Kontinuität

Codex, ChatGPT, Claude, Copilot, Cursor und spätere MCP-fähige Clients sollen denselben veröffentlichten Projektzustand lesen können. Ein Wechsel des Menschen, Rechners, Agenten oder Providers darf nicht voraussetzen, dass lange Chatverläufe vollständig rekonstruiert oder private Memories übertragen werden.

### 4.3 Weniger menschliche Routing-Arbeit

Menschen sollen nicht länger als manuelle Nachrichtenbrücke zwischen Coordinator, Implementierer, Reviewer und anderen Agenten dienen müssen. Sie bleiben Entscheider, aber nicht Transportmedium für bereits strukturiert vorliegende Tatsachen.

### 4.4 Menschlich verständliche Steuerung großer Vorhaben

Atomare Requirements und große Matrices dürfen als Maschinenebene erhalten bleiben. Der normale Projektstatus muss sie jedoch in eine kleine Zahl fachlich verständlicher Arbeitsblöcke und klar benannter Restursachen verdichten.

### 4.5 Kontrollierte Autonomie innerhalb freigegebener Grenzen

Agenten sollen innerhalb eines freigegebenen Arbeitsblocks fortsetzen können, ohne für jeden technischen Task, jede Korrektur oder jeden Re-Review ein neues Nutzer-Go anzufordern. Echte Produkt-, Scope-, Sicherheits- oder Berechtigungsgrenzen bleiben Stop-Gates.

### 4.6 Aktive Kommunikation statt passive Inbox

Bubblophy darf nicht voraussetzen, dass Nutzer die Anwendung dauerhaft geöffnet halten oder regelmäßig nach neuen Blockern durchsuchen. Normale Fortschrittsaktualisierungen laufen parallel zur Arbeit. Ein echtes Stop-Gate wird sowohl strukturiert in Bubblophy dokumentiert als auch aktiv im aktuell verwendeten Chat mitgeteilt.

## 5. Nicht-Ziele

Phase 3 ist ausdrücklich nicht:

- ein vollautomatischer Autopilot oder dauerhafter Cloud-Agent-Runner;
- ein System, in dem Agenten unbeaufsichtigt beliebige Aktionen starten;
- die einzige Kommunikationsfläche zwischen Menschen und Agenten oder zwischen verschiedenen Agenten;
- ein Ersatz für normale Zusammenarbeit, Diskussion, Rückfragen, Brainstorming, Planung, Erklärungen, Reviewgespräche oder spontane technische Untersuchungen in ChatGPT, Codex, Claude Code, Cursor, Copilot und anderen Clients;
- ein freier Agent-zu-Agent-Chatbus;
- ein Ersatz für Git, Branches, Commits, Pull Requests, CI oder Repositoryschutz;
- ein Ersatz für GitHub Issues in jedem kleinen Vorhaben;
- eine allgemeine Wissensdatenbank für sämtliche privaten Chats oder Memories;
- ein Mechanismus, der Chatverläufe ungeprüft zur normativen Wahrheit erklärt;
- eine neue Berechtigungswelt neben Projektmitgliedschaften, Rollen und bestehenden MCP-/Token-Grenzen;
- eine automatische Ableitung von Gesamtbereitschaft aus einzelnen bestandenen Tests oder Runs;
- eine Verpflichtung, jedes kleine Feature mit Workstreams, Matrices oder mehreren Agenten zu bearbeiten;
- eine nachträgliche Umschreibung historischer Aussagen, Findings, Decisions oder Evidence.

## 6. Fachliches Zielmodell

### 6.1 Projekt

Das bestehende Projekt bleibt Sicherheits-, Mitgliedschafts- und Archivierungsgrenze. Ein Projekt kann mehrere größere Vorhaben enthalten.

### 6.2 Feature / Workstream

Ein **Feature** oder **Workstream** bündelt ein größeres fachliches Vorhaben innerhalb eines Projekts, zum Beispiel „Logging V2“. Es ist der Parent für den aktuellen Vertrag, fachliche Work Blocks, Decisions, Findings, Evidence, Decision Requests und Handoffs.

Ein Workstream beschreibt nicht den technischen Ausführungsgraphen. Er hält das fachliche Ziel und den gültigen Gesamtzustand zusammen.

Mindestinhalt auf Produktebene:

- verständliches Ziel;
- Scope und Nicht-Ziele;
- zuständige Menschen;
- Status auf Workstream-Ebene;
- Current Contract Summary;
- offene Stop-Gates und Decision Requests;
- fachliche Work Blocks;
- maßgebliche Provenienzquellen.

### 6.3 Current Contract Summary

Die **Current Contract Summary** ist die kurze, autoritative Projektion dessen, was für einen Workstream jetzt gilt. Sie ist der Standard-Einstieg für Agenten und Menschen, nicht eine weitere konkurrierende Spezifikation.

Sie soll mindestens verständlich machen:

- Produktziel und aktueller Scope;
- aktuell bindende Decisions;
- explizite Nicht-Ziele und verbotene Scope-Ausweitungen;
- freigegebene Work Blocks und ihre Reihenfolge beziehungsweise zulässige Parallelität;
- aktueller Kandidat oder Kandidatenbezug, soweit relevant;
- offene Findings und Decision Requests;
- geltende Stop-Gates;
- welche Arbeit ohne weiteres Go fortgesetzt werden darf;
- aktueller Abschluss- und Readiness-Stand, getrennt nach sinnvollen Ebenen.

Die Summary muss auf die zugrunde liegenden autoritativen Objekte verweisen. Sie darf Historie verdichten, aber keine unbelegte neue Entscheidung erzeugen. Unklarheiten müssen als unklar sichtbar bleiben.

### 6.4 Decision

Eine **Decision** hält eine fachliche oder technische Entscheidung mit normativer Wirkung fest.

Sie benötigt fachlich:

- klare Entscheidungsfrage und Ergebnis;
- Geltungsbereich;
- Entscheider und Zeitpunkt;
- Begründung oder relevante Abwägung;
- Provenienz;
- Beziehung zu betroffenen Work Blocks, Issues, Findings und Verträgen;
- Gültigkeitszustand;
- explizite Supersession-Beziehung, wenn sie eine frühere Decision ersetzt.

Eine neuere Decision ersetzt eine ältere nur explizit. Zeitliche Neuheit allein reicht nicht aus. Superseded Decisions bleiben historisch sichtbar, werden aber nicht mehr als aktueller Vertrag ausgegeben.

### 6.5 Work Block

Ein **Work Block** ist eine fachlich verständliche, zusammenhängende Ergebniseinheit. Er beschreibt den realen Arbeitsgegenstand, nicht die Zahl der Threads, Repositories, Findings oder Matrixzeilen.

Beispiele aus dem Logging-V2-Muster wären „Archiv und Retention“, „sichere Fehlerprojektion“ oder „integrierte Acceptance“. Ein Work Block kann mehrere technische Tasks, Issues, Repositories, Runs und Reviews enthalten.

Ein Work Block soll ausdrücken:

- welches Ergebnis er herstellt oder nachweist;
- welcher Vertrag dafür gilt;
- welche technischen Tasks und Issues ihm zugeordnet sind;
- welche Reihenfolge oder Parallelität erlaubt ist;
- welche Evidence für Abschluss erforderlich ist;
- welche Findings innerhalb des Blocks bearbeitet werden dürfen;
- welche Grenzen ein neues Stop-Gate auslösen;
- seinen fachlichen Status und den Grund dafür.

### 6.6 Technischer Task / Issue

Technische Tasks werden grundsätzlich durch die bestehenden Issues und ihre Pläne repräsentiert. Sie sind konkrete Arbeitseinheiten innerhalb eines Work Blocks, beispielsweise eine Änderung in einem Repository, ein fokussierter Review oder ein Acceptance-Nachweis.

Ein technischer Task ist nicht automatisch ein neuer Work Block. Ein Finding innerhalb eines freigegebenen Blocks darf zu einem Korrekturtask führen, ohne den fachlichen Scope neu zu eröffnen.

### 6.7 Run

Ein **Run** bleibt eine einzelne, attribuierte Agentenausführung zu einem Issue beziehungsweise Task. Er dokumentiert, wer oder welcher Agent auf welchem Auftrag gearbeitet hat, welchen Zustand er erreicht hat und welches Ergebnis zurückkam.

Ein Run ist weder der Plan noch der fachliche Arbeitsblock noch der Beweis für Gesamtabschluss. Mehrere Runs können denselben Task bearbeiten; ein einzelner Run kann scheitern, ohne den Work Block fachlich zu verwerfen.

### 6.8 Finding

Ein **Finding** ist eine prüfbare Feststellung aus Untersuchung, Implementierung, Test, Review oder Betrieb.

Es soll enthalten:

- Aussage und Relevanz;
- Schweregrad beziehungsweise Bedeutung;
- Quelle und Ersteller;
- betroffener Vertrag, Work Block, Task, Run oder Kandidat;
- aktuellen Bearbeitungszustand;
- verantwortliche Rolle oder Person, sofern zugewiesen;
- zugehörige Evidence;
- Ergebnis der Auflösung.

Ein Finding verändert nicht allein den autoritativen Vertrag. Es kann eine Korrektur innerhalb eines freigegebenen Blocks auslösen oder einen Decision Request erzeugen. Historische, nicht mehr reproduzierbare oder widerlegte Findings werden nicht gelöscht, sondern mit ihrer Auflösung nachvollziehbar geschlossen.

### 6.9 Evidence

**Evidence** ist ein nachvollziehbarer Beleg für eine eng formulierte Aussage. Sie darf nicht pauschal als Beweis für mehr verwendet werden, als tatsächlich geprüft wurde.

Evidence soll mindestens binden:

- die belegte Behauptung oder Anforderung;
- Work Block, Issue, Finding oder Decision, auf die sie sich bezieht;
- konkrete Kandidatenidentität, etwa Repository, Branch, Commit oder Artefakt;
- Art des Nachweises, etwa Test, Build, Review, Browserprüfung, Realpfad, Dokument oder menschliche Abnahme;
- Ergebnis und Zeitpunkt;
- Ersteller beziehungsweise ausführenden Run;
- Gültigkeitsgrenzen und bekannte Lücken;
- Provenienz zum ursprünglichen Artefakt.

Ein fokussierter Slice-PASS, ein unabhängiger Review-PASS, Integration, Deployment und Gesamtbereitschaft sind getrennte Aussagen. Bubblophy darf sie nicht automatisch gleichsetzen.

### 6.10 Decision Request

Ein **Decision Request** ist die strukturierte Darstellung eines echten Stop-Gates für einen Menschen. Er ersetzt diffuse Meldungen wie „Ich brauche ein Go“ ohne klare Entscheidungsgrundlage.

Er soll enthalten:

- die konkrete offene Entscheidung;
- warum der bestehende Vertrag keine eindeutige Fortsetzung erlaubt;
- betroffene Scope-, Rollen-, Daten-, Sicherheits- oder Produktgrenzen;
- realistische Optionen;
- Empfehlung des anfragenden Agenten, sofern vorhanden;
- Auswirkungen jeder Option;
- was bis zur Entscheidung sicher weiterlaufen kann und was stoppen muss;
- zugehörige Findings, Decisions, Work Blocks und Evidence.

Eine menschliche Antwort soll den Request entweder in eine aktive Decision überführen, zurückweisen oder als nicht entscheidungsbedürftig einstufen.

### 6.11 Handoff

Ein **Handoff** ist ein absichtlich erzeugter, zeitgebundener Übergabezustand für einen anderen Menschen oder Agenten. Er soll eine Fortsetzung ohne vollständige Chat-Historie ermöglichen.

Er umfasst fachlich:

- aktuellen Contract Summary Snapshot;
- Ziel und Status des Work Blocks;
- aktive Kandidaten und Arbeitsorte;
- bereits erledigte Tasks und Runs;
- offene Findings, Decision Requests und nächste erlaubte Schritte;
- vorhandene Evidence und bekannte Lücken;
- ausdrücklich nicht freigegebene Aktionen;
- erwartete Rolle des Übernehmenden;
- Provenienz und Erstellungszeitpunkt.

Ein Handoff ist ein Snapshot, keine neue Quelle der Wahrheit. Bei späteren Änderungen muss er als veraltet erkennbar sein und auf den aktuellen Workstream-Zustand verweisen.

## 7. Zentrale Invarianten

1. **Ein aktueller Vertrag:** Pro Workstream existiert genau eine als aktuell ausgewiesene Contract Summary. Frühere Snapshots bleiben historische Provenienz.
2. **Explizite Supersession:** Alte Decisions, Pläne und Aussagen werden nur durch eine explizite Beziehung ersetzt, niemals still oder allein aufgrund eines neueren Zeitstempels.
3. **Keine Statusinflation:** Task-, Run-, Review-, Evidence-, Work-Block-, Integrations-, Deployment- und Workstream-Status bleiben getrennt.
4. **Evidence ist claim- und kandidatengebunden:** Ein Nachweis gilt nur für die ausdrücklich belegte Aussage und den identifizierten Kandidaten.
5. **Work Block ist nicht Task:** Fachliche Arbeitsblöcke dürfen nicht aus technischen Threads, Repositorygrenzen oder einzelnen Findings abgeleitet werden.
6. **Run ist nicht Freigabe:** Eine Run-Anfrage, ein gestarteter Run oder ein Run-Ergebnis ersetzt weder Planfreigabe noch Produktentscheidung.
7. **Finding ist nicht automatisch Scope:** Findings werden zuerst gegen den aktuellen Vertrag und Block geprüft. Korrekturarbeit innerhalb eines freigegebenen Blocks benötigt kein künstliches neues Feature.
8. **Menschen entscheiden normative Grenzen:** Agenten dürfen Decisions und Änderungen vorschlagen, aber keine neue Produkt-, Rollen-, Berechtigungs-, Persistenz- oder Sicherheitsgrenze selbst autorisieren.
9. **Zugriff bleibt membership-basiert:** Jeder Read und Write bleibt an aktuelle Projektmitgliedschaft, Rolle, Projektzustand und den engen Werkzeugvertrag gebunden.
10. **Attribution bleibt vollständig:** Relevante Zustandsänderungen unterscheiden Mensch, OAuth-Client, Agent-/Providerkontext und Run, ohne Tokens oder Secrets offenzulegen.
11. **Providerneutralität:** Fachliche Semantik darf nicht von einem bestimmten Agenten, Modell, Betriebssystem oder Chatformat abhängen.
12. **Konflikte sind sichtbar:** Parallele Änderungen dürfen nicht per Last-write-wins normative Zustände überschreiben. Veraltete Reads führen zu einem erkennbaren Konflikt.
13. **Unwissen bleibt sichtbar:** Fehlende oder widersprüchliche Information darf nicht durch generische Platzhalter oder Agentenannahmen zur scheinbaren Wahrheit werden.
14. **Historie bleibt append-only nachvollziehbar:** Korrekturen ergänzen oder superseden frühere Zustände; sie löschen nicht die Entstehungsgeschichte.
15. **Archiv bleibt read-only:** Historische Workstreams und ihre Orchestrierungsobjekte dürfen über archivierte Projekte nicht wieder operativ aktiviert werden.

## 8. Rollenmodell

### 8.1 Bestehende Berechtigungsrollen

Die Projektrollen `owner`, `maintainer`, `member` und `viewer` bleiben allein für Zugriffs- und Mutationsrechte maßgeblich. Phase-3-Rollen dürfen keine versteckte Rechteausweitung erzeugen.

### 8.2 Arbeitsrollen innerhalb eines Workstreams

Arbeitsrollen beschreiben Verantwortung, nicht Autorisierung:

- **Human Product Owner / Entscheider:** setzt Produktziel, Scope, Nicht-Ziele und normative Decisions; beantwortet echte Decision Requests.
- **Coordinator:** hält den aktuellen Projektzustand konsistent, ordnet Tasks und Runs den Work Blocks zu, erkennt Abhängigkeiten, verdichtet Status und eskaliert nur echte Stop-Gates.
- **Planner:** schlägt Work Blocks, technische Tasks, Reihenfolge und benötigte Evidence vor.
- **Implementer:** bearbeitet freigegebene technische Tasks innerhalb des aktuellen Vertrags.
- **Reviewer:** prüft einen identifizierten Kandidaten unabhängig und erzeugt Findings und Evidence, aber keine stillen Produktentscheidungen.
- **Evidence-/Acceptance-Verantwortlicher:** ordnet Nachweise den konkreten Claims und Kandidaten zu und trennt technische PASS-Aussagen von Gesamtbereitschaft.
- **Integrator:** verantwortet die bewusst getrennte Zusammenführung freigegebener Kandidaten und hält Integrationsnachweise von Slice- oder Review-PASS getrennt.
- **Observer / Read-only Reviewer:** liest aktuellen Vertrag und Zustand und gibt eine Einschätzung ab, ohne den operativen Zustand zu verändern.

Eine Person oder ein Agent kann mehrere Arbeitsrollen nacheinander wahrnehmen. Bubblophy muss die Rolle je Beitrag oder Run erkennbar machen, ohne daraus Projektberechtigungen abzuleiten.

### 8.3 Coordinator-Vertrag

Der Coordinator darf:

- innerhalb freigegebener Work Blocks technische Tasks anlegen oder vorschlagen;
- unabhängige Tasks parallel und abhängige Tasks in freigegebener Reihenfolge koordinieren;
- Findings demselben Block zuordnen und fokussierte Correctives/Re-Reviews veranlassen;
- vorhandene kandidatengültige Evidence wiederverwenden;
- Current Contract Summary und Handoff als abgeleitete Projektionen aktualisieren;
- Widersprüche markieren und Reconciliation anfordern.

Der Coordinator darf nicht:

- ältere Decisions still reaktivieren;
- Matrixzeilen automatisch als eigenständige Defekte oder Tasks behandeln;
- einen technischen Task zur neuen Produktentscheidung erklären;
- aus einem Run-PASS Gesamtbereitschaft ableiten;
- neue Berechtigungs-, Sicherheits-, Persistenz- oder Produktgrenzen genehmigen;
- selbst Implementierer sein, wenn dadurch die erforderliche Unabhängigkeit eines Reviews aufgehoben würde, ohne dies sichtbar zu machen.

## 9. Stop-Gates und Fortsetzungsregeln

### 9.1 Echte Stop-Gates

Ein menschlicher Decision Request ist erforderlich, wenn mindestens eine der folgenden Grenzen materiell betroffen ist:

- neue oder geänderte Produktentscheidung;
- neue oder geänderte Rollen-, Berechtigungs- oder Zugriffspolitik;
- neue oder geänderte externe API-, Response-, Daten- oder Persistenzgrenze;
- notwendige Arbeit außerhalb des freigegebenen Workstream-/Work-Block-Scope;
- materielles neues Sicherheits-, Datenschutz- oder Datenintegritätsrisiko;
- unauflösbarer Widerspruch zwischen aktuell autoritativen Quellen;
- destruktive oder schwer rückgängig zu machende Aktion außerhalb einer bestehenden Freigabe;
- Wechsel auf einen nicht freigegebenen Kandidaten oder Verlust der Kandidatenidentität;
- fehlende menschliche Freigabe für einen weiterhin freigabepflichtigen Run oder Plan;
- Entscheidung zwischen fachlich unterschiedlichen, jeweils plausiblen Ergebnissen.

### 9.2 Kein neues Go erforderlich

Kein neues Stop-Gate entsteht allein durch:

- einen neuen technischen Task innerhalb eines freigegebenen Work Blocks;
- ein Finding, dessen Korrektur denselben Vertrag und Scope erhält;
- einen fokussierten Re-Review nach einer solchen Korrektur;
- die Wiederholung eines fehlgeschlagenen technischen Runs ohne Vertragsänderung;
- notwendige Tests, Typen, Fixtures oder eng gekoppelte Fehlerbehandlung;
- die sequenzielle Fortsetzung bereits freigegebener abhängiger Tasks;
- hohe Zahlen von `partial`- oder `missing`-Matrixzeilen ohne nachgewiesene neue Produktlücke;
- Evidence- oder Governance-Arbeit, die keine Runtimeänderung verlangt;
- eine reine Reconciliation widersprüchlicher historischer Aussagen.

### 9.3 Teilweises Weiterarbeiten

Ein Stop-Gate soll nur den tatsächlich betroffenen Pfad blockieren. Unabhängige Work Blocks und sichere read-only Arbeit dürfen weiterlaufen, sofern die Decision Request dies ausdrücklich ausweist.

### 9.4 Kommunikationspflicht bei Stop-Gates

Das Anlegen eines Finding-, Status- oder Evidence-Eintrags ist kein eigener Stoppgrund. Wenn der Agent innerhalb des freigegebenen Vertrags weiterarbeiten kann, aktualisiert er Bubblophy parallel und setzt die Arbeit ohne unnötige Nutzerinteraktion fort.

Entsteht dagegen ein echtes Stop-Gate oder ein menschlicher Decision Request, muss der Agent beides tun:

1. den Blocker und die Decision Request strukturiert in Bubblophy festhalten;
2. den Nutzer aktiv im aktuell verwendeten Chat darauf aufmerksam machen.

Eine Decision Request darf nicht ausschließlich in Bubblophy abgelegt werden in der Erwartung, dass der Nutzer sie dort irgendwann entdeckt. Die Chatnachricht soll kurz und verständlich erklären:

- was passiert ist;
- warum eine menschliche Entscheidung nötig ist;
- welche realistischen Optionen bestehen;
- welche Option der Agent empfiehlt und warum;
- welcher Teil der Arbeit blockiert ist;
- welcher unabhängige Teil bis zur Entscheidung weiterlaufen kann.

Die im Chat getroffene Antwort wird anschließend als Decision beziehungsweise nachvollziehbare Statusänderung in Bubblophy festgehalten. Die strukturierte Decision Request bleibt die gemeinsame agentenübergreifende Zustandsquelle; sie ersetzt nicht die direkte Eskalation.

## 10. Menschliche Aggregationsebene für große Matrices

Große Requirement- oder Traceability-Matrices bleiben eine optionale Maschinenebene. Sobald sie verwendet werden, ist eine menschliche Aggregation verpflichtend.

Die Standardansicht soll zuerst zeigen:

- eine überschaubare Zahl fachlicher Work Blocks;
- pro Block den aktuellen Ergebniszustand;
- die reale Restursache, zum Beispiel Runtime, Acceptance, Evidence, Governance oder Review;
- bekannte konkrete Produktlücken;
- offene Decision Requests;
- benötigte nächste Aktion;
- Anzahl zugeordneter Matrixzeilen nur als nachgeordnete Detailinformation.

Beispielhafte menschenlesbare Aussage:

> 1.002 offene Matrixzeilen entsprechen aktuell 0 bestätigten Runtime-Lücken, 8 Evidence-/Acceptance-Gruppen, 1 Governance-Gruppe und 1 finalen Traceability-/Freeze-Block.

Die Oberfläche darf `partial`, `missing` oder Gesamtzahlen nicht ohne diese fachliche Verdichtung als primären Status präsentieren.

Matrixzeilen müssen auf Work Blocks, Claims und Evidence zurückführbar bleiben. Eine Änderung des Matrixstatus darf keine implizite Decision oder neue Runtimeanforderung erzeugen.

## 11. Nutzer- und Agentenflüsse

### 11.1 Großes Vorhaben anlegen

1. Ein berechtigter Mensch legt einen Workstream auf Basis eines bestehenden Projekts an.
2. Ziel, Scope, Nicht-Ziele, Entscheider und anfängliche Quellen werden festgehalten.
3. Ein Planner oder Coordinator schlägt fachliche Work Blocks und ihre Abhängigkeiten vor.
4. Der Mensch bestätigt die normative Ausgangsbasis und freigegebenen Grenzen.
5. Bubblophy veröffentlicht daraus die erste Current Contract Summary.

### 11.2 Von Work Blocks zu Tasks und Runs

1. Ein freigegebener Work Block wird in bestehende Issues und versionierte Pläne konkretisiert.
2. Tasks werden einem Block zugeordnet; ihre Repository- oder Providergrenze ändert die fachliche Blockstruktur nicht automatisch.
3. Ein Run wird wie bisher angefragt und separat menschlich freigegeben.
4. Der Agent liest den aktuellen Contract, den Work Block, das Issue, den Plan, offene Findings und relevante Evidence.
5. Das Run-Ergebnis aktualisiert den Run und kann Findings oder Evidence erzeugen, aber keine stillen Decisions.

### 11.3 Finding innerhalb eines freigegebenen Blocks

1. Reviewer oder Implementer erfasst das Finding mit Kandidaten- und Vertragsbezug.
2. Der Coordinator prüft, ob die Korrektur innerhalb des aktiven Blocks und der bestehenden Decision liegt.
3. Wenn ja, wird ein technischer Corrective-Task demselben Block zugeordnet.
4. Nach Korrektur folgt der erforderliche fokussierte Re-Review.
5. Finding und Evidence werden verknüpft; der Work Block kann fortgesetzt werden.

### 11.4 Echte Produktentscheidung

1. Ein Agent erkennt eine materielle Vertragslücke oder mehrere fachlich unterschiedliche Optionen.
2. Er erzeugt einen Decision Request statt eines unspezifischen Blocked-Status.
3. Er eskaliert die Entscheidung zusätzlich aktiv im aktuellen Chat und erklärt Frage, Optionen, Empfehlung, Folgen sowie den blockierten und den weiterhin ausführbaren Pfad.
4. Bubblophy hält dieselben strukturierten Entscheidungsinformationen als gemeinsamen Zustand bereit.
5. Der berechtigte Mensch entscheidet im normalen Chat oder über eine dafür vorgesehene menschliche Bubblophy-Aktion.
6. Die Antwort wird als Decision attribuiert; betroffene ältere Decisions werden bei Bedarf explizit superseded.
7. Current Contract Summary und abhängige Work Blocks werden konsistent neu projiziert.

### 11.5 Reconciliation widersprüchlicher Aussagen

1. Bubblophy oder ein Agent erkennt zwei nicht vereinbare Aussagen, zum Beispiel „neun Runtime-Lücken“ und später „null Implementierungsblöcke“.
2. Beide Aussagen bleiben mit Provenienz erhalten und werden als widersprüchlich markiert.
3. Ein read-only Reconciliation-Task prüft autoritative Spec, aktuellen Kandidaten und neueste Evidence.
4. Das Ergebnis schließt oder bestätigt Findings und superseded gegebenenfalls die ältere Einordnung.
5. Keine Runtimearbeit beginnt allein wegen der älteren Aussage.

### 11.6 Übergabe an anderen Menschen oder Provider

1. Der bisherige Bearbeiter erzeugt einen Handoff für einen bestimmten Work Block oder den gesamten Workstream.
2. Bubblophy prüft, ob der Handoff den aktuellen Vertrag, Kandidaten, offenen Zustand und erlaubte nächste Schritte enthält.
3. Der neue Agent liest zunächst Current Contract Summary und Handoff, danach nur die dafür relevanten Details.
4. Er bestätigt den übernommenen Kandidaten und seine Arbeitsrolle.
5. Seine Beiträge werden unter eigener menschlicher, OAuth-Client-, Provider- und Run-Provenienz fortgeführt.

### 11.7 Frühes read-only Produktreview durch ChatGPT

1. Der Mensch verbindet einen persönlichen, membership-gebundenen MCP-Client.
2. Der Agent liest Current Contract Summary, Decisions, Work Blocks, offene Findings, Decision Requests und Evidence.
3. Er beurteilt beispielsweise Scope Drift, widersprüchliche Decisions, fehlende Evidence oder unnötiges Micro-Slicing.
4. Eine anfängliche ChatGPT-Anbindung darf als client-spezifisches Rolloutinkrement read-only bleiben. Der Mensch überträgt bestätigte Empfehlungen in den kontrollierten Workflow.
5. Diese Rolloutentscheidung begrenzt weder das Phase-3-Domainmodell noch den MCP insgesamt auf read-only.
6. Codex, Claude Code und andere geeignete Clients dürfen weiterhin die jeweils für sie freigegebenen, eng gescopten Phase-3-Schreiboperationen verwenden.

## 12. Multi-Agent- und Multi-Provider-Koordination

### 12.1 Chat als Arbeitsraum, Bubblophy als gemeinsame Zustandsschicht

Bubblophy ersetzt nicht die normale Chat-Kommunikation. Menschen und Agenten arbeiten weiterhin in ChatGPT, Codex, Claude Code, Cursor, Copilot oder anderen Clients zusammen. Dort dürfen sie diskutieren, Rückfragen stellen, brainstormen, planen, erklären, Reviews besprechen und technische Hypothesen untersuchen. Auch lange oder komplexe Gespräche bleiben zulässig und sinnvoll.

Der verbindliche Grundsatz lautet:

> Im Chat wird gearbeitet und diskutiert.  
> In Bubblophy wird festgehalten, was daraus für den gemeinsamen Projektzustand relevant und dauerhaft geworden ist.

Nicht jede Chatnachricht, Überlegung oder Zwischenhypothese gehört in Bubblophy. Strukturiert festgehalten werden insbesondere:

- aktuell bindende Decisions und ihre explizite Supersession;
- fachliche Work Blocks und freigegebene Pläne;
- relevante Findings und Evidence;
- echte Decision Requests und Stop-Gates;
- aktueller Arbeitsstatus und Kandidatenbezug;
- Handoffs und die Current Contract Summary.

Damit soll Bubblophy Kontextverlust zwischen Chats, Menschen und Agents verhindern, nicht die Chats selbst ersetzen. Ein Agent darf weiterhin normal mit seinem Menschen kommunizieren. Erst das für andere Beteiligte oder die spätere Fortsetzung relevante Ergebnis wird strukturiert in Bubblophy überführt.

Das Zielbild ist:

```text
Mensch ↔ Agent im normalen Chat
                 │
                 │ relevante strukturierte Ergebnisse
                 ▼
             Bubblophy
                 ▲
                 │ gemeinsamer aktueller Zustand
                 │
andere Menschen / Codex / Claude / ChatGPT / Copilot / weitere Agents
```

Ein Agentenwechsel soll deshalb nicht bedeuten: „Lies diesen 800-Nachrichten-Chat.“ Der normale Einstieg lautet: „Lies den aktuellen Bubblophy-Workstream und den Handoff; frage im Chat nach, wenn du darüber hinaus Kontext brauchst.“

### 12.2 Keine passive Nutzer-Inbox

Bubblophy ist keine passive Inbox, die der Nutzer ständig selbst überwachen muss. Das Aktualisieren des gemeinsamen Zustands ersetzt nicht die aktive Kommunikation im verwendeten Chat.

Für Agenten gilt:

- Normaler Fortschritt wird in Bubblophy aktualisiert und läuft innerhalb der Freigabe ohne neues Nutzer-Go weiter.
- Ein Agent stoppt nicht allein deshalb, weil er ein Finding, einen Status oder Evidence eingetragen hat.
- Ein echter Blocker wird in Bubblophy dokumentiert und zusätzlich aktiv im aktuellen Chat eskaliert.
- Ein Agent wartet nur auf Nutzerinteraktion, wenn die Arbeit tatsächlich eine menschliche Entscheidung oder Freigabe benötigt.
- Währenddessen setzt er alle ausdrücklich unabhängigen und sicheren Pfade fort.
- Eine im Chat getroffene bindende Entscheidung wird anschließend in Bubblophy als Decision oder Statusänderung nachvollziehbar gemacht.

Kurzform:

> Chat = aktive Kommunikation und Zusammenarbeit.  
> Bubblophy = strukturierter gemeinsamer Projektzustand und dauerhafte Übergabe.

### 12.3 Koordination über relevante strukturierte Ergebnisse

Für projektweit relevante und dauerhafte Ergebnisse koordinieren sich Agenten über strukturierte Zustandsänderungen:

1. Ein Implementer liefert einen Run und Evidence.
2. Ein Reviewer erfasst ein Finding.
3. Der Coordinator ordnet Finding und Corrective demselben Work Block zu.
4. Ein Mensch beantwortet bei Bedarf einen Decision Request.
5. Der nächste Agent liest den aktualisierten aktuellen Zustand.

Direkte Chat-Kommunikation zwischen Menschen und Agenten sowie – soweit ein Client sie unterstützt – zwischen Agenten darf parallel bestehen. Sie ist Arbeits- und Diskussionskontext. Ihr Ergebnis wird für den gemeinsamen Projektzustand erst dann autoritativ oder dauerhaft relevant, wenn es im passenden Bubblophy-Objekt festgehalten und erforderlichenfalls menschlich freigegeben wurde.

### 12.4 Providerneutrale Identität und Provenienz

Für jeden Agentenbeitrag muss erkennbar sein:

- in wessen menschlichem Projektzugriff er erfolgte;
- welcher OAuth-Client oder welches Agent-Token verwendet wurde;
- welcher Provider beziehungsweise Client beteiligt war, soweit verfügbar;
- zu welchem Run, Task, Work Block und Kandidaten der Beitrag gehört;
- welche Arbeitsrolle eingenommen wurde.

Provider- oder Modellnamen dürfen informativ sein, aber keine Berechtigung begründen und nicht Bestandteil des fachlichen Vertrags sein.

### 12.5 Gleichzeitige Arbeit

Bubblophy soll sichtbar machen, welche Tasks aktiv bearbeitet werden und wo Abhängigkeiten oder Konflikte bestehen. Parallele Arbeit ist nur dort sinnvoll, wo Work Blocks oder Tasks unabhängig sind. Das Produkt muss veraltete Zustandsänderungen konfliktgeschützt ablehnen und darf konkurrierende Coordinatoren nicht still denselben normativen Zustand überschreiben lassen.

Die konkrete technische Form von Claims, Leases oder Reservations ist Teil eines späteren Implementierungsplans, nicht dieser Spezifikation.

## 13. Provenienz und Supersession

### 13.1 Provenienzpflicht

Jede Decision, jedes Finding, jede Evidence, jeder Decision Request, jeder Handoff und jede wesentliche Contract-Summary-Änderung benötigt eine nachvollziehbare Herkunft:

- Mensch oder Agent;
- Arbeitsrolle;
- Zeitpunkt;
- Client-/Run-Bezug;
- referenzierte Quelle oder Artefakt;
- Kandidatenbezug, wenn relevant.

### 13.2 Autorität ist nicht nur Zeit

„Neueste Nachricht“ und „neueste Datei“ sind keine ausreichenden Autoritätsregeln. Bubblophy muss zwischen chronologischer Neuheit, expliziter Gültigkeit, Freigabe und Supersession unterscheiden.

### 13.3 Historische Integrität

Superseded oder widerlegte Inhalte bleiben auffindbar. Standard-Reads für aktive Arbeit liefern jedoch die aktuelle Decision und markieren historische Inhalte eindeutig als nicht mehr normativ.

### 13.4 Abgeleitete Projektionen

Current Contract Summary, menschenlesbare Matrix-Aggregation und Handoff sind abgeleitete Projektionen. Sie müssen auf ihre Quellen verweisen, ihren Stand ausweisen und nach relevanten Änderungen als veraltet oder neu zu erzeugen erkennbar sein.

## 14. Human-in-the-loop und Autoritätsgrenzen

Phase 3 unterscheidet zwei menschliche Eingriffstypen:

- **operative Freigabe:** Darf ein vorbereiteter Run ausgeführt werden?
- **normative Entscheidung:** Was soll fachlich gelten?

Beide können dieselbe Person betreffen, bleiben im Produkt aber unterschiedliche Handlungen mit unterschiedlicher Wirkung.

| Aktion | Agent darf vorschlagen/erfassen | Menschliche Entscheidung erforderlich |
| --- | --- | --- |
| Workstream-Ziel, Scope, Nicht-Ziele | ja | für normative Freigabe ja |
| Work Blocks und technische Tasks | ja | nur bei neuer fachlicher Grenze |
| Planentwurf | ja | bestehende Planfreigabe bleibt getrennt |
| Run anfragen | gemäß bestehendem MCP-Vertrag | Start/Freigabe bleibt getrennt |
| Finding erfassen | ja | nein, solange keine neue Decision nötig ist |
| Evidence erfassen | ja | menschliche Abnahme nur dort, wo der Vertrag sie verlangt |
| Decision Request erfassen | ja | ja, zur Auflösung |
| Decision vorschlagen | ja | für normative Aktivierung ja |
| Bestehende Decision superseden | nur als Vorschlag | ja |
| Corrective innerhalb freigegebenem Block | ja | kein neues Go, sofern keine Stop-Gate-Grenze betroffen ist |
| Deployment, destruktive oder externe Aktion | nur wenn bereits ausdrücklich freigegeben | andernfalls ja |
| Current Contract Summary aktualisieren | als quellgebundene Projektion | keine neue Norm ohne Decision |

## 15. MCP- und API-Bedarf

### 15.1 Grundgrenze: Read und kontrollierter Write

MCP ist in Phase 3 nicht grundsätzlich read-only. Die vorhandenen eng gescopten Bubblophy-Writes bleiben Teil des Produktmodells und dürfen um ebenso klar begrenzte Phase-3-Zustandsänderungen ergänzt werden.

Dabei gilt:

- Reads stellen den gemeinsamen aktuellen Projektzustand vollständig genug bereit, damit ein berechtigter Agent ohne Chat-Historie weiterarbeiten kann.
- Writes ermöglichen kleine, semantisch eindeutige Zustandsänderungen.
- Es gibt keine generische Mutation, mit der ein Client beliebige Bubblophy-Daten verändern kann.
- Jede Write-Fähigkeit besitzt einen eigenen fachlichen Vertrag, aktuelle Rollenprüfung, Attribution, Konfliktschutz und Auditierung.
- Normative menschliche Entscheidungen bleiben Human-in-the-loop.

### 15.2 Bestehende Fähigkeiten wiederverwenden

Die vorhandenen MCP-Fähigkeiten bilden die Grundlage:

- Projekte und Issues auflisten und lesen;
- neuesten Issue-Plan lesen;
- Run lesen und ausführbare Run-Ziele auswählen;
- Planentwurf vorschlagen;
- append-only Notiz hinzufügen;
- Triage-Issue erstellen;
- freigabepflichtigen Run anfragen;
- Issue-Status konfliktgeschützt ändern.

Phase 3 darf diese Verträge nicht zu breiten generischen Schreibrechten aufweiten.

### 15.3 Neue read-only Fähigkeiten

Für providerübergreifende Nutzung werden fachlich mindestens folgende Reads benötigt; die Namen sind Produktbeispiele, keine festgelegten Endpunkte:

- `get_current_contract`
- `get_workstream`
- `list_work_blocks` / `get_work_block`
- `list_decisions` / `get_decision`
- `list_findings` / `get_finding`
- `list_evidence` / `get_evidence`
- `list_decision_requests` / `get_decision_request`
- `get_handoff_context`
- `get_human_status_summary`

Reads müssen standardmäßig den aktuellen, nicht superseded Zustand liefern und bei Bedarf historische Provenienz separat zugänglich machen.

### 15.4 Kontrollierte Schreibfähigkeiten

Phase-3-Writes sollen jeweils einen engen fachlichen Effekt haben. Mögliche Produktbeispiele sind:

- Finding erfassen;
- Evidence registrieren;
- Finding mit Evidence schließen;
- Decision Request stellen;
- Decision-Entwurf vorschlagen;
- Work-Block-Änderung vorschlagen;
- Handoff erzeugen;
- Work-Block-Status innerhalb erlaubter Grenzen aktualisieren;
- Contract-Summary-Aktualisierung aus bereits autorisierten Quellen vorschlagen;
- Status mit erwartetem Ausgangszustand ändern.

Diese Bezeichnungen sind noch keine festgelegten Toolnamen.

Besonders sensible Aktionen bleiben getrennt beziehungsweise Human-only, solange kein eigener Vertrag dafür beschlossen wurde:

- normative Decision aktivieren;
- bestehende Decision superseden;
- Scope oder Produktgrenzen verändern;
- Run freigeben;
- Deployment oder andere externe beziehungsweise destruktive Aktionen auslösen.

Ein allgemeines `update_anything`-Werkzeug ist ausgeschlossen.

### 15.5 Anforderungen an alle neuen MCP-/API-Verträge

- aktuelle Membership und Rolle bei jedem Aufruf erneut prüfen;
- aktive und archivierte Projekte korrekt unterscheiden;
- interne IDs, Tokens, Secrets und rohe Payloads minimieren;
- fremde und nicht vorhandene Ressourcen nicht unnötig unterscheidbar machen;
- OAuth-Client, Mensch und gegebenenfalls Run auditierbar attribuieren;
- Konfliktschutz über erwarteten Zustand oder äquivalente Vorbedingungen;
- paginierte und begrenzte Listen;
- strukturierte, maschinenlesbare Daten plus kurze menschenlesbare Zusammenfassung;
- keine impliziten Nebenwirkungen wie Approval, Run-Start, Deployment oder Scope-Erweiterung;
- klare Kennzeichnung von read-only, nicht idempotenten und potenziell destruktiven Aktionen;
- Supersession und historische Reads ausdrücklich statt über Zeitstempel-Heuristiken abbilden.

## 16. ChatGPT als client-spezifischer read-only Einstieg

Eine frühe Phase-3-Nutzung darf Bubblophy als read-only Wissensquelle für ChatGPT erproben, wenn dies aufgrund der technischen Clientfähigkeiten oder als Sicherheitsgrenze der sinnvollste erste Schritt ist.

Zielbild:

- Der Nutzer verbindet Bubblophy persönlich über den bestehenden Remote-MCP-/OAuth-Weg, sofern der jeweilige Client dies unterstützt.
- ChatGPT liest nur Projekte, Current Contract Summary, Decisions, Work Blocks, Findings, Evidence, Decision Requests und Handoffs, für die der Nutzer aktuell berechtigt ist.
- Der Nutzer kann fragen: „Prüfe den aktuellen Plan gegen die bindenden Decisions“, „Welche Findings blockieren wirklich?“ oder „Was müsste Martin beziehungsweise sein Agent für die Übernahme wissen?“
- Die Antwort ist beratend. Sie mutiert keinen Bubblophy-Zustand und startet keinen Run.
- Private ChatGPT-Memory oder nicht veröffentlichte Chats werden nicht automatisch zu Bubblophy-Projektwissen.

Diese read-only Anbindung ist bereits nützlich, weil sie gemeinsame Sicht und unabhängige Reviews ermöglicht. Sie ist jedoch ausschließlich eine client-spezifische Rolloutentscheidung. Sie darf nicht dazu führen, dass das Phase-3-Domainmodell oder der MCP insgesamt als read-only konzipiert wird.

Schreibzugriff aus ChatGPT ist kein notwendiger Bestandteil des ersten Phase-3-Nutzens und benötigt eine eigene Produkt-, Sicherheits- und Plattformprüfung. Codex, Claude Code und andere geeignete MCP-Clients sollen unabhängig davon weiterhin kontrollierte Phase-3-Writes erhalten können.

## 17. Status- und Readiness-Modell

Bubblophy muss parallele Statusdimensionen sichtbar getrennt halten:

- **Task/Issue:** konkrete technische Arbeit;
- **Run:** Ausführung eines Agenten;
- **Finding:** offene oder geschlossene Feststellung;
- **Evidence:** vorhandener oder fehlender Nachweis für einen Claim;
- **Work Block:** fachliches Ergebnis;
- **Integration:** Zusammenführung auf dem vorgesehenen Kandidaten;
- **Deployment:** Ausbringung in eine Zielumgebung;
- **Workstream/Overall Readiness:** Gesamtabschluss gemäß aktuellem Vertrag.

Ein möglicher menschenlesbarer Status darf daher sagen:

> Runtime-Corrective: PASS. Integration: offen. Acceptance: teilweise. Governance: offen. Overall Readiness: nicht erreicht.

Er darf nicht aus „137/137 Tests bestanden“ automatisch „Feature fertig“ machen.

## 18. Benachrichtigungen und Aufmerksamkeit

Phase 3 soll die bestehende Benachrichtigungslogik um fachlich relevante Aufmerksamkeit ergänzen. Priorität haben:

- offene Decision Requests;
- echte Stop-Gates;
- P0/P1-, Security- oder Datenintegritäts-Findings;
- widersprüchliche autoritative Aussagen;
- veraltete Handoffs oder Contract Summaries;
- freigabepflichtige Runs und Reviews;
- Work Blocks, deren nächster Schritt wieder ausführbar geworden ist.

Unveränderte oder rein informative Zustände sollen Menschen nicht mit wiederholten Meldungen belasten.

Diese Aufmerksamkeitsansicht ist eine ergänzende Übersicht und keine Voraussetzung dafür, dass ein Nutzer von einem echten Blocker erfährt. Der aktuell arbeitende Agent bleibt verpflichtet, ein Stop-Gate im aktiven Chat zu eskalieren. Umgekehrt erzeugt eine normale Bubblophy-Aktualisierung weder automatisch einen Stopp noch einen neuen Freigabebedarf.

## 19. Produktweite Akzeptanzkriterien

Phase 3 erfüllt ihr Produktziel, wenn folgende Szenarien ohne vollständige Chat-Rekonstruktion möglich sind:

1. Ein neuer Agent kann für einen Workstream den aktuellen Vertrag, aktive Decisions, Work Blocks, offene Findings, gültige Evidence und nächste erlaubte Schritte eindeutig lesen.
2. Eine ältere, ausdrücklich superseded Decision wird im Standardkontext nicht mehr als bindend präsentiert, bleibt aber historisch nachvollziehbar.
3. Ein Finding innerhalb eines freigegebenen Blocks kann zu Corrective und fokussiertem Re-Review führen, ohne künstlichen neuen Work Block oder Nutzer-Go.
4. Eine echte Produkt- oder Berechtigungsfrage erzeugt einen verständlichen Decision Request und blockiert nur den betroffenen Pfad.
5. Ein Run-PASS wird nicht als Integrations-, Deployment- oder Overall-PASS ausgegeben.
6. Evidence ist an konkrete Claims und Kandidaten gebunden; ein Kandidatenwechsel macht übertragbare und nicht übertragbare Nachweise unterscheidbar.
7. Eine Matrix mit hunderten oder tausenden offenen Zeilen wird als kleine Zahl realer fachlicher Restblöcke verständlich dargestellt.
8. Martin oder ein anderer berechtigter Nutzer kann mit einem anderen Agenten/Provider anhand eines Handoffs weiterarbeiten, ohne Manuels private Chats oder Memories zu benötigen.
9. Ein read-only persönlicher MCP-Client kann den aktuellen Zustand prüfen, ohne Schreibrecht, Agent-Token oder Service-Role-Secret zu erhalten.
10. Jede relevante Zustandsänderung ist Mensch, Client, Arbeitsrolle, Run und Quelle soweit fachlich erforderlich zuordenbar.
11. Parallele veraltete Writes überschreiben keine neuere normative Decision oder Statusänderung still.
12. Archivierte Projekte und Workstreams bleiben historisch lesbar, aber operativ schreibgeschützt.
13. Ein Agent dokumentiert ein echtes Stop-Gate als Decision Request in Bubblophy und eskaliert es zugleich aktiv und verständlich im aktuellen Chat.
14. Ein normaler Finding-, Status- oder Evidence-Eintrag führt innerhalb eines freigegebenen Vertrags weder zum Stopp noch zu einem unnötigen Nutzer-Go.
15. Eine im Chat getroffene bindende Entscheidung wird anschließend mit Attribution in Bubblophy festgehalten.

## 20. Produktfragen für den späteren Implementierungsplan

Diese Spezifikation legt das Zielmodell fest, aber noch nicht alle Ausprägungen. Lio soll vor einem Implementierungsplan insbesondere folgende Punkte gegen das reale Repository und Schema klären:

1. Soll `Feature` oder `Workstream` der primäre Nutzerbegriff sein, und wie passt er zur bestehenden Projektnavigation?
2. Welche Phase-3-Konzepte benötigen eigenständige persistierte Objekte, und welche können als typisierte Beziehungen auf bestehenden Issues, Plänen und Audit-Events abgebildet werden?
3. Welche Statuswerte existieren bereits und können wiederverwendet werden, ohne konkurrierende Zustandsmaschinen einzuführen?
4. Wie wird die Current Contract Summary erzeugt, validiert, freigegeben und nach Quelländerungen als veraltet markiert, ohne eine neue Spec-Kopie zu werden?
5. Welche Decisions müssen zwingend menschlich aktiviert werden, und welche rein technischen Festlegungen dürfen innerhalb eines freigegebenen Blocks durch den Coordinator vorgenommen werden?
6. Wie wird Kandidatenidentität repositoryübergreifend beschrieben, ohne Git oder GitHub zu duplizieren?
7. Wie werden Matrix-Claims importiert oder referenziert, ohne Bubblophy zu einem Matrixgenerator zu machen?
8. Welche bestehenden Audit-Eventtypen und Notes können weiterverwendet werden, und wo braucht es fachlich abfragbare eigene Objekte?
9. Wie werden Handoffs aktualitätsgebunden und sichtbar veraltet, ohne die Historie umzuschreiben?
10. Welche minimalen Read-Fähigkeiten liefern zuerst echten Nutzen für ChatGPT, Codex und Claude?
11. Welche kontrollierten Writes erhalten geeignete agentische Arbeitsclients, und welche Aktionen bleiben bewusst UI-/Human-only?
12. Wie wird Arbeitsrollen-Unabhängigkeit bei Reviews dargestellt, ohne eine unnötige neue Berechtigungslogik aufzubauen?
13. Welche Konflikt- und Reconciliation-UX braucht ein menschlicher Coordinator bei widersprüchlichen Decisions, Findings oder Evidence?
14. Ab welcher Größe oder Komplexität wird die Workstream-Ebene empfohlen, ohne kleine Features mit Prozess zu überladen?

## 21. Empfohlene Planungsgrenze für Lio

Der spätere Implementierungsplan soll:

- zuerst das reale bestehende Domainmodell, Schema, Routen, MCP-Tools, Rollen und Audit-Events verifizieren;
- bestehende Konzepte bevorzugt erweitern statt parallele Systeme einzuführen;
- Read-first und schrittweise vorgehen, ohne daraus eine dauerhafte read-only MCP-Grenze abzuleiten;
- normative Human-in-the-loop-Grenzen vor Schreibwerkzeugen festlegen;
- das kleinste nutzbare vertikale Produktinkrement bestimmen;
- Migration, Rückwärtskompatibilität und archivierte Projekte berücksichtigen;
- klare Produkt-/API-Verträge und Akzeptanztests pro Slice definieren;
- keine automatische Runner-, Chatbus-, Memory-Ingestion- oder Deployment-Funktion ergänzen, die aus dieser Spezifikation nicht folgt;
- offene Produktfragen sichtbar lassen, statt sie durch zufällige Implementierungsdetails zu entscheiden.

Ein sinnvoller erster Phase-3-Nutzen wäre erreicht, wenn ein bestehender Bubblophy-Workstream einen menschlich freigegebenen Current Contract, Decisions mit Supersession, fachliche Work Blocks und einen Handoff-Kontext für mehrere MCP-Clients bereitstellen kann. Eine anfängliche ChatGPT-Nutzung darf dabei read-only sein. Kontrollierte Writes für geeignete agentische Arbeitsclients bleiben Teil des Zielbilds und müssen im Plan gegen das reale Fundament geschnitten werden.

## 22. Quellenbasis und bewusste Grenzen

Diese Spezifikation basiert auf:

- dem Bubblophy-MVP als human-in-the-loop Issue- und Agent-Orchestrierungsoberfläche;
- der Phase-2-Roadmap;
- dem Rollen-/Einladungsvertrag;
- der MCP-Foundation und dem MCP-Betriebsvertrag;
- dem bisherigen Gespräch über Bubblophy, agentenübergreifende Kontinuität und eine mögliche read-only ChatGPT-Nutzung;
- den praktischen Logging-V2-Lehren zu Micro-Slicing, Review-Inception, Stop-Gates, Supersession, Kandidatenbindung, Evidence und menschlicher Matrix-Aggregation.

Sie trifft bewusst keine Festlegung zu Tabellen, Komponenten, exakten Endpunkten, UI-Layouts, Hintergrundjobs oder Deploymentarchitektur. Diese Entscheidungen gehören in den späteren, repositorybasierten Implementierungsplan.
