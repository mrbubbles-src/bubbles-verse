# Markdown Packages Audit Report

Datum: 2026-04-15

Scope:
- `packages/markdown-editor`
- `packages/markdown-renderer`
- Referenzen in `portal-ref`, `lms-ref`, `to-be-integrated`, `apps/the-coding-vault`
- Offizielle Doku für Cloudinary, MDX, unified/remark/mdast, react-hook-form

Wichtig:
- Das ist bewusst ein Audit, keine Implementierung.
- Der Fokus ist: Was ist anders, warum ist es anders, ist es wirklich besser, und was sollte man ändern.

## Kurzfazit

Die Markdown-Pakete sind aktuell **kein reiner Port** der funktionierenden Referenzen. Sie sind eher ein Versuch, aus den Referenzen eine generische Library zu machen. Das ist an einigen Stellen sinnvoll, an anderen Stellen aber zu weit gegangen oder nicht sauber zu Ende gedacht.

Mein Gesamturteil:

- **Sinnvoll anders**:
  - `renderForm` als öffentlicher Escape Hatch
  - `plugins`/Tool-Subsetting im Editor
  - `@mdx-js/mdx` für Live-Preview und gespeicherte MDX-Strings
  - `unified` + `remark-parse` + `remark-gfm` für Markdown-Import

- **Fragwürdig anders**:
  - Default-`EditorForm` ohne `react-hook-form`
  - Cloudinary-Upload komplett app-owned, obwohl Contract und Env praktisch überall gleich sind
  - Runtime-MDX-Rendering als allgemeiner Package-Pfad, obwohl die Referenzen für echte Seiten eher App-/Next-MDX-Pfade nutzen
  - extra `mdast`-Dependency im Package, obwohl sie dort aktuell nicht importiert wird

- **Wahrscheinlich zurückschneiden / neu zuschneiden**:
  - Upload-Verantwortung sollte stärker im Package vorbereitet werden
  - Form-Architektur sollte wieder an Repo-Konventionen mit RHF ausgerichtet werden
  - MDX-/Preview-Pfade brauchen klarere Trennung: Editor-Live-Preview vs finale App-Renderpfade

## Quellen

### Lokale Referenzen

- [packages/markdown-editor/src/components/markdown-editor.tsx](./packages/markdown-editor/src/components/markdown-editor.tsx)
- [packages/markdown-editor/src/components/editor-form.tsx](./packages/markdown-editor/src/components/editor-form.tsx)
- [packages/markdown-editor/src/lib/convert-markdown-to-editor-js.ts](./packages/markdown-editor/src/lib/convert-markdown-to-editor-js.ts)
- [packages/markdown-editor/src/lib/editor-tools.ts](./packages/markdown-editor/src/lib/editor-tools.ts)
- [packages/markdown-renderer/src/mdx-renderer.tsx](./packages/markdown-renderer/src/mdx-renderer.tsx)
- [packages/markdown-renderer/src/default-components.tsx](./packages/markdown-renderer/src/default-components.tsx)
- [packages/markdown-renderer/src/components/markdown-image/markdown-image.tsx](./packages/markdown-renderer/src/components/markdown-image/markdown-image.tsx)
- [portal-ref/src/components/lms/markdown-editor/editor/editor.tsx](./portal-ref/src/components/lms/markdown-editor/editor/editor.tsx)
- [portal-ref/src/components/lms/markdown-editor/editor/editor-form.tsx](./portal-ref/src/components/lms/markdown-editor/editor/editor-form.tsx)
- [portal-ref/src/components/lms/markdown-editor/lib/convert-markdown-to-editor-js.ts](./portal-ref/src/components/lms/markdown-editor/lib/convert-markdown-to-editor-js.ts)
- [portal-ref/src/components/lms/markdown-editor/md-preview/md-preview-render.tsx](./portal-ref/src/components/lms/markdown-editor/md-preview/md-preview-render.tsx)
- [portal-ref/src/mdx-components.tsx](./portal-ref/src/mdx-components.tsx)
- [to-be-integrated/md-editor/markdown-editor/editor/editor.tsx](./to-be-integrated/md-editor/markdown-editor/editor/editor.tsx)
- [to-be-integrated/md-editor/markdown-editor/editor/editor-form.tsx](./to-be-integrated/md-editor/markdown-editor/editor/editor-form.tsx)
- [apps/the-coding-vault/components/layout/admin/editor/editor.tsx](./apps/the-coding-vault/components/layout/admin/editor/editor.tsx)
- [apps/the-coding-vault/components/layout/admin/editor/editor-form.tsx](./apps/the-coding-vault/components/layout/admin/editor/editor-form.tsx)
- [apps/the-coding-vault/app/api/vault/image-upload/route.ts](./apps/the-coding-vault/app/api/vault/image-upload/route.ts)

