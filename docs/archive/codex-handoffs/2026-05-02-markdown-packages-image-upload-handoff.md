# Markdown-Packages / Image-Upload Handoff

Date: 2026-05-02  
Repo: `/Users/mrbubbles/dev/bubbles-verse`  
Branch: `new-app/dashboard`  
HEAD: `fb9033a` (`feat: enhance markdown rendering and dashboard styles`)

## Aktueller Status

Es gibt **kein aktives Codex-Goal-Objekt**. Der zuletzt bearbeitete
Arbeitsblock in dieser Session war:

- Shared-Markdown-Packages stabilisieren
- Cloudinary-Bild-Upload im `@bubbles/markdown-editor` verlässlich machen
- Client-/Preview-Rendering im `@bubbles/markdown-renderer` stabilisieren
- die temporäre Test-App `apps/markdown-reference` wieder vollständig entfernen

## Aktuelles Zielbild

Der gewünschte Stand für die Markdown-Packages ist aktuell:

- referenznahes Verhalten aus den funktionierenden Referenzprojekten
- aber als wiederverwendbare Packages geschnitten
- keine unnötig cleveren Neuinterpretationen
- Upload pro App über **eine dünne app-lokale Route**
- Bildordner pro Editor-Instanz über `imageFolder`
- Shared-Client-Uploader plus Shared-Server-Helper im Package
- funktionierende `markdown-*`-Komponenten nicht ohne guten Grund umbauen

## Bereits abgeschlossen

### 1. Markdown-Editor / Package-Seite

- `EditorForm` ist auf `react-hook-form` umgestellt.
- Die Default-Metadatenform ist bewusst klein gehalten:
  - `title`
  - `description`
  - `slug`
  - `status`
  - `tags`
- Slug-Baukasten ist vorhanden:
  - `generateSlug(...)`
  - `slugifySegment(...)`
  - `normalizeSlugPath(...)`
  - `joinSlugSegments(...)`
  - `slugStrategy`
  - `slugStrategyContext`
- Die Editor-Live-Preview wurde auf einen referenznahen, stabileren
  Compile-Pfad umgestellt.
- Der ursprüngliche Scroll-/Preview-Jump wurde behoben.
- `FormBeispiel` wurde bewusst entfernt und ist kein Teil des Contracts mehr.

### 2. Bild-Upload

- Shared-Client-Uploader existiert:
  [`packages/markdown-editor/src/lib/create-image-uploader.ts`](/Users/mrbubbles/dev/bubbles-verse/packages/markdown-editor/src/lib/create-image-uploader.ts)
- Shared-Server-Helper existiert:
  [`packages/markdown-editor/src/server/cloudinary-upload.ts`](/Users/mrbubbles/dev/bubbles-verse/packages/markdown-editor/src/server/cloudinary-upload.ts)
- Kompatibilitäts-Wrapper existiert weiterhin:
  [`packages/markdown-editor/src/server/cloudinary-upload-route.ts`](/Users/mrbubbles/dev/bubbles-verse/packages/markdown-editor/src/server/cloudinary-upload-route.ts)

Wichtige technische Erkenntnis:

- Der Cloudinary-Node-SDK-Streampfad `upload_stream(...)` war unter Bun für
  manche gültigen PNG-Dateien unzuverlässig.
- Symptom: `Upload preset must be specified when using unsigned upload`
- Ursache: dieselbe Datei konnte unter Bun im SDK-Stream als unsigned
  fehlklassifiziert werden.
- Finaler Fix:
  - Blob-Uploads clientseitig zu echten `File`-Objekten normalisieren
  - serverseitig den **signierten REST-Upload** an Cloudinary per `fetch`
    nutzen statt den SDK-Streampfad

Diese Erkenntnisse sind paketnah dokumentiert:

- [`packages/markdown-editor/docs/image-upload-findings.md`](/Users/mrbubbles/dev/bubbles-verse/packages/markdown-editor/docs/image-upload-findings.md)

### 3. Markdown-Renderer / Preview

- `MdxRenderer` rendert jetzt standardmäßig mit dem client-sicheren
  `previewComponents`-Registry, nicht mehr mit dem async Server-Image-Pfad.
- Dadurch tritt der Fehler
  `<MarkdownImage> is an async Client Component`
  im clientseitigen Preview-Pfad nicht mehr auf.

### 4. Test-App entfernt

