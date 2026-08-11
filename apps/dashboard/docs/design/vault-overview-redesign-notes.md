# Vault Overview Redesign Notes

Stand: 2026-04-19
Route: `/vault`
Status: laufendes Brainstorming, noch nicht final freigegeben

## Ziel

Die Vault-Übersicht soll eine klare Arbeitsübersicht für den Coding Vault sein.
Fokus ist UI/UX, nicht neue Funktionalität.

## Bereits aus dem bisherigen Gespräch klar

- Die globale Dashboard-Richtung gilt auch hier:
  - flat statt boxy
  - wenig Container
  - Hierarchie über Typografie, Abstand und Linien
  - Listen/Tabelle vor Karten, wenn es um Arbeits- oder Verwaltungsdaten geht
- Große Kachelbereiche wirken zu schwer.
- `Taxonomie` als Begriff ist unklar und ungeeignet.
- `Nächste Schritte` als große Karte ist fragwürdig.
- `Zuletzt bearbeitet` soll eher tabellarisch oder listenartig werden.

## Bereits festgezogen

- `/vault` ist eine echte Arbeitsübersicht für den Coding Vault.
- Die Seite nutzt dieselbe flache Designsprache wie `/`, aber klar
  vault-spezifisch.
- `/vault` soll keine Landingpage und kein bloßer Verteiler sein.
- Kein Intro-Block.
- Keine Hero-Fläche.
- Kein erklärender Einstiegstext.
- Die Seite startet direkt mit Arbeit.
- Zentrales Element ist eine gemeinsame Arbeitsfläche mit Tabs.
- Tabs:
  - `Offene Entwürfe`
  - `Zuletzt bearbeitet`
- Klick auf einen Eintrag springt direkt in den Editor.
- Direkte Aktionen oben rechts:
  - `Neuer Eintrag`
  - `Neue Kategorie`
- Es gibt keine große Kennzahlenfläche.
- Stattdessen nur eine kleine Statuszeile mit:
  - Entwürfen
  - veröffentlichten Einträgen
  - Kategorien
- Die konkrete Zielzeile ist:
  - `3 Entwürfe · 18 veröffentlicht · 12 Kategorien`
- `Taxonomie` soll als sichtbares Konzept aus dieser Seite verschwinden.
- `Nächste Schritte` soll als eigener Bereich verschwinden.

## Offene Punkte

Noch zu klären:

- wie die Arbeitsfläche visuell von `/` leicht unterschieden wird, ohne aus der
  flachen Sprache auszubrechen
