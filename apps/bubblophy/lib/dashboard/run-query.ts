export interface DashboardRunCursor {
  updatedAt: string;
  id: string;
}

export interface DashboardRunPageRequestState {
  projectKey: string;
  after: DashboardRunCursor | null;
}

export const DASHBOARD_RUN_CURSOR_ID_MAX_LENGTH = 128;

/**
 * Parses the two-part run cursor only when both values are safe and complete.
 *
 * @param updatedAt Raw timestamp query value.
 * @param id Raw run-ID query value.
 * @returns Canonical cursor or null for an omitted/invalid pair.
 */
export function parseDashboardRunCursor(
  updatedAt: string | null | undefined,
  id: string | null | undefined
): DashboardRunCursor | null {
  const normalizedUpdatedAt = updatedAt?.trim() ?? '';
  const normalizedId = id?.trim() ?? '';

  if (
    !normalizedUpdatedAt ||
    !normalizedId ||
    normalizedUpdatedAt.length > 64 ||
    normalizedId.length > DASHBOARD_RUN_CURSOR_ID_MAX_LENGTH ||
    !Number.isFinite(Date.parse(normalizedUpdatedAt))
  ) {
    return null;
  }

  return { updatedAt: normalizedUpdatedAt, id: normalizedId };
}

/** Checks whether a server run-page result matches the current URL request. */
export function isDashboardRunPageRequestCurrent(
  request: DashboardRunPageRequestState | null | undefined,
  projectKey: string,
  after: DashboardRunCursor | null
) {
  return Boolean(
    request &&
    request.projectKey === projectKey &&
    request.after?.updatedAt === after?.updatedAt &&
    request.after?.id === after?.id
  );
}

/** Writes or clears the stable two-part run cursor in existing URL state. */
export function setDashboardRunPageParams(
  searchParams: URLSearchParams,
  after: DashboardRunCursor | null
) {
  const nextParams = new URLSearchParams(searchParams.toString());

  if (after) {
    nextParams.set('runAfterAt', after.updatedAt);
    nextParams.set('runAfterId', after.id);
  } else {
    nextParams.delete('runAfterAt');
    nextParams.delete('runAfterId');
  }

  return nextParams;
}