- `apps/markdown-reference` wurde vollständig aus dem Repo entfernt.
- Alle Verweise darauf wurden ebenfalls entfernt.
- `rg "markdown-reference"` liefert keine Repo-Treffer mehr.

## Wichtige Dateien aus dieser Session

### Direkt geändert

- [`packages/markdown-editor/src/lib/create-image-uploader.ts`](/Users/mrbubbles/dev/bubbles-verse/packages/markdown-editor/src/lib/create-image-uploader.ts)
- [`packages/markdown-editor/src/server/cloudinary-upload.ts`](/Users/mrbubbles/dev/bubbles-verse/packages/markdown-editor/src/server/cloudinary-upload.ts)
- [`packages/markdown-editor/src/server/cloudinary-upload-route.ts`](/Users/mrbubbles/dev/bubbles-verse/packages/markdown-editor/src/server/cloudinary-upload-route.ts)
- [`packages/markdown-editor/src/index.ts`](/Users/mrbubbles/dev/bubbles-verse/packages/markdown-editor/src/index.ts)
- [`packages/markdown-editor/package.json`](/Users/mrbubbles/dev/bubbles-verse/packages/markdown-editor/package.json)
- [`packages/markdown-editor/tests/editor/create-image-uploader.test.ts`](/Users/mrbubbles/dev/bubbles-verse/packages/markdown-editor/tests/editor/create-image-uploader.test.ts)
- [`packages/markdown-editor/tests/server/cloudinary-upload.test.ts`](/Users/mrbubbles/dev/bubbles-verse/packages/markdown-editor/tests/server/cloudinary-upload.test.ts)
- [`packages/markdown-editor/tests/server/cloudinary-upload-route.test.ts`](/Users/mrbubbles/dev/bubbles-verse/packages/markdown-editor/tests/server/cloudinary-upload-route.test.ts)
- [`packages/markdown-editor/README.md`](/Users/mrbubbles/dev/bubbles-verse/packages/markdown-editor/README.md)
- [`packages/markdown-editor/CHANGELOG.md`](/Users/mrbubbles/dev/bubbles-verse/packages/markdown-editor/CHANGELOG.md)
- [`packages/markdown-editor/docs/image-upload-findings.md`](/Users/mrbubbles/dev/bubbles-verse/packages/markdown-editor/docs/image-upload-findings.md)
- [`packages/markdown-renderer/src/mdx-renderer.tsx`](/Users/mrbubbles/dev/bubbles-verse/packages/markdown-renderer/src/mdx-renderer.tsx)
- [`packages/markdown-renderer/__tests__/mdx-renderer.test.tsx`](/Users/mrbubbles/dev/bubbles-verse/packages/markdown-renderer/__tests__/mdx-renderer.test.tsx)
- [`packages/markdown-renderer/README.md`](/Users/mrbubbles/dev/bubbles-verse/packages/markdown-renderer/README.md)
- [`packages/markdown-renderer/CHANGELOG.md`](/Users/mrbubbles/dev/bubbles-verse/packages/markdown-renderer/CHANGELOG.md)
- [`markdown-packages-manifest-2026-04-16.md`](/Users/mrbubbles/dev/bubbles-verse/markdown-packages-manifest-2026-04-16.md)
- [`README.md`](/Users/mrbubbles/dev/bubbles-verse/README.md)
- [`CHANGELOG.md`](/Users/mrbubbles/dev/bubbles-verse/CHANGELOG.md)

### Entfernt

- `apps/markdown-reference/` komplett

### Wichtig untersucht, aber nicht als Produktcode übernommen

- [`apps/the-coding-vault/app/api/vault/image-upload/route.ts`](/Users/mrbubbles/dev/bubbles-verse/apps/the-coding-vault/app/api/vault/image-upload/route.ts)
- [`apps/the-coding-vault/components/layout/admin/editor/editor.tsx`](/Users/mrbubbles/dev/bubbles-verse/apps/the-coding-vault/components/layout/admin/editor/editor.tsx)
- [`portal-ref/src/components/lms/markdown-editor/editor/editor.tsx`](/Users/mrbubbles/dev/bubbles-verse/portal-ref/src/components/lms/markdown-editor/editor/editor.tsx)
- [`portal-ref/src/hooks/useLmsTopics.ts`](/Users/mrbubbles/dev/bubbles-verse/portal-ref/src/hooks/useLmsTopics.ts)
- [`backend-ref/_lms/controller/moduleController.js`](/Users/mrbubbles/dev/bubbles-verse/backend-ref/_lms/controller/moduleController.js)
- [`backend-ref/_lms/router/lmsRouter.js`](/Users/mrbubbles/dev/bubbles-verse/backend-ref/_lms/router/lmsRouter.js)
- `@editorjs/image`-README in `node_modules`

