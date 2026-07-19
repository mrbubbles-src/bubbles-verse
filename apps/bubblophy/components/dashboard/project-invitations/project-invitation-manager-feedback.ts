import type {
  CreateBubblophyProjectInvitationActionResult,
  ReadBubblophyProjectInvitationManagerSnapshotActionResult,
  ReinviteBubblophyProjectInvitationActionResult,
  RevokeBubblophyProjectInvitationActionResult,
} from '@/app/actions';

type InvitationMutationFailure =
  | Exclude<CreateBubblophyProjectInvitationActionResult, { status: 'created' }>
  | Exclude<
      ReinviteBubblophyProjectInvitationActionResult,
      { status: 'reinvited' }
    >
  | Exclude<
      RevokeBubblophyProjectInvitationActionResult,
      { status: 'revoked' }
    >;

/** Identifies stale manager views that should be synchronized immediately. */
export function shouldRefreshAfterMutationFailure(
  result: InvitationMutationFailure
) {
  return (
    result.status === 'already_open' ||
    result.status === 'archived_project' ||
    result.status === 'conflict' ||
    result.status === 'forbidden' ||
    result.status === 'not_found' ||
    result.status === 'terminal'
  );
}

/** Maps a redacted invitation read result to safe manager feedback. */
export function getInvitationReadErrorMessage(
  result: Exclude<
    ReadBubblophyProjectInvitationManagerSnapshotActionResult,
    { status: 'found' }
  >
) {
  if (result.status === 'database_unavailable') {
    return 'Die Datenbank ist gerade nicht verfügbar.';
  }

  if (result.status === 'not_found') {
    return 'Einladungen sind für dieses Projekt nicht verfügbar.';
  }

  return 'Das ausgewählte Projekt ist ungültig.';
}

/** Maps invitation mutation failures without exposing storage details. */
export function getInvitationMutationErrorMessage(
  result: InvitationMutationFailure
) {
  if (result.status === 'already_open') {
    return 'Für diese E-Mail-Adresse gibt es bereits eine offene Einladung.';
  }

  if (result.status === 'archived_project') {
    return 'Archivierte Projekte erlauben keine Einladungsänderungen.';
  }

  if (result.status === 'conflict') {
    return 'Die Einladung wurde zwischenzeitlich geändert. Lade die Liste neu.';
  }

  if (result.status === 'forbidden') {
    return 'Nur Owner und Maintainer können Einladungen verwalten.';
  }

  if (result.status === 'not_found') {
    return 'Projekt oder Einladung wurde nicht gefunden.';
  }

  if (result.status === 'terminal') {
    return 'Angenommene oder widerrufene Einladungen können nicht geändert werden.';
  }

  if (result.status === 'database_unavailable') {
    return 'Die Datenbank ist gerade nicht verfügbar.';
  }

  if (result.reason === 'empty_email') {
    return 'Gib eine E-Mail-Adresse ein.';
  }

  if (result.reason === 'invalid_email') {
    return 'Gib eine gültige E-Mail-Adresse ein.';
  }

  if (result.reason === 'invalid_role') {
    return 'Wähle eine gültige Nicht-Owner-Rolle.';
  }

  return 'Die Einladung enthält ungültige oder veraltete Angaben.';
}
