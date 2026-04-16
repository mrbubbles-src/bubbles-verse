# Markdown Packages Manifest

Datum: 2026-04-16

Status:
- verbindlicher Arbeitsstand für
  - `packages/markdown-editor`
  - `packages/markdown-renderer`
- langlebige Referenz für spätere Chats, Reviews und Implementierungen
- Stand dieses Dokuments:
  - Phase 1 ist umgesetzt
  - Phase 2 ist umgesetzt
  - nächste Arbeit ist gezielte Folgearbeit nach der ersten echten
    App-Integration

Diese Datei ist absichtlich kein loses Brainstorming. Sie ist der aktuell
verbindliche Plan für die Markdown-Packages. Wer später daran arbeitet, soll
hieraus sofort erkennen:

- was das Zielbild ist
- was bereits gut und feature-fertig ist
- was bewusst so bleiben soll
- was noch gebaut oder umgebaut werden muss
- nach welchen Regeln geprüft und entschieden werden soll

## Kurzfassung

Die Markdown-Packages sollen **referenztreue, funktionierende,
konfigurierbare Shared Packages** sein.

Das bedeutet:

- Die funktionierenden Referenzen bleiben die fachliche Wahrheit für das
  Verhalten.
- Das Verhalten soll nicht unnötig neu erfunden werden.
- Gleichzeitig sollen die Packages so geschnitten sein, dass sie in mehreren
  Apps wiederverwendbar und konfigurierbar sind.

Das Ziel ist also bewusst ein Mix aus:

- Referenz-Parität
- Shared-Library-Gedanke

Nicht gewollt sind:

- blinde Copy-Paste-Snapshots der Referenzen
- app-spezifische Domainlogik im Package-Kern
- unnötige Neuimplementierungen funktionierender Markdown-Bausteine
- künstliche Abstraktionen ohne klaren Nutzen

## Wofür die Packages da sind

Die Packages existieren, damit mehrere Oberflächen einen gemeinsamen
Markdown-/Editor-Kern nutzen können, ohne wieder Copy-Paste zwischen Projekten
zu betreiben.

Beispiele für solche Oberflächen:

- ein geschütztes Admin-Dashboard für Bubbles-Verse
- Blog-Content
- Coding-Vault-Content
- Portfolio-/Projekt-Content
- spätere weitere Apps mit eigenen Anforderungen

Der Kern soll gemeinsam sein. Die konkrete Produktfläche darf sich trotzdem
unterscheiden, zum Beispiel bei:

- Tool-Set des Editors
- Metadatenfeldern
- Slug-Strategie
- Upload-Foldern und Policies
- finaler visueller Darstellung

## Verbindliche Entscheidungsregeln

Jede relevante Änderung an den Markdown-Packages muss in genau dieser
Reihenfolge bewertet werden:

1. `AGENTS.md` prüfen
2. Referenzcode prüfen
3. aktuelle Repo-Standards prüfen
4. offizielle Dokumentation prüfen
5. erst dann Änderung entwerfen

Das ist verbindlich. Nicht nach Gefühl umbauen. Nicht auf altem Wissen
vertrauen. Nicht nur deshalb umstellen, weil ein anderer Weg theoretisch auch
möglich wäre.

### Geplante Umbauten immer vorab mit dem Nutzer abstimmen

Wenn Umbauten an den Markdown-Packages geplant sind, müssen sie immer zuerst
mit dem Nutzer abgestimmt werden, bevor sie umgesetzt werden.

In diesem Repo bedeutet das konkret:

- mit Manuel
- oder allgemein mit der jeweils anfragenden Person im aktuellen Chat

Das gilt besonders dann, wenn:

- ein bestehender Teil bereits funktioniert
- ein Agent meint, etwas "besser" oder "sauberer" machen zu wollen
- eine Änderung über Bugfixing hinausgeht und in Richtung Umbau, Refactor oder
  Architekturänderung geht

Verbindliche Regel:

- funktionierende Teile nicht eigenmächtig umbauen
- keine stillen Strukturwechsel
- keine größeren Refactors ohne vorherige Abstimmung

Bugfixes und klar notwendige Korrekturen sind davon nicht automatisch
ausgenommen, sobald sie faktisch in einen Umbau eines funktionierenden Bereichs
kippen.

### `AGENTS.md` ist immer verbindlich

`/Users/mrbubbles/dev/bubbles-verse/AGENTS.md` ist für jede Arbeit an den
Markdown-Packages immer mitzulesen und mit zu berücksichtigen.

Das gilt ohne Ausnahme.

Wenn:

