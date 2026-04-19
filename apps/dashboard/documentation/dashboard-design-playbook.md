# Dashboard Design Playbook

Stand: 2026-04-19
Status: abgestimmte Designrichtung für die Dashboard-Überarbeitung

## Ziel

Dieses Dokument bündelt die gemeinsam festgezogene Designrichtung für das
Dashboard, damit die Umsetzung über alle Seiten konsistent bleibt.

Die Überarbeitung ist primär ein UI/UX-Redesign.
Die bestehende Funktionalität soll weitgehend erhalten bleiben.

## Binding Rules

- Die Regeln aus [AGENTS.md](/Users/mrbubbles/dev/bubbles-verse/AGENTS.md)
  bleiben bindend und müssen bei der Umsetzung mit befolgt werden.
- Besonders wichtig für diese Arbeit:
  - mobile first
  - bestehende Repo-Regeln und vorhandene Pakete respektieren
  - keine unnötigen Wrapper
  - bestehende Farben, Tokens und Stilentscheidungen verwenden
  - nicht unnötig neue Funktionalität erfinden

## Implementation Workflow

Für die spätere Umsetzung gilt zusätzlich dieser Arbeitsmodus:

- Es dürfen und sollen unterschiedliche Subagents genutzt werden.
- Jeder Subagent bekommt eine feste, klar abgegrenzte Aufgabe.
- Wenn ein Agent auf die Ergebnisse eines anderen warten muss, wartet er und
  startet seine eigene Aufgabe danach sauber.
- Die Umsetzung läuft am Stück weiter, bis alles fertig ist.
- Danach wird das Ergebnis noch einmal geprüft, geglättet und konsistent
  gemacht.
- Es soll nicht nötig sein, die Umsetzung ständig mit `weiter` oder ähnlichen
  Nachrichten manuell anzuschieben.

## Grundhaltung

Das Dashboard soll sich wie ein ruhiger, klarer Arbeitsraum anfühlen.
Nicht wie ein Baukasten aus Karten, Unterkarten und noch mehr Karten.

Leitbild:

- flat statt boxy
- mobile first
- Hierarchie über Typografie, Abstände und Linien
- nur wenige gezielte Flächen
- echte Tabellen und Listen für Arbeits- und Verwaltungsdaten
- Dialoge statt dauerhaft sichtbarer Formulare
- vorhandene Komponenten und Pakete weiterverwenden statt neu erfinden

## Global Rules

### Layout

- Keine Card-in-card-in-card-Struktur.
- Große Inhaltsflächen sollen wie Seiteninhalt wirken, nicht wie Widgets.
- Desktop erweitert das Mobile-Layout, ersetzt es nicht.
- Verfügbarer Platz soll genutzt werden, Inhalte nicht unnötig quetschen.

### Typography

- Deutlich größere und besser lesbare Schriftgrade.
- Weniger zentrierte Inseln, mehr klare linke Ausrichtung.
- Seiteninhalte brauchen keine zweite Überschrift, wenn Breadcrumbs den Kontext
  schon liefern.

### Copy

- `Dashboard` nicht redundant im Inhaltsbereich wiederholen.
- Zeitliche Floskeln wie `heute` nur verwenden, wenn sie echten Mehrwert haben.
- Eher `Weiterschreiben` statt `Heute weiterschreiben`.
- Deutsche Texte immer mit echten Umlauten.

### Navigation

- Primäre Sidebar-Punkte nur für echte Hauptbereiche.
- Profil gehört perspektivisch eher in den Nutzerbereich im Sidebar-Footer.
- Temporäre Draft-Navigation für Editor-Seiten darf unter `Einträge`
  eingerückt erscheinen.

### Data Surfaces

- Verwaltungsseiten bevorzugt als echte Tabelle.
- Arbeitsübersichten bevorzugt als klare Listenflächen mit Tabs.
- Keine unechten Tabellen, die wie Tabellen aussehen, aber keine sind.

### Dialogs