## Bereits gelaufene Commands / Tests / Checks

### Git / Repo / Diagnose

- `git branch --show-current`
- `git status --short`
- `git log --oneline -n 10`
- `git rev-parse --short HEAD`
- `rg -n "markdown-reference" ...`
- `find ... documentation ...`

### Markdown-Editor / Renderer Tests

Mehrfach im Verlauf der Session:

- `bun run --cwd /Users/mrbubbles/dev/bubbles-verse/packages/markdown-editor test`
- `bun run --cwd /Users/mrbubbles/dev/bubbles-verse/packages/markdown-editor typecheck`
- `bun run --cwd /Users/mrbubbles/dev/bubbles-verse/packages/markdown-renderer test`
- `bun run --cwd /Users/mrbubbles/dev/bubbles-verse/packages/markdown-renderer typecheck`

Historisch zusätzlich vor dem Entfernen der Test-App:

- `bun run --cwd /Users/mrbubbles/dev/bubbles-verse/apps/markdown-reference test`
- `bun run --cwd /Users/mrbubbles/dev/bubbles-verse/apps/markdown-reference typecheck`

### Bild-Upload-Diagnose

- direkter Upload gegen `/api/image-upload` per `curl`
- direkter Upload per Bun `fetch + FormData`
- Vergleich von `File` vs `Blob`
- Vergleich kleine Testdatei vs echte größere PNG-Datei
- `file ...`
- `sips -g format -g pixelWidth -g pixelHeight -g space ...`
- `md5 ...`
- `mdfind -name useReducer_infographic.png`
- direkter Cloudinary-SDK-Test unter Bun
- direkter Cloudinary-SDK-Test unter Node
- direkter signierter REST-Upload an Cloudinary per `fetch`
- `tail` auf Next-Entwicklungslogs der damaligen Test-App

### Lockfile / Workspace

- `bun install`

## Bekannte Fehler, Warnungen oder aktuell fehlschlagende Checks

### Aktuell

- Keine bekannten aktuell fehlschlagenden Paket-Tests aus dieser Session.
- Kein bekannter verbleibender `markdown-reference`-Rest im Repo.

### Historisch wichtig

Diese Fehler traten auf und wurden behoben:

- `Upload preset must be specified when using unsigned upload`
- `<MarkdownImage> is an async Client Component`

Historische, nicht mehr priorisierte Nebenwarnung aus der entfernten Test-App:

- `EventDispatcher .off(): there is no subscribers for event "redactor dom changed"`

Da die App entfernt wurde, ist diese Warnung aktuell nicht mehr die relevante
Arbeitsgrundlage.

## Offene Entscheidungen

1. **Welche echte Consumer-App ist die nächste Validierungsfläche?**
   - Wahrscheinlich `apps/the-coding-vault`
   - eventuell später `apps/dashboard`

2. **Soll `createCloudinaryUploadRoute(...)` als Compatibility-Wrapper bleiben?**
   - Er ist aktuell noch da.
   - Der bevorzugte Schnitt ist inzwischen aber:
     app-lokale Route + Shared-Helper.

3. **Soll `MdxRenderer` dauerhaft client-first über `previewComponents` laufen?**
   - Für die aktuellen Fehlerpfade war das richtig.
   - In einer späteren echten Consumer-App sollte noch einmal geprüft werden,
     ob ein server-spezifischer alternativer Renderpfad zusätzlich sinnvoll ist.

4. **Wie weit soll die Package-Standardisierung im nächsten Schritt gehen?**
   - nur reale Integrationen nachziehen
   - oder weitere API-Bereinigung / Cleanup

## Constraints, Nutzerpräferenzen und Do-not-touch-Bereiche

### Harte Repo-/Prozessregeln

Aus `AGENTS.md` relevant:

- Next.js-Wissen nicht aus Erinnerung ableiten, sondern lokale Doku prüfen
- extrem knapp kommunizieren
- Tests aktuell halten
- Doku und Changelog paketnah pflegen
- bei deutschem Text Umlaute nutzen
- keine unnötig cleveren Lösungen
- keine großen Umbauten ohne gute Begründung