- dieses Manifest
- Referenzcode
- Repo-Standards
- offizielle Doku

geprüft werden, dann gehört `AGENTS.md` immer ebenfalls dazu.

Es ist nicht optional und nicht nur "wenn man daran denkt", sondern Teil der
verbindlichen Entscheidungsgrundlage.

### Referenzen, die als Wahrheit gelten

- `portal-ref`
- `lms-ref`
- `to-be-integrated`
- `apps/the-coding-vault`

### Repo-Standards, die zu beachten sind

- Hugeicons statt plötzlicher Rückkehr zu Lucide, wenn der Repo-Standard
  Hugeicons ist
- bestehende shadcn/BaseUI-Standards statt plötzlicher Radix-Direktlogik,
  wenn die Repo-Standardbasis BaseUI ist
- bestehende Catppuccin-Standards statt fremder Sonderthemes, wenn die Repo
  dort bereits einen klaren Standard hat

### Offizielle Doku ist immer Pflicht

Auch wenn in dieser Datei schon Entscheidungen stehen, müssen fachlich
relevante Punkte immer noch gegen offizielle Doku geprüft werden.

Das gilt besonders für:

- Next.js
- Cloudinary
- MDX
- unified / remark / mdast
- react-hook-form
- Shiki

Diese Datei ersetzt keine Doku. Sie dokumentiert Entscheidungen auf Basis
geprüfter Doku und Referenzen.

## Was bereits feature-fertig oder bereits richtig ist

Dieser Abschnitt ist wichtig, damit spätere Arbeit nicht so tut, als wäre
alles kaputt. Vieles ist bereits vorhanden und funktional korrekt.

Die folgende Einordnung basiert auf:

- lokalem Code-Audit
- vorhandenen Tests
- Referenzabgleich
- praktischen Nutzerbeobachtungen aus der Markdown-Reference-App

### Bereits stark genug, um als feature-fertig zu gelten

- Editor-Shell
- Live-Preview
- Scroll-Sync zwischen Editor und Preview
- Rendern der im Editor erzeugten Markdown-/MDX-Daten
- Import von `.md`, `.mdx` und `.markdown`
- Tool-Subsetting / Plugin-Allowlist
- grundlegendes Bild-Rendering
- Component-Registry-Verhalten mit Package-Defaults plus App-Overrides

Konkret bedeutet das:

- der Editor-Kern funktioniert
- die Preview funktioniert
- der Scroll-Sync funktioniert
- der Importpfad funktioniert
- der Serializer-/Renderer-Pfad funktioniert
- der Mechanismus für app-spezifische `mdx-components.tsx`-Erweiterung ist
  da und fachlich richtig

### Bereits richtig entschiedene Punkte

- `FormBeispiel` bleibt draußen
- LMS-/Ticket-/Versionierungslogik gehört nicht in die Shared-Packages
- `@mdx-js/mdx` ist der richtige Runtime-/Preview-Baustein für gespeicherte
  MDX-Strings
- `@next/mdx` bleibt app-spezifisch für file-based MDX in echten Next-Projekten
- `mdx-components.tsx` darf und soll pro App existieren
- das Package soll trotzdem einen generischen Default-Komponentensatz liefern
- funktionierende `markdown-*`-Komponenten sollen nicht neu erfunden werden

### Seit diesem Manifest bereits umgesetzt

Die folgenden Punkte sind nicht mehr offen, sondern bereits erledigt:

- Die Package-Default-Metadatenform läuft wieder auf `react-hook-form`.
- Die Form nutzt den aktuellen shadcn-`Field`-Pfad statt auf dem alten
  `Form`-Wrapper-Modell zu bleiben.
- Die Slug-Strategie ist als Package-Hook vorhanden:
  - `slugStrategy`
  - `slugStrategyContext`
- Der Slug-Pfad unterstützt Segment-/Pfadlogik statt nur flache Titel-Slugs.
- Die Shared-Cloudinary-Upload-Basis existiert als package-seitige
  Route-Factory für Next.js-Route-Handler.
- Shiki ist auf den Repo-Standard umgestellt:
  - `catppuccin-latte`
  - `catppuccin-mocha`
- Eine echte Next.js-Validierungs-App hat die package-seitige Upload- und
  Metadatenintegration erfolgreich gegen reale Save-/Render-/Upload-Flows
  verifiziert.
- Die Package-Default-Metadatenform wurde bereits erfolgreich in einer echten
  App-Integration genutzt statt nur in isolierten Paket-Tests.
- Standard-Slugs und app-seitige Pfad-Slugs wurden bereits erfolgreich über
  `slugStrategy` in einer echten App validiert.