### Offizielle Doku

- MDX Getting Started: <https://mdxjs.com/docs/getting-started/>
- `@mdx-js/mdx`: <https://mdxjs.com/packages/mdx/>
- `@mdx-js/react`: <https://mdxjs.com/packages/react/>
- `@mdx-js/loader`: <https://mdxjs.com/packages/loader/>
- Next.js MDX guide / `@next/mdx`: <https://nextjs.org/docs/app/guides/mdx>
- unified: <https://unifiedjs.com/explore/package/unified/>
- remark-parse: <https://unifiedjs.com/explore/package/remark-parse/>
- mdast: <https://github.com/syntax-tree/mdast>
- Cloudinary Node upload docs: <https://cloudinary.com/documentation/node_image_and_video_upload>
- Cloudinary Upload API reference: <https://cloudinary.com/documentation/image_upload_api_reference>
- React Hook Form: <https://react-hook-form.com/>
- `useForm` docs: <https://react-hook-form.com/docs/useform>

## 1. Die Pakete sind konzeptionell etwas anderes als die Referenzen

Die Referenzen sind **App-Editoren**.

Das Paket ist ein **Library-Editor**.

Das ist der wichtigste Unterschied überhaupt.

Die Referenzen koppeln Editor, Form, Upload, Save-Mutationen, Domain-Status, Review-Flows und teils sogar Ticketing eng zusammen.

Das Paket versucht stattdessen:

- EditorJS-Shell zu kapseln
- Metadata-Form generisch zu halten
- Upload nur als Callback zu definieren
- Rendering in einem Renderer-Paket zu bündeln

Das ist als Bibliotheksidee legitim. Es erklärt fast alle Unterschiede.

Das Problem ist nicht, **dass** es anders ist.

Das Problem ist eher:

- es wurde nicht klar genug dokumentiert
- es ist nicht überall konsistent zu Ende gedacht
- dadurch fühlt es sich wie „randomly anders“ an statt wie eine saubere Produktentscheidung

## 2. Warum war die `EditorForm` in der Reference-App nicht sichtbar?

Die kurze Antwort:

Weil dort **gar nicht die Package-Default-Form** gerendert wurde.

Der Package-Editor macht hier bewusst:

- wenn `renderForm` gesetzt ist: nutze die App-Form
- sonst: nutze die Package-`EditorForm`

Siehe:
- [packages/markdown-editor/src/components/markdown-editor.tsx](./packages/markdown-editor/src/components/markdown-editor.tsx)

In der kleinen Reference-App wurde eine eigene Form übergeben.

Historisch war das in der Test-App so verdrahtet:
- `MarkdownEditorPanel` übergibt `renderForm`
- dadurch wird **nicht** die Package-`EditorForm` genutzt

Das ist also kein Fehler im Paket, sondern erwartetes Verhalten des API-Designs.

## 3. Warum ist die Package-`EditorForm` nicht mit `react-hook-form` gebaut?

### Was im Paket passiert

Die Package-Form ist mit lokalem `useState` gebaut:
- `description`
- `tagsText`
- `status`
- `title`
- `slug`
- `slugManuallyEdited`

Siehe:
- [packages/markdown-editor/src/components/editor-form.tsx](./packages/markdown-editor/src/components/editor-form.tsx)

