# Dashboard Home Redesign Notes

Stand: 2026-04-19
Route: `/`
Status: laufendes Brainstorming, noch nicht final freigegeben

## Ziel

Die Startseite soll eine mobile-first Arbeitsübersicht sein.
Fokus ist UI/UX, nicht neue Funktionalität.

## Bereits festgezogen

- Startseite ist Arbeitsübersicht, kein persönlicher Hero.
- Oben nur `Hallo, Vorname`.
- Kein Nachname im Titel.
- Keine Rollen-, GitHub- oder E-Mail-Badges oben.
- Kein redundanter Beschreibungstext im Seiteninhalt.
- Hauptbereich startet mit `Offene Entwürfe`.
- Wechsel zwischen `Offene Entwürfe` und `Zuletzt bearbeitet` über echte Shadcn-Tabs.
- Klick auf einen Eintrag springt direkt in den Eintrag.
- Mobile Reihenfolge:
  - `Hallo, Vorname`
  - Hauptliste
  - Aktionsliste
  - kleine Kennzahlen
  - Modulstatus-Zeile
- Profilbereich verschwindet komplett von `/`, sobald das Profil vollständig ist.
- Modul/App-Bereich bleibt nur als sehr schlanke Statuszeile.
- Kennzahlen auf `/` sind nur:
  - Offene Entwürfe
  - Veröffentlicht
  - Kategorien
- Aktionsbereich soll eine Mischung aus leisen Sekundärbuttons und textlicher Hilfe sein.
- Desktop bleibt aus Mobile abgeleitet:
  - dominante Hauptfläche links
  - dezente sticky Spalte rechts
- Die flachere Mockup-Richtung ist klar bevorzugt:
  - fast rahmenlose Editorial-Liste
  - deutlich weniger Boxen und Container
  - Aktionen, Stats und Modulstatus textnäher und leichter

## Dashboard-weite Leitlinie

Die flache Richtung für `/` soll als generelle Designhaltung für das
Dashboard dienen:

- wenig Container
- kaum verschachtelte Flächen
- Hierarchie vor allem über Typografie, Abstände und Linien
- Listen/Tabelle vor Karten, wenn es um Arbeits- oder Verwaltungsdaten geht
- primäre Arbeitsflächen sollen wie Seiteninhalt wirken, nicht wie Widgets

Das heißt nicht, dass jede Unterseite gleich aussieht.
Jede Seite behält ihre eigene Aufgabe.
Aber die visuelle Sprache soll insgesamt klar in diese flache Richtung gehen.

## Copy-Leitlinien

Diese Punkte wurden zusätzlich für das Dashboard festgezogen:

- Keine redundanten Seitentitel im Inhaltsbereich, wenn der Kontext bereits
  über Breadcrumbs und Shell klar ist.
- `Dashboard` nicht nochmal als inhaltliche Überschrift wiederholen, wenn es
  oben schon sichtbar ist.
- Zeitliche Floskeln wie `heute` nur verwenden, wenn sie wirklich inhaltlichen
  Mehrwert haben.
- Lieber neutrale, dauerhafte Labels wie `Weiterschreiben` statt
  `Heute weiterschreiben`.
- Deutsche Texte immer mit echten Umlauten schreiben.

## Explizit unerwuenscht

- Card in card in card
- große CTA-Kacheln
- Default-hervorgehobene Aktion
- Modul-Kachelwand
- Profilstatus-Block trotz fertigem Profil
- aufdringliche Intro-Inszenierung
- browser-native Alerts fuer Loeschaktionen

## Loesch-UX global

Löschaktionen später nicht per Browser-Alert.
Stattdessen:

- Dialog öffnen
- erste bestätigende Löschaktion
- zweite explizite Sicherheitsbestätigung

## Offener Punkt fuer `/`

Die flachere Mockup-Runde ist deutlich näher am Zielbild.
Nächste Arbeit für `/` wird Feinschliff sein, nicht wieder eine neue
Grundrichtung.

## Farb- und Stilhinweis

Die Farben aus den Mockups sind nur Platzhalter für die Brainstorming-Phase.
Bei der echten Umsetzung müssen die bereits im Repo festgelegten Farben,
Tokens und vorhandenen Stilentscheidungen verwendet werden.