- Standard-Metadaten plus `editorContent` und `serializedContent` wurden bereits
  erfolgreich gemeinsam persistiert und wieder gerendert.
- Die Package-README dokumentiert jetzt konkrete Slug-Muster für:
  - Blog
  - Vault
  - Portfolio
- Die Package-README grenzt jetzt klar ab, wann die Package-Form reicht und
  wann `renderForm` für eigene Metadaten nötig ist.
- Die TypeScript-Projektkonfiguration der Markdown-Packages prüft auch die
  Testdateien, sodass IDE-/TS-Fehler in Tests nicht mehr an einer falschen
  oder unvollständigen Paketkonfiguration hängen.
- Die jüngsten React-/ESLint-Warnpfade rund um
  - `setState in effect`
  - `refs during render`
  - `exhaustive-deps`
  sind in den betroffenen Markdown-Package-Dateien bereinigt.

### Wichtige Klarstellung zu den Nutzerbeobachtungen

Die folgenden Punkte gelten aktuell als **funktionierend nach Nutzertest** und
sollen deshalb nicht ohne klaren Grund wieder grundlegend umgebaut werden:

- der Markdown-Editor
- die Preview
- der Scroll-Sync
- das Rendern editor-erzeugter Inhalte
- der Import von Markdown-Dateien

Hinweis:
- Das ist keine mathematische Vollabnahme.
- Es ist aber stark genug, um diese Bereiche nicht pauschal als "offen" oder
  "kaputt" zu behandeln.

## Was bewusst so bleiben soll

### Funktionierende `markdown-*`-Renderer werden nicht neu erfunden

Die bestehenden Implementierungen von:

- `MarkdownImage`
- `MarkdownLink`
- `MarkdownChecklist`
- `MarkdownToggle`
- `MarkdownEmbed`
- `MarkdownCodeBlock`
- `MarkdownAlerts`

sollen nicht grundlos ersetzt, kreativ umgebaut oder doppelt gebaut werden.

Wenn ein solcher Baustein fachlich funktioniert, gilt:

- behalten
- nur bei echtem Bug oder klarer Inkompatibilität anpassen
- nur vereinfachen, wenn der Gewinn nachvollziehbar ist

Nicht gewollt:

- alternative Parallelimplementierungen
- "smartere" Abstraktionen ohne klaren Mehrwert
- Verschlimmbesserung funktionierender Renderer

### `mdx-components.tsx` bleibt App-Sache, aber nicht ohne Package-Default

Apps dürfen ihre eigene `mdx-components.tsx` behalten, damit sie Inhalte
unterschiedlich stylen können.

Das ist gewollt für:

- Blog
- Coding Vault
- Portfolio
- spätere weitere Apps

Gleichzeitig gilt:

- `@bubbles/markdown-renderer` liefert einen generischen, funktionierenden
  Default-Komponentensatz
- Apps dürfen diesen Default unverändert nutzen
- Apps dürfen ihn gezielt erweitern oder überschreiben

Also:

- App-Level-Styling: ja
- jede App muss alles neu schreiben: nein

### Parser-Stack und Styling sind zwei verschiedene Dinge

`mdx-components.tsx` ist für Darstellung und Styling zuständig.

`unified`, `remark-parse`, `remark-gfm` und `mdast` sind für Parsing und
Import zuständig.

Das darf nicht miteinander verwechselt werden.

## Verbindliche technische Einordnung

### MDX-Strategie

#### `@mdx-js/mdx`

Bleibt im Package.

Grund:

- richtig für Live-Preview
- richtig für gespeicherte MDX-Strings aus DB oder JSON
- richtig für Runtime-Kompilierung und `evaluate()`

#### `@next/mdx`

Bleibt app-spezifisch.

Grund:

- richtig für echte `.md`/`.mdx`-Dateien in Next-Projekten
- nicht der richtige primitive Baustein für Editor-Live-Preview aus
  gespeicherten Strings

#### `@mdx-js/react`

Ist ein sinnvoller React-/Provider-Baustein, aber nicht automatisch für jeden
Package-Pfad nötig.

#### `@mdx-js/loader`

Ist Build-/Bundler-Integration, nicht automatisch der richtige Runtime-Pfad
für gespeicherte MDX-Strings.

### Markdown-Import-Stack

Die Dependencies

- `unified`
- `remark-parse`
- `remark-gfm`

sind fachlich für den Markdown-Import da, nicht für Default-Styling.

Der Pfad ist:

- Markdown-Text rein
- AST bauen
- daraus EditorJS-Blöcke erzeugen