- Erstellen und Bearbeiten auf Verwaltungsseiten über Dialoge.
- Keine dauerhaft offenen Formulare in Listen oder Bäumen.
- Löschaktionen immer über Dialoge, nie über browser-native Alerts.
- Löschdialoge mit doppelter Bestätigung.

### Tokens and Styling

- Mockup-Farben sind nur Platzhalter.
- Für die Umsetzung müssen die bestehenden Farben, Tokens und Stilentscheidungen
  aus dem Repo verwendet werden.

## Reusable UI Candidates

Mehrere Patterns eignen sich für wiederverwendbare Bausteine in `@bubbles/ui`:

- generische Dialogmuster für Erstellen, Bearbeiten und Bestätigen
- Such-/Filter-Toolbar für Verwaltungsseiten
- Pagination mit optionaler `Items pro Seite`-Auswahl
- Tabellen-Action-Zellen mit ruhigen Icon-Aktionen

## Page Directions

### `/`

- Arbeitsübersicht, kein persönlicher Hero.
- Oben nur `Hallo, Vorname`.
- Hauptfläche mit Tabs:
  - `Offene Entwürfe`
  - `Zuletzt bearbeitet`
- Standard-Tab: `Offene Entwürfe`
- Klick auf Zeile öffnet direkt den Eintrag.
- Danach:
  - kompakte vertikale Aktionsliste
  - drei kleine Inline-Stats
  - schlanke Modulstatus-Zeile
- Profil verschwindet komplett, wenn vollständig.

### `/profile`

- Primär Profilansicht, nicht Formularwand.
- Ein zusammenhängender Profilbereich reicht.
- Sichtbar:
  - Avatar
  - Anzeigename
  - Bio
  - Social Links
- Bearbeiten als klarer Modus auf derselben Seite.
- Oben sichtbarer `Bearbeiten`-Button.
- Im Edit-Modus oben rechts:
  - `Abbrechen`
  - `Speichern`
- Kein Slug im UI.
- Kein GitHub-/Rollen-/E-Mail-Kontext auf der Seite.

### `/account` → `Zugangsverwaltung`

- Reine Zugangsverwaltung.
- Oben klarer Button `Zugang freigeben`.
- Erstellen und Bearbeiten per Dialog.
- Kern als echte Tabelle.
- Spalten:
  - GitHub-Name
  - E-Mail
  - Rolle
  - Notiz
  - Zuletzt geändert
  - Status
  - Aktionen
- Direkte Aktionen:
  - Bearbeiten
  - Zugang entziehen
- Notiz gekürzt, vollständig on hover.
- Eigener Owner-Account normal sichtbar, aber mit kleiner Kennzeichnung und
  deaktivierten Aktionen.

### `/vault`

- Echte Arbeitsübersicht für den Coding Vault.
- Kein Intro, keine Hero-Fläche, keine Verteilerlogik.
- Direkter Einstieg in Arbeit.
- Zentrale Arbeitsfläche mit Tabs:
  - `Offene Entwürfe`
  - `Zuletzt bearbeitet`
- Klick auf Eintrag öffnet direkt den Editor.
- Kleine Actions oben rechts:
  - `Neuer Eintrag`
  - `Neue Kategorie`
- Nur kleine Statuszeile:
  - Entwürfe
  - veröffentlicht
  - Kategorien
- Keine `Taxonomie`
- Keine `Nächste Schritte`

### `/vault/entries`

- Echte Tabelle.
- Toolbar:
  - Suche
  - Filter
  - `Neuer Eintrag`
- Kleine Kontextzeile oberhalb:
  - z. B. `32 Einträge · 3 Entwürfe · 18 veröffentlicht`
- Spalten:
  - Titel
  - Kategorie
  - Status
  - Zuletzt bearbeitet
  - Aktionen
- Titelspalte mit gekürzter Beschreibung darunter.
- Vollständige Beschreibung on hover.
- Aktionen als Icons:
  - Bearbeiten
  - Vorschau
  - Löschen
- Vorschau auf separater Seite im neuen Tab.
- Klassische Pagination unten.
- `Items pro Seite`-Auswahl als guter UI-Kandidat, Default tendenziell `20`.
- Pagination nur zeigen, wenn überhaupt nötig.

