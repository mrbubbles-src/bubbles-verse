export interface DashboardNotificationCursor {
  updatedAt: string;
  runId: string;
}

export interface DashboardNotificationPageRequestState {
  projectKey: string | null;
  after: DashboardNotificationCursor | null;
}

export const DASHBOARD_NOTIFICATION_CURSOR_ID_MAX_LENGTH = 128;

/**
 * Parses the two-part notification cursor only when both values are safe.
 *
 * @param updatedAt Raw run update timestamp from the URL.
 * @param runId Raw run ID from the URL.
 * @returns Canonical cursor or null for an omitted or malformed tuple.
 */
export function parseDashboardNotificationCursor(
  updatedAt: string | null | undefined,
  runId: string | null | undefined
): DashboardNotificationCursor | null {
  const normalizedUpdatedAt = updatedAt?.trim() ?? '';
  const normalizedRunId = runId?.trim() ?? '';

  if (
    !normalizedUpdatedAt ||
    normalizedUpdatedAt.length > 64 ||
    !Number.isFinite(Date.parse(normalizedUpdatedAt)) ||
    !normalizedRunId ||
    normalizedRunId.length > DASHBOARD_NOTIFICATION_CURSOR_ID_MAX_LENGTH
  ) {
    return null;
  }

  return { updatedAt: normalizedUpdatedAt, runId: normalizedRunId };
}

/** Checks whether a server notification page matches the current URL. */
export function isDashboardNotificationPageRequestCurrent(
  request: DashboardNotificationPageRequestState | null | undefined,
  projectKey: string | null,
  after: DashboardNotificationCursor | null
) {
  return Boolean(
    request &&
    request.projectKey === projectKey &&
    request.after?.updatedAt === after?.updatedAt &&
    request.after?.runId === after?.runId
  );
}

/** Writes or clears the complete notification cursor in existing URL state. */
export function setDashboardNotificationPageParams(
  searchParams: URLSearchParams,
  after: DashboardNotificationCursor | null
) {
  const nextParams = new URLSearchParams(searchParams.toString());

  if (after) {
    nextParams.set('notificationAfterAt', after.updatedAt);
    nextParams.set('notificationAfterId', after.runId);
  } else {
    clearDashboardNotificationCursor(nextParams);
  }

  return nextParams;
}

/** Canonicalizes the independent notification cursor in existing URL state. */
export function writeDashboardNotificationQueryParams(
  searchParams: URLSearchParams,
  after: DashboardNotificationCursor | null
) {
  return setDashboardNotificationPageParams(searchParams, after);
}

/** Removes both inseparable notification cursor fields in place. */
export function clearDashboardNotificationCursor(
  searchParams: URLSearchParams
) {
  searchParams.delete('notificationAfterAt');
  searchParams.delete('notificationAfterId');
}

/** Builds a stable local key for page-bound notification updates. */
export function buildDashboardNotificationPageKey(
  projectKey: string | null,
  after: DashboardNotificationCursor | null
) {
  return [projectKey ?? 'all', after?.updatedAt ?? '', after?.runId ?? ''].join(
    ':'
  );
}