Das ist korrekt und soll so verstanden bleiben.

### `mdast`

`mdast` ist die Markdown-AST-Typwelt.

Der derzeitige Stand ist ein Zwischenzustand:

- in Referenzen werden `mdast`-Typen direkt genutzt
- im Package wurden AST-Typen teilweise lokal nachgebaut
- gleichzeitig ist `mdast` als Dependency vorhanden

Beschluss:

- Der Parser-Stack bleibt grundsätzlich
- das Typing rund um `mdast` muss später sauber bereinigt werden

## Metadaten-Form: Zielmodell

Wenn von "eigene Formulare einhängen" gesprochen wird, ist damit spezifisch
das **Metadatenformular** gemeint.

Nicht gemeint ist:

- jede App baut ihren eigenen Editor-Kern
- jede App muss alle Standardfelder selbst erfinden

### Was die Default-Form leisten soll

Die Package-Default-Form soll die gemeinsamen Basisfelder liefern, die in fast
allen Oberflächen gebraucht werden.

Gemeinsame Standards:

- `title`
- `description`
- `published` oder ähnlicher Status
- `tags`
- Standard-Autosave
- Standard-Submit-Payload
- Standard-Slug-Feld

### Was konfigurierbar bleiben soll

Apps dürfen:

- die Slug-Strategie austauschen
- zusätzliche Felder ergänzen
- bei Bedarf die Default-Form ersetzen

### Form-Technik

Die Package-Default-Form soll wieder auf `react-hook-form` basieren.

Das ist beschlossen.

Begründung:

- RHF ist Repo-Standard
- Reset-/Autosave-/Derived-Value-Verhalten passt besser dazu
- die aktuelle Form-Komplexität ist eher RHF-geeignet als reine `useState`

Nicht gewollt:

- LMS-Domainform ins Package ziehen
- Monsterform mit Ticket-/Review-/Versionslogik bauen

## Slug-Architektur: Zielmodell

Die finale Slug-Struktur wird nicht in jeder App gleich sein.

Beispiele:

- Blog: `YYYY/MM/DD/blog-title`
- Coding Vault: `main-category/sub-category/vault-entry-title`
- Portfolio: `projects/project-title`

Deshalb gilt:

### Was ins Package gehört

- Slug-Segmente normalisieren
- Slug-Teile sicher bauen
- Pfad-Segmente sauber zusammensetzen
- gemeinsame Hilfsfunktionen bereitstellen
- Integration in die Default-Form

### Was nicht hart ins Package gehört

- die endgültige Slug-Architektur jeder einzelnen App

Zielmodell:

- gemeinsamer Slug-Baukasten im Package
- app-spezifische Slug-Strategie in der jeweiligen App

## Cloudinary: verbindlicher Standard

### Gültige Env-Variablen

Die festgelegten Cloudinary-Variablen sind:

```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
NEXT_PUBLIC_CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
```

Wichtige Klarstellung:

- das eigentliche serverseitige Geheimnis ist `CLOUDINARY_API_SECRET`
- diese Konvention ist in diesem Repo der verbindliche Standard

### Upload-Architektur

Der Upload soll weiterhin über eine Next.js-API-Route bzw. einen Route
Handler laufen.

Das ist gewollt.

Was sich ändern soll:

- nicht jede App soll den kompletten technischen Uploadpfad immer wieder neu
  bauen müssen

Gewünschtes Zielmodell:

#### Package liefert

- Upload-Response-Contract
- Cloudinary-Config-Auflösung
- gemeinsame Helper / Factories
- wenn sinnvoll standardisierte Next.js-Route-Helfer

#### App liefert

- konkreten Foldernamen
- ggf. Auth/Policy-Regeln
- konkrete Route-Ausführung

Also:

- standardisierte Factory-/Helper-Logik im Package
- appseitige Ausführung im Route Handler

Nicht gewollt:

- vollständige Entkopplung vom Next-Route-Modell
- komplette Route-Neuerfindung pro App

## Repo-Standards, die die Packages respektieren müssen

### Icons

Hugeicons sind der gewollte Repo-Standard.

Wenn Referenzen an manchen Stellen noch Lucide nutzen, ist das kein
Freifahrtschein, in den Shared-Packages wieder beliebig Lucide zu etablieren.

Ziel:

- an den im Repo gelebten Standard anlehnen
- keine zufällige Mischwelt ohne bewusste Entscheidung

### Component-Primitives

Die Packages sollen sich an den im Repo genutzten shadcn/BaseUI-Standards
orientieren.

Nicht plötzlich:

- direkte Radix-Logik einführen
- neue Primitive-Basen etablieren
- Referenzcode blind übernehmen, wenn er dem Repo-Standard widerspricht

### Syntax Highlighting

Shiki soll sich am Repo-Standard orientieren:

- `catppuccin-latte` für Light Mode
- `catppuccin-mocha` für Dark Mode

Aktueller Soll-Zustand:

- Catppuccin ist Standard
- `one-dark-pro` ist hier nicht mehr das Zielbild

## Was noch gemacht werden muss

Die folgenden Punkte gelten aktuell als echte Folgearbeit. Nicht alles hiervon
ist kaputt, aber es ist noch nicht am gewünschten Zielbild.

### Nächste Schritte ab jetzt

### Hoch priorisiert

- Die nächste echte Consumer-App als Validierungsfläche nutzen und nur
  reproduzierbare echte Lücken aus ihr zurück in die Packages ziehen.
- Einen echten UI-Upload-Flow zusätzlich browserseitig gegen den Editor selbst
  absichern, sobald der lokale Browser-MCP-/Playwright-Pfad wieder stabil ist.

### Mittlere Priorität

- `mdast`-/AST-Typing sauber entscheiden und aufräumen
- Repo-Standards bei Icons und Primitives in den Markdown-Packages konsequent
  prüfen und nur dort angleichen, wo echte Abweichungen bestehen
- Die Package-Dokumentation um konkrete Integrationsbeispiele ergänzen:
  - Blog
  - Coding Vault
  - Portfolio
- Die nächste echte Consumer-App bewusst auswählen und dort den
  Package-Standard erneut gegen einen realen Save-/Render-/Upload-Flow
  verifizieren

### Aktuell ausdrücklich nicht offen

Die folgenden Punkte gelten derzeit nicht mehr als Phase-2-Ziele, weil sie
bereits umgesetzt sind:

- RHF-Rückbau der Default-Form
- package-seitige Cloudinary-Route-Factory
- Catppuccin-Umstellung für Shiki
- erste echte App-Integration zur Validierung der Package-Schnittstellen
- Dokumentation des Slug-Baukastens als app-seitiger Strategie-Hook
- fachliche Einordnung der Package-Default-Form gegenüber `renderForm`

### Laufende Regel für Folgearbeit

Vor jeder größeren Änderung ist erneut zu prüfen:

1. `AGENTS.md`
2. Verhalten in Referenzen
3. Repo-Standard
4. offizielle Doku
5. mit dem Nutzer abstimmen, wenn es ein Umbau eines funktionierenden Bereichs ist
6. erst dann Umsetzung

## Konkretes Zielbild pro Package

### `@bubbles/markdown-editor`

Soll enthalten:

- EditorJS-Kern
- Tool-Konfiguration und Subsetting
- Import von Markdown nach EditorJS
- Serializer
- Preview-Integration
- RHF-basierte Default-Metadata-Form
- Slug-Basisfunktionen
- Upload-Integrationshelpers

Soll nicht enthalten:

- app-spezifische Domainmutationen
- app-spezifische Review-, Ticket- oder Versionierungslogik

### `@bubbles/markdown-renderer`

Soll enthalten:

- stabile Shared-Renderer-Komponenten
- generischen Default-Komponentensatz
- klar getrennte Pfade für
  - preview-safe Rendering
  - runtime/server Rendering

Soll nicht enthalten:

- unnötige alternative Implementierungen funktionierender
  `markdown-*`-Komponenten
- erzwungene finale Styling-Entscheidungen für jede App

## Abschluss

Wer später an den Markdown-Packages arbeitet, soll aus dieser Datei exakt
Folgendes mitnehmen:

- Die Referenzen sind die funktionale Basis.
- Die Packages sollen diese Basis nicht neu erfinden.
- Die Packages sollen bewusst wiederverwendbar und konfigurierbar sein.
- Vieles ist bereits funktionierend und darf nicht grundlos wieder aufgerissen
  werden.
- Offene Arbeit liegt jetzt vor allem bei weiterer realer Verifikation,
  `mdast`-/AST-Aufräumen, Repo-Alignment und der nächsten Consumer-App nach der
  Reference-Validierung.
- Jede relevante Entscheidung muss gegen `AGENTS.md`, Referenzen,
  Repo-Standards und offizielle Doku geprüft werden.
- Geplante Umbauten funktionierender Bereiche werden nicht einfach gemacht,
  sondern vorher mit dem Nutzer abgestimmt.

Diese Datei ist damit die verbindliche Orientierung für weitere Entscheidungen,
Reviews und Implementierungen an den Markdown-Packages.