### Was in den Referenzen passiert

Die Referenzen nutzen `react-hook-form`:
- [portal-ref/src/components/lms/markdown-editor/editor/editor-form.tsx](./portal-ref/src/components/lms/markdown-editor/editor/editor-form.tsx)
- [apps/the-coding-vault/components/layout/admin/editor/editor-form.tsx](./apps/the-coding-vault/components/layout/admin/editor/editor-form.tsx)

### Ist die neue Package-Lösung „besser“?

Mein Urteil: **eher nein**.

Nicht weil `useState` falsch wäre. Sondern weil:

- im Repo RHF klar der Standard ist
- die Form schon heute derived values hat
  - H1 -> `title`
  - `title` -> `slug`
  - Draft-Autosave
  - Session-Reset
- und genau für solche Fälle RHF die klarere Struktur bringt

### Vorteile der Package-Variante

- weniger Dependencies im Kopf
- kleiner für eine Minimalform
- für 4-5 Felder grundsätzlich ausreichend

### Nachteile der Package-Variante

- inkonsistent zum Rest des Repos
- mehr Handarbeit bei Reset / Dirty-State / Watch-Logik
- schwerer sauber zu erweitern
- schwächer bei Validierung und Custom Controls

### Bewertung

- **Besser?** Nein
- **Vertretbar?** Ja
- **Empfohlen für dieses Repo?** Nein, eher wieder RHF

### Änderungsvorschlag

Die Package-`EditorForm` sollte auf `react-hook-form` umgestellt werden.

Nicht um die LMS-Domain zurückzuholen, sondern um:

- konsistent zu sein
- Ableitungen klarer zu modellieren
- Autosave/Reset robuster zu machen
- Erweiterbarkeit offen zu halten

## 4. Cloudinary-Upload: gehört das eher in die Apps oder ins Package?

### Ist der aktuelle Package-Ansatz zulässig?

Ja.

Cloudinary empfiehlt für secret-bearing Uploads einen **serverseitigen** Flow.
In Next.js ist dafür ein Route Handler / API-Route ein normaler und sinnvoller Ort.

Das passt grundsätzlich zu:
- App-eigene Route
- Secret nur serverseitig
- Editor bekommt nur einen Uploader-Callback

### Warum fühlt es sich trotzdem falsch an?

Weil fast überall dieselben Dinge wiederholt werden:

- gleiche Env-Quellen
- gleiche Response-Form
- gleicher Cloudinary-SDK-Call
- gleicher Upload-Contract in EditorJS
- einzig der Ordnername oder ein paar Optionen ändern sich

Das ist ein klassischer Fall von:

- architektonisch „sauber getrennt“
- aber praktisch zu viel Copy-Paste

### Was machen die Referenzen?

Sie kapseln den Upload **appseitig**:

- `the-coding-vault`: eigene Next-Route
- `portal-ref`: Backend/API-Client-Pfad
- `to-be-integrated`: ebenso app-/backendnah

Das Package selbst besitzt keinen Upload-Serverpfad.

### Ist die neue Lösung „besser“?

Nur teilweise.

#### Vorteile

- App bleibt Herr über Auth, Folder, Policies
- Package bleibt backend-agnostisch
- funktioniert auch, wenn eine App gar kein Next-Route-Setup nutzt

#### Nachteile

- jede App baut den gleichen Upload neu
- höhere Inkonsistenz
- mehr Debugging-Aufwand
- die gleiche Cloudinary-Konfiguration driftet an mehreren Stellen

### Meine Bewertung

Der aktuelle Package-Ansatz ist **zu minimal**.

Nicht komplett falsch, aber für euren realen Monorepo-Use-Case zu dünn.

### Änderungsvorschlag

Am sinnvollsten wäre ein Mittelweg:

#### Im Package zentralisieren

- Typen
- Response-Contract
- Cloudinary-Config-Auflösung
- Upload-Helper / Factory
- ggf. Route-Helper für Next.js

Zum Beispiel konzeptionell:

