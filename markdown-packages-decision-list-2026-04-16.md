# Markdown Packages Decision List

Datum: 2026-04-16

Basis:
- [markdown-packages-audit-report-2026-04-15.md](./markdown-packages-audit-report-2026-04-15.md)

Ziel:
- kurze, priorisierte Entscheidungsliste
- was behalten werden sollte
- was zurückgebaut oder neu zugeschnitten werden sollte
- in welcher Reihenfolge das sinnvoll ist

## P0: Erst entscheiden, was die Packages sein sollen

Diese Entscheidung ist die wichtigste, weil fast alle anderen Reibungen daraus
entstehen.

### Entscheidung

Die Packages sollten **generische Shared-Kerne** sein, **nicht** 1:1-Kopien der
Referenz-Apps.

### Begründung

- Die Referenzen enthalten zu viel App-/Domainlogik.
- Ein Shared-Package sollte Editor, Renderer, Import, Preview und Contracts
  kapseln, aber nicht LMS-/Vault-/Dashboard-Workflows.
- Genau deshalb sind Dinge wie `renderForm` und `plugins` sinnvoll.

### Konsequenz

Nicht alles muss auf Referenz-Parität zurückgebaut werden.

Stattdessen:
- generische Teile sauber halten
- app-spezifische Teile bewusst draußen lassen
- aber die Grenze klarer ziehen als bisher

## P1: `EditorForm` zurück auf Repo-Standard bringen

### Entscheidung

Die Package-`EditorForm` sollte auf `react-hook-form` umgestellt werden.

### Status

**Zurückbauen / neu schneiden**

### Warum

- Im Repo ist RHF klar der Standard.
- Die aktuelle `useState`-Form ist nicht grundsätzlich falsch, aber schwächer
  bei Reset, Ableitungen, Dirty-State und Erweiterbarkeit.
- Das ist eine der Änderungen, die sich eher wie „abweichend“ als wie „besser“
  anfühlt.

### Behalten

- die Minimalität der Felder
- H1 -> Titel
- Titel -> Slug
- App-agnostische Form

### Nicht zurückholen

- LMS-Domainfelder
- Ticket-/Versionslogik

## P2: Upload-Architektur stärker ins Package ziehen

### Entscheidung

Cloudinary-Upload sollte **nicht komplett app-owned** bleiben.

### Status

**Neu schneiden**

### Warum

- Der technische Upload-Pfad ist fast überall gleich.
- Nur Folder/Policy/Auth unterscheiden sich.
- Das jetzige Modell erzeugt zu viel Copy-Paste und Debugging-Aufwand.

### Zielbild

Ins Package:
- Upload-Contract
- Cloudinary-Config-Resolution
- gemeinsame Helper / Factory
- optional Next-Route-Helper

In die App:
- Foldername
- Auth
- Business-Regeln

### Entscheidung in einem Satz

Nicht „vollständig zentralisieren“, aber deutlich mehr vorbereiten als heute.

## P3: Cloudinary-Env-Contract standardisieren

### Entscheidung

Es braucht einen verbindlichen gemeinsamen Cloudinary-Contract über alle
Markdown-/Content-Flows.

### Status

**Neu schneiden**

### Warum

- Werte sind nicht das Problem, sondern fehlende Standardisierung.
- Heute wirkt derselbe Upload je nach App anders, obwohl er praktisch dasselbe
  tut.

### Zielbild

Server:
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

