# Bild-Upload-Findings

Diese Notiz hält die konkreten Erkenntnisse fest, die nötig waren, um den
Bild-Upload im Shared-Editor stabil zum Laufen zu bringen.

Sie ist bewusst praktisch gehalten:

- welches Verhalten kaputt war
- was sich als falsche Fährte herausgestellt hat
- was die tatsächliche Ursache war
- warum die aktuelle Lösung genau so gebaut ist

## Kurzfassung

Der funktionierende Ziel-Schnitt ist:

- pro App genau **eine** dünne Next.js-Route für Bild-Uploads
- pro Editor-Instanz ein `imageFolder`
- ein Shared-Client-Uploader im Package
- ein Shared-Server-Helper im Package

Der kritische technische Punkt:

- EditorJS kann Uploads nicht nur als klassische `File`-Objekte anstoßen,
  sondern je nach Browserfluss auch als `Blob`
- der Cloudinary-Node-SDK-Streampfad (`upload_stream`) wurde unter Bun bei
  bestimmten gültigen PNG-Dateien als **unsigned** behandelt
- dieselben Dateien funktionierten als **signierter REST-Upload** sofort

Deshalb besteht der finale Fix aus zwei Teilen:

1. Blob-Uploads werden vor dem `fetch` zu echten `File`-Objekten normalisiert.
2. Der Server-Helper nutzt den signierten Cloudinary Upload-API-Request per
   `fetch` statt den SDK-Streampfad.

## Symptome

Die sichtbaren Fehler waren:

- EditorJS meldete `Block «image» skipped because saved data is invalid`
- der Upload-Request auf `/api/image-upload` endete mit `400`
- Cloudinary antwortete mit
  `Upload preset must be specified when using unsigned upload`

Wichtig:

- derselbe Upload funktionierte teilweise per direktem Test gegen dieselbe
  Route
- dadurch wirkte der Fehler zuerst wie ein EditorJS- oder Browserproblem
- tatsächlich war der Fehler nur mit bestimmten Dateien reproduzierbar

## Was nicht die Ursache war

Folgende Vermutungen wurden geprüft und verworfen:

### 1. Falsche oder fehlende Env-Variablen

Die Env-Werte wurden in der Route korrekt gelesen:

- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- `NEXT_PUBLIC_CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

Damit war klar:

- die App sieht die Cloudinary-Konfiguration
- das Package läuft im selben Next.js-Serverprozess
- die Monorepo-Grenze war nicht das Problem

### 2. Falsche Next.js-Route-Architektur

Die offizielle Next.js-Doku für App-Router-Route-Handler bestätigt, dass
`Request`/`Response` als Basis völlig korrekt sind. `NextRequest` und
`NextResponse` sind Erweiterungen, aber nicht die Ursache dieses Fehlers.

### 3. Falscher Folder- oder Query-Ansatz

Der Folder selbst war nicht das Problem. Entscheidend war nur, dass:

- der Folder pro Editor-Instanz mitgegeben wird
- die App-Route ihn validiert

Deshalb bleibt `imageFolder` als explizites Feld im Multipart-Body der
bevorzugte Contract.

## Was tatsächlich die Ursache war

Die entscheidende Beobachtung war:

- eine kleine Testdatei funktionierte
- eine echte größere PNG-Datei wie `useReducer_infographic.png` scheiterte
- dieselbe Datei scheiterte reproduzierbar über
  `cloudinary.uploader.upload_stream(...)` unter Bun
- dieselbe Datei funktionierte
  - über den offiziell signierten REST-Upload an Cloudinary
  - und über den SDK-Pfad unter Node

Damit war klar:

- der Fehler sitzt nicht im Editor
- nicht in der Next.js-Route
- nicht in der Folder-Validierung
- sondern im Zusammenspiel aus **Bun + Cloudinary SDK Stream Upload**

Cloudinary behandelte diese Requests dabei effektiv als unsigned und verlangte
deshalb ein `upload_preset`.

## Finale Architekturentscheidung

### Client

Der Shared-Client-Uploader in
[`src/lib/create-image-uploader.ts`](../src/lib/create-image-uploader.ts)
macht jetzt zwei Dinge:

- baut den standardisierten `FormData`-Body
- normalisiert `Blob` zu einem echten `File` mit stabilem Dateinamen

Warum:

- `@editorjs/image` dokumentiert `uploadByFile(file: File)`
- Clipboard- und Drag-and-drop-Flows können trotzdem Blob-artige Werte liefern
- ein echter Dateiname hält den Request näher am funktionierenden Referenzpfad

### Server

Der Shared-Server-Helper in
[`src/server/cloudinary-upload.ts`](../src/server/cloudinary-upload.ts)
nutzt jetzt bewusst **nicht** mehr `cloudinary.uploader.upload_stream(...)`.

Stattdessen:

- signierte Upload-Parameter erzeugen
- Multipart-Request mit `fetch` an
  `https://api.cloudinary.com/v1_1/<cloud>/image/upload`
  schicken