- `createCloudinaryImageUploader({ folder, ...options })`
- `createCloudinaryUploadRouteHandler({ folder, ...options })`

#### In der App belassen

- welcher Folder
- evtl. Auth/ACL
- evtl. max file size / allowed formats

Das wäre aus meiner Sicht die beste Balance.

Nicht:
- „alles im Package und gar keine App-Verantwortung“

Sondern:
- „der technische Cloudinary-Standard im Package, die Policy in der App“

## 5. Sind deine Env-Variablen grundsätzlich falsch?

Nach allem, was wir gesehen haben: **nein**.

Die Werte selbst sind nicht das Grundproblem.

Aber aktuell gibt es im Repo **keinen sauber standardisierten Cloudinary-Env-Contract** über alle Apps hinweg.

Das führt dazu, dass dieselbe Sache mal funktioniert und mal nicht, obwohl es „eigentlich gleich“ aussieht.

### Bewertung

- **Die Env-Idee ist nicht falsch**
- **Die Standardisierung ist unzureichend**

### Änderungsvorschlag

Ein gemeinsamer Contract für alle Markdown-/Content-Flows:

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- optional `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` für Client-Bedarf

Und genau das sollte in Package-Doku + Helpern festgeschrieben werden.

## 6. `@mdx-js/mdx` vs `@mdx-js/loader` vs `@mdx-js/react` vs `@next/mdx`

Das ist der Kern deiner Irritation, und hier lohnt die Trennung.

### `@mdx-js/mdx`

Das ist der **Core-Compiler / Evaluator**.

Laut offizieller MDX-Doku ist das genau richtig, wenn man:

- MDX als String hat
- zur Laufzeit kompilieren will
- `evaluate()` nutzen will

Das passt sehr gut zu:

- gespeicherter MDX-String aus DB / JSON
- Live-Preview im Editor

### `@mdx-js/loader`

Das ist für **webpack/build-time Integration**.

Richtig, wenn:

- `.mdx`-Dateien importiert werden
- der Bundler sie beim Build kompiliert

Das ist **nicht** der richtige primitive Baustein für einen Editor, der zur Laufzeit String-MDX rendert.

### `@mdx-js/react`

Das ist die **React-Provider-/Context-Schicht** für MDX-Komponenten.

Sinnvoll, wenn man Komponenten über Kontext in normale MDX-Renders einspeisen will.

Für euren Package-Preview-Pfad ist das **nicht zwingend nötig**, wenn ihr `useMDXComponents` direkt an `evaluate()` gebt.

### `@next/mdx`

Das ist die **Next.js-Integration für Datei-basiertes MDX**.

Richtig für:

- `.mdx`-Dateien in Next-Projekten
- `mdx-components.tsx`
- Build-/Route-Integration

Nicht passend für:

- Editor-Live-Preview eines gespeicherten Strings

### Ist die Nutzung von `@mdx-js/mdx` im Package also falsch?

Nein.

Im Gegenteil:

Für **Live-Preview** und **gespeicherte MDX-Strings** ist `@mdx-js/mdx` die richtige Wahl.

### Was ist dann das eigentliche Problem?

Nicht das Paket selbst, sondern die fehlende **klare Trennung der Einsatzfälle**:

- Editor-Preview: `@mdx-js/mdx`
- Datei-basierte App-MDX-Seiten: `@next/mdx`
- optional Provider-Kontext: `@mdx-js/react`

### Bewertung

- `@mdx-js/mdx` im Package: **gut und passend**
- `@next/mdx` in Apps wie `the-coding-vault`: **gut und passend**
- `@mdx-js/loader` / `@mdx-js/react` zusätzlich: **nur sinnvoll, wenn der konkrete App-Pfad sie wirklich braucht**

## 7. Was sind `mdast`, `unified` und `remark-parse` und warum sind die da?

Die kurze Antwort:

Die kommen **nicht** aus dem MDX-Rendering.
Die kommen aus dem **Markdown-Import**.

### `unified`

Das ist das Processing-Framework.

### `remark-parse`

Das ist der Markdown-Parser für `unified`.

### `mdast`