### Session-spezifische Nutzerpräferenzen

- Referenzverhalten möglichst 1:1 übernehmen, wenn es schon funktioniert.
- Nicht „verschlimmbessern“.
- Funktionierende `markdown-*`-Komponenten möglichst in Ruhe lassen.
- Größere Umbauten immer erst mit dem Nutzer abstimmen.
- Offizielle Doku immer mitprüfen.
- Repo-Standards gehen vor Referenzabweichungen, wenn im Monorepo bereits ein
  klarer Standard existiert.
- Cloudinary-Env-Standard:
  - `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
  - `NEXT_PUBLIC_CLOUDINARY_API_KEY`
  - `CLOUDINARY_API_SECRET`

### Do-not-touch / Vorsicht

- `apps/markdown-reference` nicht wieder als dauerhafte Lösung einführen.
  Das war bewusst nur eine temporäre Testfläche.
- Keine großen API- oder Architekturumbauten an den Markdown-Packages ohne
  erneute Abstimmung.
- Keine unnötige zweite Implementierung funktionierender Renderer-Bausteine.

## Die nächsten 3–7 konkreten Schritte

1. **Nächste echte Consumer-App auswählen**
   - bevorzugt `apps/the-coding-vault`
   - dort den Shared-Editor nicht theoretisch, sondern real integrieren

2. **Thin Upload Route in der Consumer-App anschließen**
   - eine app-lokale Route
   - `imageFolder` validieren
   - Shared-Server-Helper nutzen

3. **Echten End-to-End-Flow in der Consumer-App verifizieren**
   - Bild hochladen
   - speichern
   - erneut laden
   - gerenderten Inhalt prüfen

4. **Slug-/Metadaten-Strategie in der Consumer-App finalisieren**
   - prüfen, ob die Package-Default-Form reicht
   - oder ob `renderForm` nötig ist

5. **Entscheiden, ob der Compatibility-Wrapper bleibt**
   - `createCloudinaryUploadRoute(...)`
   - behalten oder später entfernen/deprecaten

6. **Manifest und Paket-Doku nur bei echter Folgearbeit weiterziehen**
   - keine abstrakte Theoriearbeit mehr
   - nur reale Integrations-Findings zurück in die Doku

## Aktueller Working-Tree-Stand

Zum Zeitpunkt dieses Handoffs:

- `git status --short` zeigt nur das untracked Handoff-Verzeichnis
  `docs/codex-handoffs/`
- aus dieser Session sind keine anderen offenen Working-Tree-Diffs sichtbar

## Reaktivierungs-Prompt für einen frischen Codex-Chat

```text
Arbeite im Repo /Users/mrbubbles/dev/bubbles-verse auf Branch new-app/dashboard weiter.

Lies zuerst:
1. /Users/mrbubbles/dev/bubbles-verse/AGENTS.md
2. /Users/mrbubbles/dev/bubbles-verse/markdown-packages-manifest-2026-04-16.md
3. /Users/mrbubbles/dev/bubbles-verse/docs/codex-handoffs/2026-05-02-markdown-packages-image-upload-handoff.md
4. /Users/mrbubbles/dev/bubbles-verse/packages/markdown-editor/docs/image-upload-findings.md
5. /Users/mrbubbles/dev/bubbles-verse/packages/markdown-editor/README.md
6. /Users/mrbubbles/dev/bubbles-verse/packages/markdown-renderer/README.md

Wichtige Regeln:
- referenznah arbeiten
- keine unnötigen Refactors
- große Umbauten vorab mit dem Nutzer abstimmen
- offizielle Doku und Repo-Standards prüfen
- bei deutschem Text Umlaute nutzen

Status:
- markdown-reference ist bewusst komplett entfernt
- Shared-Bild-Upload nutzt Blob->File-Normalisierung clientseitig
- Shared-Server-Upload nutzt signierten Cloudinary-REST-Upload statt SDK-Stream
- MdxRenderer nutzt client-safe previewComponents als Default

Nächster sinnvoller Schritt:
- die nächste echte Consumer-App für die Markdown-Packages auswählen, sehr
  wahrscheinlich apps/the-coding-vault, und dort Upload/Save/Render wirklich
  integrieren und verifizieren.
```
