# Vault Categories Redesign Notes

Stand: 2026-04-19
Route: `/vault/categories`
Status: laufendes Brainstorming, noch nicht final freigegeben

## Ziel

Die Kategorienseite soll die strukturierte Verwaltung der Vault-Kategorien
abbilden.
Fokus ist UI/UX, nicht neue Funktionalität.

## Bereits aus dem bisherigen Gespräch klar

- Die globale Dashboard-Richtung gilt auch hier:
  - flat statt boxy
  - wenig Container
  - Hierarchie über Typografie, Abstand und Linien
  - Verwaltungsdaten eher als Listen/Tabelle statt Karten
- Der aktuelle Kategorienbaum wirkt unübersichtlich.
- Dauerhaft sichtbare Formulare im Baum sind unerwünscht.
- Große Karten in Karten sind unerwünscht.
- `Neue Kategorie` soll eher über einen Button plus Dialog entstehen.
- Dialogmuster sind auch hier gute Kandidaten für `@bubbles/ui`.
- Suche/Filter-Toolbar ist ebenfalls ein guter Kandidat für `@bubbles/ui`.

## Bereits festgezogen

- `/vault/categories` wird primär eine flache hierarchische Liste.
- Kein schweres Baum-UI.
- Hierarchie bleibt sichtbar über:
  - Einrückung
  - Eltern-/Kind-Kennzeichnung
- Gruppen dürfen optional auf- und zugeklappt werden.
- `Neue Kategorie` wird über einen klaren Button plus Dialog angelegt.
- Bearbeiten läuft ebenfalls über Dialoge.
- Sichtbare Informationen pro Zeile:
  - Name
  - Beschreibung
  - Parent/Level
  - Anzahl Einträge
  - Aktionen
- Direkte Zeilenaktionen:
  - Bearbeiten
  - Unterkategorie anlegen
  - Löschen
- `Löschen` läuft direkt vom Lösch-Icon in den doppelten Bestätigungsdialog.
- Oberhalb der Liste gibt es eine Toolbar mit:
  - Suche
  - Filter
- Zusätzlich gibt es eine kleine Statuszeile wie:
  - `12 Kategorien · 7 Oberkategorien · 5 Unterkategorien`

## Offene Punkte

Noch zu klären:

- wie offen oder dicht die Listenzeilen visuell ausfallen sollen