Das ist der Markdown-AST-Typ / Tree-Format.

### Wofür braucht man das hier?

Für `convertMarkdownToEditorJs()`:

- Markdown-Text rein
- AST erzeugen
- daraus EditorJS-Blöcke bauen

Genau dafür ist dieser Stack gedacht.

### Ist das im Package falsch?

Nein.

Für den Importpfad ist das **absolut sinnvoll** und sogar direkt an den Referenzen orientiert.

### Was ist daran trotzdem auffällig?

In den Referenzen werden die `mdast`-Typen direkt importiert.

Im Package:

- sind viele AST-Typen lokal nachgebaut
- und gleichzeitig liegt `mdast` als Dependency drin
- obwohl `mdast` dort aktuell gar nicht importiert wird

Das wirkt wie ein halber Umbau.

### Bewertung

- `unified` + `remark-parse` + `remark-gfm`: **richtig**
- `mdast` als aktuelle Package-Dependency: **verdächtig / vermutlich unnötig in der jetzigen Form**

### Änderungsvorschlag

Entweder:

1. `mdast`-Typen sauber offiziell importieren wie in den Referenzen

oder

2. `mdast` aus den Package-Dependencies entfernen, wenn es nur ein Alt-Überbleibsel ist

Der jetzige Zustand ist unnötig irritierend.

## 8. Preview-/Renderer-Aufteilung: sinnvoll oder overengineered?

Die Pakete haben aktuell im Grunde drei Pfade:

1. Editor-Live-Preview im Editor
2. generischer `MdxRenderer`
3. Next-/App-MDX-Komponenten für echte Seiten

Die Referenzen sind hier einfacher, weil sie stark app-zentriert sind.

### Was im Package sinnvoll ist

Die Editor-Preview braucht einen client-sicheren Pfad.
Deshalb ist `previewComponents` als Split von `defaultComponents` technisch nachvollziehbar.

### Was daran fragwürdig ist

Es erhöht den Surface Area:

- `defaultComponents`
- `previewComponents`
- `MdxRenderer`
- App-`mdx-components.tsx`

Wenn das nicht sehr klar dokumentiert wird, fühlt es sich schnell wie unnötige Sonderlogik an.

### Bewertung

- technisch nachvollziehbar
- aber dokumentativ und architektonisch noch nicht sauber genug erklärt

### Änderungsvorschlag

Diese Trennung explizit als 3 verschiedene Modi dokumentieren:

1. **Editor live preview**
2. **runtime string rendering**
3. **file-based Next MDX rendering**

Solange das nicht klar ist, wirkt die aktuelle Lösung unnötig kompliziert.

## 9. `FormBeispiel`-Entfernung

Hier ist die Package-Richtung aus meiner Sicht nachvollziehbar.

Die Referenzen tragen `FormBeispiel` noch mit.
Das Paket hat es bewusst entfernt.

Das ist eine echte Produktentscheidung:

- weniger Legacy
- kleinerer Contract
- weniger Sonderfälle

### Bewertung

- **Besser**, wenn das Shared-Package ein sauberer Kern sein soll
- **Schlechter**, wenn ihr alte Referenzinhalte 1:1 ohne Migration weiter unterstützen wollt

Das ist kein „ist halt anders“, sondern eine echte Tradeoff-Entscheidung.

## 10. Was ist wirklich besser, was nur anders, was schlechter?

## Besser

- `@mdx-js/mdx` für Runtime-Preview und gespeicherte MDX-Strings
- `unified` / `remark-parse` für Markdown-Import
- `renderForm` als Package-API
- `plugins`/Tool-Subsetting
- `FormBeispiel` aus dem Shared-Contract zu entfernen

## Nur anders / neutral

- breiterer Bootstrap-Contract für `initialData`
- eigener generischer `MdxRenderer`
- `previewComponents` vs app-eigene MDX-Komponenten

## Schlechter / mindestens fragwürdig

- Package-`EditorForm` ohne RHF
- Upload-Contract zu app-lastig
- fehlender standardisierter Cloudinary-Contract
- `mdast` als Dependency ohne saubere Nutzung
- nicht klar genug dokumentierte Unterschiede zu den Referenzen