Optional Client:
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`

## P4: `@mdx-js/mdx` im Package behalten

### Entscheidung

`@mdx-js/mdx` sollte **behalten** werden.

### Status

**Behalten**

### Warum

- Für Live-Preview und gespeicherte MDX-Strings ist es fachlich der richtige
  Baustein.
- `@next/mdx` ist für file-based Next-MDX sinnvoll, nicht für Editor-Preview.
- `@mdx-js/loader` ist Bundler-/Build-Time-Integration, nicht der richtige
  Primitive für diesen Package-Use-Case.

### Konsequenz

Nicht reflexhaft zurückbauen, nur weil andere Apps zusätzlich `@next/mdx` oder
 `@mdx-js/react` nutzen.

## P5: MDX-Strategie klar dokumentieren

### Entscheidung

Die MDX-Rollen müssen explizit dokumentiert werden.

### Status

**Neu schneiden**

### Es braucht drei klar benannte Modi

1. Editor-Live-Preview
2. Runtime-Rendering gespeicherter MDX-Strings
3. File-based Next-MDX in Apps

### Warum

Die aktuelle Verwirrung kommt nicht nur vom Code, sondern auch daher, dass die
Rollen der verschiedenen MDX-Pakete nicht explizit gemacht wurden.

## P6: `unified` / `remark-parse` / `remark-gfm` behalten

### Entscheidung

Diese Dependencies sollten **behalten** werden.

### Status

**Behalten**

### Warum

- Sie gehören zum Markdown-Import-Pfad, nicht zum MDX-Rendering.
- Dafür sind sie fachlich passend.
- Sie kommen nicht „aus dem Nichts“, sondern sind auch in den Referenzen
  verankert.

## P7: `mdast` bereinigen

### Entscheidung

`mdast` in der aktuellen Package-Form bereinigen.

### Status

**Zurückbauen / neu schneiden**

### Warum

- In den Referenzen werden `mdast`-Typen direkt importiert.
- Im Package werden AST-Typen lokal nachgebaut.
- Gleichzeitig liegt `mdast` als Dependency drin, ohne dort wirklich genutzt zu
  werden.

### Zielbild

Entweder:
- echte `mdast`-Typen sauber nutzen

oder:
- Dependency entfernen

Der jetzige Zwischenzustand ist unnötig verwirrend.

## P8: `renderForm` behalten

### Entscheidung

`renderForm` sollte **behalten** werden.

### Status

**Behalten**

### Warum

- Das ist genau die richtige Shared-Package-Grenze.
- Apps mit mehr Domainlogik können ihre eigene Form rendern.
- Das Package muss nicht alle App-Felder kennen.

## P9: `plugins` / Tool-Subsetting behalten

### Entscheidung

`plugins` und die subset-aware Tool-Logik sollten **behalten** werden.

### Status

**Behalten**

### Warum

- Das ist echter Mehrwert einer Shared-Library.
- Die Referenzen brauchten das nicht, weil sie nur eine feste App-Konfiguration
  hatten.
- Für ein Package ist das sinnvoll.

## P10: `FormBeispiel` entfernt lassen

### Entscheidung

`FormBeispiel` sollte **entfernt bleiben**.

### Status

**Behalten**

### Warum

- Das ist Legacy-/Demo-Ballast.
- Kein sinnvoller Shared-Contract.
- Nur dann zurückholen, wenn es wirklich produktiv genutzten Altcontent gibt,
  der nicht migriert werden kann.

## P11: Preview-/Renderer-Trennung behalten, aber klarer zuschneiden

### Entscheidung

Die Trennung zwischen server-/runtime-Renderer und preview-safe Client-Renderer
ist technisch sinnvoll, sollte aber klarer dokumentiert und kleiner gehalten
werden.

### Status

**Behalten, aber schärfer zuschneiden**

### Warum

- Live-Preview hat andere Anforderungen als finale App-Renderpfade.
- Die Trennung ist kein Selbstzweck, sondern nötig.
- Sie wirkt aktuell nur zu diffus und zu wenig erklärt.

## Priorisierte Reihenfolge

Wenn ich daraus eine Arbeitsreihenfolge machen müsste:

1. Zielbild festziehen: Shared-Kern statt Referenz-1:1
2. `EditorForm` wieder auf RHF-Basis bringen
3. Upload-/Cloudinary-Standardisierung im Package deutlich ausbauen
4. gemeinsamen Env-/Upload-Contract definieren
5. MDX-Rollen dokumentieren und begrifflich entwirren
6. `mdast`-Abhängigkeit sauber aufräumen
7. danach erst kleinere Paritäts- und UX-Themen

## Sehr kurze Entscheidungsfassung

### Behalten

- `@mdx-js/mdx`
- `unified` / `remark-parse` / `remark-gfm`
- `renderForm`
- `plugins`
- Entfernung von `FormBeispiel`

### Zurückbauen oder neu schneiden

- `EditorForm` ohne RHF
- Upload-Verantwortung zu weit in die Apps geschoben
- fehlender standardisierter Cloudinary-Contract
- `mdast` im aktuellen halben Zustand
- unklare Dokumentation der MDX-/Preview-Pfade

### Nicht zurück auf reine Referenz-Parität

- nicht die ganze LMS-/Vault-Domainlogik ins Package ziehen
- nicht `@next/mdx` als Ersatz für `@mdx-js/mdx` im Live-Preview-Pfad erzwingen
- nicht die Referenzen blind kopieren, wenn der Package-Use-Case ein anderer ist