Warum:

- das ist der dokumentierte signierte Uploadpfad
- er funktioniert stabil unter Bun
- er hält dieselbe Sicherheitsgrenze ein
- er ist leichter reproduzierbar und debugbar als der fehlerhafte SDK-Stream

## Gewollter Integrationsschnitt

Neue Integrationen sollen diesen Schnitt verwenden:

1. App-lokale Route
2. Shared-Client-Uploader aus dem Package
3. Shared-Server-Helper aus dem Package

Nicht gewollt:

- pro Editor-Einsatz eine neue Route
- eine große generische Upload-Factory als Primärmodell
- Copy-and-paste von vollständigen Cloudinary-Uploads in jede App

Stattdessen:

- eine Route pro App
- `imageFolder` pro Editor-Instanz
- dünne app-lokale Validierung

## Warum `imageFolder` im Multipart-Body liegt

Der Folder wird bewusst als `FormData`-Feld gesendet und nicht als Query-Param.

Gründe:

- passt natürlicher zum Multipart-Upload
- weniger URL-/Encoding-Gefummel
- einfacher gemeinsam mit der Datei zu validieren
- näher an einem klaren Request-Contract

## Was bei späteren Änderungen unbedingt zu beachten ist

Wenn der Bild-Upload erneut angefasst wird, dann zuerst diese Punkte prüfen:

1. Kommt aus dem Client wirklich ein `File` mit `name`, `size` und `type` an?
2. Nutzt der Server weiterhin den signierten REST-Upload und nicht wieder den
   SDK-Streampfad?
3. Wird `imageFolder` app-seitig validiert?
4. Werden die Repo-Standard-Env-Variablen genutzt?
5. Ist der Fehler nur mit bestimmten Dateien reproduzierbar?

Wenn ein Fehler nur bei einzelnen Dateien auftritt, zuerst immer prüfen:

- Dateiformat
- Dateigröße
- ob der Fehler unter Bun und Node gleich ist
- ob derselbe Upload per direktem REST-Request funktioniert

## Relevante Dateien

- Client-Uploader:
  [`src/lib/create-image-uploader.ts`](../src/lib/create-image-uploader.ts)
- Server-Helper:
  [`src/server/cloudinary-upload.ts`](../src/server/cloudinary-upload.ts)
- Kompatibilitäts-Wrapper:
  [`src/server/cloudinary-upload-route.ts`](../src/server/cloudinary-upload-route.ts)
- App-seitige Referenzroute:
  eine dünne Next.js-Route pro App, die `imageFolder` validiert und danach den
  Shared-Server-Helper aufruft

## Offizielle Doku, gegen die geprüft wurde

- Next.js Route Handlers
- Next.js Environment Variables
- Cloudinary Upload API
- Cloudinary signed uploads
- `@editorjs/image`-Uploader-Contract

Diese Doku muss bei späteren Umbauten erneut geprüft werden. Nicht von
veralteter Tool- oder Modell-Erinnerung ausgehen.
