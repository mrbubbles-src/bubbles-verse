# Vault Entry Editor Redesign Notes

Stand: 2026-04-19
Routes:
- `/vault/entries/new`
- `/vault/entries/[id]`
Status: laufendes Brainstorming, noch nicht final freigegeben

## Ziel

Die Eintragsseiten sollen echte Arbeitsseiten für Erstellen und Bearbeiten
bleiben.
Fokus ist UI/UX, nicht neue Funktionalität.

## Bereits aus dem bisherigen Gespräch klar

- Die Editor-Seiten sollen bewusst eigene Seiten bleiben.
- Es muss klar sein, wie man zwischen Erstellen und Bearbeiten navigiert, ohne
  Fortschritt zu verlieren.
- Aktuell sind zu viele Klicks nötig.
- Löschen soll nicht erst versteckt im Inneren der Seite auffallen.
- `Als Entwurf duplizieren` wurde als fragwürdig markiert.
- Browser-native Alerts für Löschaktionen sind unerwünscht.
- Stattdessen gilt die globale Dialog-Regel mit doppelter Bestätigung.

## Bereits festgezogen

- `new` und `edit` bleiben visuell fast dieselbe Arbeitsseite.
- Der Unterschied wird über Kontext, Titel und Aktionen klar gemacht.
- Oberer Kontextbereich zeigt:
  - Titel
  - Status
  - Kategorie
- `new` heißt im Kopf schlicht `Neuer Eintrag`.
- `edit` zeigt `Eintrag bearbeiten` plus den eigentlichen Eintragstitel.
- Kleine Kontextzeile für `edit`:
  - `Status · Kategorie`
- Seitenaktionen sitzen oben rechts.
- Die bestehende Editor-Vorschau im Paket bleibt erhalten.
- Zusätzlich gibt es eine `Vorschau` im neuen Tab.
- `Löschen` verschwindet komplett aus den Editor-Seiten.
- `Löschen` gehört auf die Eintragsliste.
- `Als Entwurf duplizieren` fliegt komplett raus.
- Breadcrumbs reichen als Rücknavigation.
- Das bestehende Editor-Paket bleibt inhaltlich und strukturell erhalten:
  - Editor
  - Side-by-side Preview
  - Metadaten-Form
- Diese Teile sollen nicht neu erfunden oder doppelt modelliert werden.
- Das Redesign betrifft vor allem:
  - den oberen Kopfbereich
  - die Seitenaktionen
  - die Einbettung in den vorhandenen Platz
  - die Sidebar-Navigation für Drafts
- Im Seiteninhalt selbst soll keine zusätzliche mockige Sidebar oder
  Hilfsleiste eingebaut werden.
- Die Sidebar-Draft-Navigation gehört zur echten App-Sidebar, nicht als
  zweites Panel in den Seiteninhalt.
- Der Kopfbereich soll deutlich flacher sein:
  - Titel eher als echte Überschrift statt eigener Box
  - Kategorie eher als Badge/Pill statt als eigenes Kasten-Element
  - Status und Kategorie knapp und textnah
- Für `edit` ist die bevorzugte Hierarchie:
  - klein `Eintrag bearbeiten`
  - darunter der Titel als größte Überschrift
  - daneben oder darunter knapper Status-/Kategorie-Kontext
- Vorhandener Platz soll besser genutzt werden.
- Die Seite soll nicht unnötig gequetscht oder in zusätzliche Boxen zerlegt
  werden.
- Das vorhandene Editor-Paket soll die Breite der Seite wirklich nutzen dürfen.
- Für die neue Tab-Vorschau kann später das vorhandene Markdown-Renderer-Paket
  genutzt werden, das im Dashboard bisher noch nicht integriert ist.

## Sidebar-Navigation

- Wenn ein neuer Eintrag erstellt wird, soll unter `Einträge` ein eigener,
  eingerückter Navigationspunkt für diesen Arbeitszustand erscheinen.
- Wenn ein bestehender Eintrag bearbeitet wird, soll ebenfalls unter
  `Einträge` ein eigener, eingerückter Navigationspunkt erscheinen.
- Diese temporären Punkte sollen den schnellen Wechsel zwischen
  Eintragsliste, neuem Eintrag und bearbeitetem Eintrag ermöglichen.
- Ziel ist, laufende Arbeit kurz unterbrechen und direkt wieder aufnehmen zu
  können, ohne den Faden zu verlieren.
- Schlichte Benennung reicht:
  - `Neuer Eintrag (Draft)`
  - `Eintrag bearbeiten (Draft)`
- Beide temporären Sidebar-Punkte sollen ein kleines Lösch-/Schließen-Icon
  haben.
- Diese Aktion entfernt den lokalen Draft aus dem localStorage und schließt den
  temporären Sidebar-Punkt.
- Bei bestehenden Einträgen bedeutet das ausdrücklich nur:
  - lokalen Bearbeitungsstand verwerfen
  - nicht den echten Eintrag löschen

## Draft-Verhalten

- Der aktuelle Stand deutet darauf hin, dass Editor-Drafts bereits lokal
  zwischengespeichert werden.
- Für bestehende Einträge wird der Draft pro Eintrag-ID isoliert.
- Für `Neuer Eintrag` gibt es aktuell einen gemeinsamen Create-Draft-Scope.
- Das heißt:
  - Edit-Drafts pro bestehendem Eintrag sind klar voneinander getrennt.
  - Für neue Einträge existiert aktuell ein gemeinsamer Draft-Kontext statt
    mehrerer paralleler Create-Drafts.
- Die Sidebar-Idee passt sehr gut zu diesem Arbeitsmodell und kann die
  Wiederaufnahme deutlich klarer machen.

## Offene Punkte

Noch zu klären:

- wie die temporären Sidebar-Punkte genau benannt werden sollen
- ob für `Neuer Eintrag` langfristig auch mehrere parallele Create-Drafts
  unterstützt werden sollen
- wie genau der flache obere Kopfbereich visuell geschnitten wird