## 11. Meine Änderungsvorschläge

Keine Implementierung, nur Richtung.

### A. Form-Architektur

Empfehlung:

- Package-`EditorForm` auf `react-hook-form` umstellen
- bewusst minimal halten
- aber technisch an Repo-Konventionen angleichen

Nicht zurückholen:

- LMS-/Ticket-/Versionierungslogik ins Package

### B. Upload-Architektur

Empfehlung:

- Cloudinary-Upload-Helfer ins Package
- Route-/Uploader-Factory ins Package
- App gibt nur Folder + Policy an

Beispielhafte Richtung:

- `createCloudinaryImageUploader`
- `createCloudinaryUploadRouteHandler`

### C. Cloudinary-Config

Empfehlung:

- einen verbindlichen gemeinsamen Env-Contract definieren
- im Package dokumentieren
- optional kleine zentrale Validierung/helper

### D. Parser-Dependencies

Empfehlung:

- `unified` / `remark-parse` / `remark-gfm` behalten
- `mdast`-Nutzung bereinigen:
  - entweder sauber importieren
  - oder entfernen

### E. MDX-Strategie klar dokumentieren

Empfehlung:

- explizite Doku:
  - wann `@mdx-js/mdx`
  - wann `@next/mdx`
  - wann `@mdx-js/react`
  - wann gar nichts davon

### F. Referenz-Parität explizit entscheiden

Der wichtigste Meta-Punkt:

Es braucht eine klare Entscheidung, ob die Packages:

1. **paritätstreue Extraktion** der Referenzen sein sollen

oder

2. **bewusst generische Library-Kerne**

Aktuell wirken sie wie beides gleichzeitig.
Genau das erzeugt die Reibung.

## Meine Empfehlung als Zielbild

Wenn ich die Richtung festlegen müsste, würde ich Folgendes empfehlen:

### `@bubbles/markdown-editor`

Soll sein:

- generischer EditorJS-Kern
- generische RHF-Minimalform
- Import-/Preview-/Serializer-Logik
- standardisierte Upload-Helpers

Soll nicht sein:

- LMS-Domainlogik
- Ticketing
- Versionsworkflow
- app-spezifische Mutationen

### `@bubbles/markdown-renderer`

Soll sein:

- Shared-Renderer-Bausteine
- klar getrennt nach
  - preview-safe
  - server/runtime

Soll nicht sein:

- implizite Allzweck-Lösung für jede finale App-Renderingstrategie

### Apps

Sollen besitzen:

- `mdx-components.tsx`
- finale Seiten-Renderstrategie
- Save-Mutationen
- Domain-Formfelder
- Folder-/ACL-Policy

## Schlussurteil

Dein Bauchgefühl ist aus meiner Sicht berechtigt.

Nicht alles ist „falsch“.
Aber es gibt mehrere Stellen, an denen aus einer legitimen Generalisierung ein Zustand geworden ist, der:

- schlechter dokumentiert ist als nötig
- inkonsistenter ist als nötig
- und sich dadurch willkürlicher anfühlt, als er sein müsste

Der größte echte Diskussionspunkt ist für mich nicht `@mdx-js/mdx`.
Der ist fachlich ziemlich gut begründbar.

Die größeren Fragezeichen sind:

- warum die Form von RHF wegbewegt wurde
- warum Upload-Standardisierung nicht weiter ins Package gezogen wurde
- warum `mdast`/Parser-Thema nicht sauberer zu Ende modelliert wurde
- warum die Zielrichtung „paritätstreu vs generisch“ nicht explizit gemacht wurde

Wenn du danach sortieren willst, würde ich diese Reihenfolge empfehlen:

1. Produktentscheidung: Was sollen die Packages eigentlich sein?
2. `EditorForm`-Architektur
3. Upload-/Cloudinary-Standardisierung
4. Dependency-/MDX-Doku bereinigen
5. danach erst kleinere Verhaltensparitätsfragen
