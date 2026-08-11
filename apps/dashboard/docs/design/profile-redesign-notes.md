# Profile Redesign Notes

Stand: 2026-04-19
Route: `/profile`
Status: laufendes Brainstorming, noch nicht final freigegeben

## Ziel

Die Profilseite soll primär eine ruhige Profilansicht sein.
Nicht mehr dauerhaft eine Formularwand.

## Bereits festgezogen

- `/profile` ist primär eine Profilansicht mit gezieltem Bearbeiten.
- Bearbeiten passiert als expliziter Modus auf derselben Seite.
- Die Seite wechselt dabei als Ganzes in einen klaren Bearbeitungszustand.
- Nicht editierbarer Account-Kontext gehört nicht auf diese Seite:
  - GitHub
  - Rolle
  - E-Mail
- Der obere Ansichtsbereich soll wie eine kleine Autorenkarte funktionieren.
- Im Ansichtsmodus reicht ein einziger zusammenhängender Profilbereich.
- Darunter sollen keine zusätzlichen Profil-Untersektionen entstehen.
- In der Ansicht sichtbar:
  - Avatar
  - Anzeigename
  - Bio
  - Social Links
- Social Links werden in der Ansicht als einfache Linkreihe gezeigt.
- Der Avatar ist in der Ansicht nur Vorschau.
- Ein Avatar-Bearbeiten-Trigger erscheint nur im Edit-Modus.
- Der Slug verschwindet komplett aus dem UI.
- Wenn technisch nötig, soll der Slug automatisch aus dem GitHub-Username
  abgeleitet werden.
- Im Edit-Modus bleiben fachlich nur:
  - Anzeigename
  - Bio
  - Avatar
  - Social Links
- Website bleibt Teil der Social Links und wird nicht separat hervorgehoben.

## Unerwünscht

- dauerhafte Formularfelder im Default-Zustand
- interne Datenbank- oder Systemdetails in der Ansicht
- Slug als sichtbares Nutzerfeld
- Account-/Auth-Kontext auf einer fachlich falschen Seite
- Boxenstapel oder Card-in-Card-Struktur

## Designrichtung

Die Seite soll die globale Dashboard-Leitlinie fortführen:

- flat statt boxy
- Hierarchie über Typografie, Abstand und Linien
- nur wenige, gezielte Flächen
- klare Trennung zwischen Ansicht und Bearbeiten

## Navigation

- `Profil` muss nicht zwingend als eigener prominenter Sidebar-Punkt bestehen
  bleiben.
- Die Richtung ist, den Zugang eher in den User-/Footer-Bereich der Navigation
  zu verschieben.
- Der bestehende Punkt `Accounteinstellungen` im Popover/User-Menü ist dafür
  der natürlichere Ort.
- Die Copy dort sollte eher etwas Fachliches und Erwartbares werden, z. B.
  `Autorenprofil bearbeiten`, statt generischem `Accounteinstellungen`.

## Offene Punkte

Noch zu klären:

- wie stark der Edit-Modus visuell vom Ansichtsmodus abgesetzt wird
- wie Social Links und Avatar-Änderung im Edit-Modus konkret angeordnet werden
