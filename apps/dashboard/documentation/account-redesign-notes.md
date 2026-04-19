# Account Redesign Notes

Stand: 2026-04-19
Route: `/account`
Status: laufendes Brainstorming, noch nicht final freigegeben

## Ziel

Die Account-Seite soll die Verwaltung von Dashboard-Zugängen abbilden.
Fokus ist UI/UX, nicht neue Funktionalität.

## Bereits aus dem bisherigen Gespräch klar

- Die Seite ist eine reine Zugangsverwaltung.
- Die Seite soll nicht dauerhaft aus großen Formular-Karten pro Account bestehen.
- Verwaltung soll tabellenbasiert sein.
- Neue Zugänge sollen über einen klaren Button plus Dialog entstehen.
- Bearbeiten soll ebenfalls per Dialog passieren.
- Der Menüpunkt `Account` wirkt irreführend für diese Aufgabe.
- Die fachlich klarere Bezeichnung ist `Zugangsverwaltung`.
- Die globale Dashboard-Richtung gilt auch hier:
  - flat statt boxy
  - wenig Container
  - Hierarchie über Typografie, Abstand und Linien
  - Verwaltungsdaten eher als Listen/Tabelle statt Karten

## Bereits festgezogen

- Primäre Aktion oben: `Zugang freigeben`
- Bestehende Zugänge erscheinen in einer echten Tabelle.
- Direkte Zeilenaktionen:
  - `Bearbeiten`
  - `Zugang entziehen`
- Sinnvolle Tabellenspalten:
  - GitHub-Name
  - E-Mail
  - Rolle
  - Notiz
  - Zuletzt geändert
  - Status
  - Aktionen
- Die Notiz bleibt sichtbar in der Tabelle.
- Die Notiz wird auf eine Zeile gekürzt.
- Die vollständige Notiz erscheint on hover.
- Der eigene Owner-Account bleibt normal in der Tabelle sichtbar.
- Der eigene Owner-Account bekommt nur eine kleine Kennzeichnung.
- Aktionen für den eigenen Owner-Account sind deaktiviert.
- Statusdarstellung als kleine textnahe Status-Pille.

## Offene Punkte

Noch zu klären:

- wie kompakt oder dicht die Tabelle visuell werden soll
- wie die Dialoge für Erstellen und Bearbeiten im Detail aufgebaut werden
