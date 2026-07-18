# Bubblophy Rollen und Einladungen

**Ziel:** Technische Auth-User-IDs aus dem normalen Team-Workflow entfernen und
echte, auditierbare Projekteinladungen ergänzen, ohne Benutzerverzeichnisse,
E-Mail-Adressen oder Zugriff vor der Annahme offenzulegen.

**Architektur:** Bestehende Projektmitgliedschaften bleiben die einzige Quelle
für Projektzugriff. Eine Einladung ist ein zeitlich begrenzter, serverseitig
verwalteter Vorzustand. Die Annahme läuft über einen eigenen Supabase-
authentifizierten Pfad und erzeugt die Mitgliedschaft atomar erst dann, wenn die
normalisierte Session-E-Mail zur Einladung passt. Einladungs-Tokens werden nur
gehasht gespeichert; rohe Einladungs- und E-Mail-Daten bleiben aus allgemeinen
Projekt-Snapshots, RLS-Reads und MCP-Werkzeugen ausgeschlossen.

## Domain-Vertrag

- `owner` bleibt unveränderbar und kann nicht eingeladen werden.
- `owner` und `maintainer` dürfen `maintainer`, `member` und `viewer` einladen.
- Eine Einladung gewährt vor Annahme keinerlei Projekt- oder MCP-Zugriff.
- Die Anwendung verrät nicht, ob eine E-Mail bereits zu einem Supabase-Account
  gehört.
- Annahme setzt eine gültige Supabase-Session, die passende normalisierte
  E-Mail, einen gültigen Token, ein aktives Projekt und eine noch offene,
  nicht abgelaufene Einladung voraus.
- Annahme und Widerruf sind transaktional und gegeneinander konfliktgeschützt.
- Audit-Ereignisse referenzieren Einladung und Rolle, enthalten aber keine
  E-Mail-Adresse und keinen Token.
- Allgemeine Projektmitglieder sehen keine ausstehenden E-Mail-Adressen;
  Einladungsverwaltung ist auf Owner und Maintainer begrenzt.
- Bestehende direkte Mitgliedschaften und Rollen bleiben kompatibel, bis der
  Einladungsfluss vollständig produktionsreif ist.

## Task 1: Bestehende Rollenmutationen härten

- [x] Projekt, handelnde Mitgliedschaft und Zielmitgliedschaft in stabiler
      Reihenfolge sperren und Berechtigungen unter diesen Locks erneut prüfen.
- [x] Rollenänderungen mit erwartetem Ausgangszustand gegen paralleles
      Überschreiben schützen.
- [x] Gleichzeitige Entfernung oder Rollenänderung als strukturierten Konflikt
      statt als Serverfehler behandeln.
- [x] Store-, Service-, Action- und UI-Tests ergänzen; Dokumentation und
      Changelog aktualisieren.

## Task 2: Projektweite Autorisierungs-Races schließen

- [x] Gemeinsame kleine Projekt- und Membership-Lock-Primitiven mit stabiler
      Reihenfolge, deduplizierten User-IDs und ohne Rollenpolitik ergänzen.
- [x] Projektverwaltung sowie Agent-Token-Erstellung und -Lifecycle auf Projekt
      → Actor-Membership → gegebenenfalls Token umstellen.
- [x] Menschliche Run-Freigabe und -Abbruch auf Projekt → Actor-Membership →
      Run → Token umstellen.
- [ ] Issue Edit, Priority und Assignment auf Projekt → Issue → sortierte
      Actor-/Assignee-Memberships umstellen.

Damit kann eine bereits parallel entzogene Rolle nicht nach dem Commit der
Demotion noch wirksam werden. Erst nach diesen Security-Slices folgt die
Einladungspersistenz.

## Task 3: Einladungspersistenz und Verwaltung

- [ ] Einladungstabelle mit normalisierter E-Mail, Rolle, Token-Hash,
      Einladendem, Ablauf-, Annahme- und Widerrufszeitpunkten ergänzen.
- [ ] Invarianten für Nicht-Owner-Rollen und widerspruchsfreie Zustände in der
      Datenbank absichern.
- [ ] Direkte RLS-Reads auf Einladungsdaten schließen.
- [ ] Create-/Reinvite-/Revoke-Verträge mit gesperrter Manager-Autorisierung,
      sicheren Tokens und E-Mail-freien Audit-Ereignissen implementieren.
- [ ] Nur Owner/Maintainer erhalten einen serverseitig redigierten
      Einladungs-Snapshot.

## Task 4: Annahme und Auth-Grenze

- [ ] Einen eigenen Einladungs-Deep-Link definieren, der anonyme Nutzer über
      den bestehenden GitHub-/Supabase-Login zurückführt.
- [ ] Den Callback nur für diesen engen Annahmepfad vor dem normalen
      Bubblophy-Zugangsgate passieren lassen.
- [ ] Token, Session-E-Mail, Projektzustand und Einladungszustand unter Locks
      prüfen und Mitgliedschaft plus Audit-Ereignis atomar schreiben.
- [ ] Wiederholung, Ablauf, Widerruf, falsche E-Mail und parallele Annahme
      fail-closed und verständlich abbilden.

## Task 5: Team-UX und verständliche Identität

- [ ] Technische Auth-ID-Eingabe durch E-Mail-Einladung ersetzen.
- [ ] Offene, abgelaufene und widerrufene Einladungen für Manager verständlich
      anzeigen; Link nur unmittelbar nach Erzeugung kopierbar machen.
- [ ] Ein minimales eigenes Profil aus verifizierter Session-Identität pflegen,
      damit Mitgliedslisten Name/E-Mail mit technischer ID nur als Fallback zeigen.
- [ ] Rollenrechte für Owner, Maintainer, Member und Viewer im UI klar
      beschreiben und unerlaubte Aktionen serverseitig weiterhin abweisen.

## Task 6: Zustellung und Produktionsgate

- [ ] Mailversand hinter eine kleine server-only Schnittstelle legen; keine
      Provider-Secrets oder Service-Role-Schlüssel an den Browser geben.
- [ ] Versandfehler getrennt vom gültigen Einladungszustand behandeln und
      erneutes Senden rate-limitiert ermöglichen.
- [ ] Ablauf, Base-URL, Absenderdomain, Monitoring und Secret-Rotation für
      Staging dokumentieren.
- [ ] Mit getrennten Testidentitäten Einladung, falsche Identität, Widerruf,
      Ablauf und Rollenrechte vor dem Deployment vollständig smoken.

## Slice-Gates

- Jeder funktionale Slice enthält Tests, Dokumentation und Changelog.
- Formatierung, Lint, Typecheck, relevante Tests und Build müssen vor jedem
  Commit erfolgreich sein.
- Der laufende Reviewer prüft insbesondere Race-Conditions, Rechteausweitung,
  E-Mail-/Token-Leaks, unnötige Abstraktion und Regressionen im bestehenden
  Mitglieder- und MCP-Vertrag.
