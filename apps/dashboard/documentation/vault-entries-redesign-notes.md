# Vault Entries Redesign Notes

Stand: 2026-04-19
Route: `/vault/entries`
Status: laufendes Brainstorming, noch nicht final freigegeben

## Ziel

Die Eintragsseite soll die zentrale Verwaltungs- und Arbeitsliste für
Vault-Einträge sein.
Fokus ist UI/UX, nicht neue Funktionalität.

## Bereits aus dem bisherigen Gespräch klar

- Die globale Dashboard-Richtung gilt auch hier:
  - flat statt boxy
  - wenig Container
  - Hierarchie über Typografie, Abstand und Linien
  - Listen/Tabelle vor Karten
- Die aktuelle Darstellung wirkt wie eine Tabelle, ist aber UX-seitig nicht
  sauber genug als Tabelle umgesetzt.
- Es braucht eine Suche.
- Es braucht klare Header.
- Aktionen wie Bearbeiten, Löschen und Vorschau sind gewünscht.
- Die Seite darf nicht in eine riesige endlose Liste kippen.
- Pagination ist erwünscht bzw. das Thema muss ernsthaft gelöst werden.

## Bereits festgezogen

- `/vault/entries` wird eine echte Tabelle.
- Oberhalb der Tabelle gibt es eine Toolbar mit:
  - Suche
  - Filter
  - `Neuer Eintrag`
- Direkt sichtbare Zeilenaktionen:
  - Bearbeiten
  - Vorschau
  - Löschen
- Die Zeilenaktionen sollen als Icons erscheinen, nicht als Textlinks.
- `Vorschau` öffnet eine eigene Vorschauseite in einem neuen Tab.
- `Löschen` wird direkt vom Lösch-Icon aus ausgelöst.
- Danach folgt direkt der doppelte Bestätigungsdialog.
- Die Tabelle braucht nur diese Kernspalten:
  - Titel
  - Kategorie
  - Status
  - Zuletzt bearbeitet
  - Aktionen
- Die Titelspalte bekommt zusätzlich eine zweite Zeile mit der Beschreibung.
- Die Beschreibung wird gekürzt dargestellt.
- Die vollständige Beschreibung erscheint on hover.
- Unten gibt es klassische Pagination.
- Es soll eine Auswahl für `Items pro Seite` geben.
- Default für `Items pro Seite` soll voraussichtlich `20` sein.
- Pagination soll erst sichtbar werden, wenn die aktuelle Datenmenge die erste
  Seite bei der gewählten Seitengröße tatsächlich überschreitet.
- Die `Items pro Seite`-Auswahl und Pagination sind gute Kandidaten für eine
  wiederverwendbare `@bubbles/ui`-Komponente.
- Oberhalb der Tabelle steht zusätzlich eine kleine Kontextzeile wie:
  - `32 Einträge · 3 Entwürfe · 18 veröffentlicht`

## Offene Punkte

Noch zu klären:

- wie dicht oder offen die Tabelle visuell werden soll