### `/vault/categories`

- Flache hierarchische Liste statt schwerem Baum-UI.
- Hierarchie sichtbar über:
  - Einrückung
  - Eltern-/Kind-Kennzeichnung
- Optional auf- und zuklappbar.
- Toolbar:
  - Suche
  - Filter
- Kleine Statuszeile:
  - z. B. `12 Kategorien · 7 Oberkategorien · 5 Unterkategorien`
- `Neue Kategorie` per Dialog.
- Bearbeiten per Dialog.
- Sichtbare Zeileninfos:
  - Name
  - Beschreibung
  - Parent/Level
  - Anzahl Einträge
  - Aktionen
- Direkte Aktionen:
  - Bearbeiten
  - Unterkategorie anlegen
  - Löschen

### `/vault/entries/new` and `/vault/entries/[id]`

- Bleiben echte Arbeitsseiten.
- `new` und `edit` fast gleich, Unterschiede über Kontext und Aktionen.
- Kopfbereich flach und knapp.
- `new`:
  - Titel `Neuer Eintrag`
- `edit`:
  - kleine Overline `Eintrag bearbeiten`
  - darunter der eigentliche Titel als größte Überschrift
- Kontext knapp:
  - `Status · Kategorie`
- Seitenaktionen oben rechts:
  - `Speichern`
  - `Vorschau`
- `Vorschau` öffnet die Frontend-Ansicht im neuen Tab.
- Bestehende Editor-Vorschau bleibt.
- Das vorhandene Editor-Paket bleibt erhalten:
  - Editor
  - Side-by-side Preview
  - Metadaten-Form
- Keine Löschaktion auf der Seite.
- Keine Duplizieren-Aktion.
- Breadcrumbs reichen als Rücknavigation.

## Sidebar Draft Pattern

Für Editor-Arbeit unter `Einträge`:

- temporärer Punkt `Neuer Eintrag (Draft)`
- temporärer Punkt `Eintrag bearbeiten (Draft)`
- beide eingerückt unter `Einträge`
- beide mit kleinem Schließen-/Löschen-Icon

Diese Aktion bedeutet:

- lokalen Draft aus `localStorage` entfernen
- temporären Sidebar-Punkt schließen
- bei bestehenden Einträgen ausdrücklich nicht den echten Eintrag löschen

## Technical Alignment Notes

- Das Dashboard nutzt bereits lokale Editor-Drafts.
- Bestehende Einträge haben getrennte Draft-Speicherung pro Eintrag-ID.
- `Neuer Eintrag` nutzt aktuell einen gemeinsamen Create-Draft-Scope.
- Für echte Frontend-Vorschau kann das vorhandene Markdown-Renderer-Paket im
  Dashboard integriert werden.

## Companion Notes

Dieses Playbook ergänzt die route-spezifischen Notizen:

- [dashboard-home-redesign-notes.md](/Users/mrbubbles/dev/bubbles-verse/apps/dashboard/documentation/dashboard-home-redesign-notes.md)
- [profile-redesign-notes.md](/Users/mrbubbles/dev/bubbles-verse/apps/dashboard/documentation/profile-redesign-notes.md)
- [account-redesign-notes.md](/Users/mrbubbles/dev/bubbles-verse/apps/dashboard/documentation/account-redesign-notes.md)
- [vault-overview-redesign-notes.md](/Users/mrbubbles/dev/bubbles-verse/apps/dashboard/documentation/vault-overview-redesign-notes.md)
- [vault-entries-redesign-notes.md](/Users/mrbubbles/dev/bubbles-verse/apps/dashboard/documentation/vault-entries-redesign-notes.md)
- [vault-categories-redesign-notes.md](/Users/mrbubbles/dev/bubbles-verse/apps/dashboard/documentation/vault-categories-redesign-notes.md)
- [vault-entry-editor-redesign-notes.md](/Users/mrbubbles/dev/bubbles-verse/apps/dashboard/documentation/vault-entry-editor-redesign-notes.md)
