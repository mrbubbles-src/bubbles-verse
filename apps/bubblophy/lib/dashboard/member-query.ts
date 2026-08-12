export interface DashboardMemberCursor {
  createdAt: string;
  authUserId: string;
}

export interface DashboardMemberPageRequestState {
  projectKey: string;
  after: DashboardMemberCursor | null;
}

export const DASHBOARD_MEMBER_CURSOR_AUTH_USER_ID_MAX_LENGTH = 128;

/**
 * Parses the complete stable member cursor from raw query values.
 *
 * @param createdAt Raw membership creation timestamp.
 * @param authUserId Raw member Auth user ID.
 * @returns Canonical cursor or null for an omitted or invalid pair.
 */
export function parseDashboardMemberCursor(
  createdAt: string | null | undefined,
  authUserId: string | null | undefined
): DashboardMemberCursor | null {
  const normalizedCreatedAt = createdAt?.trim() ?? '';
  const normalizedAuthUserId = authUserId?.trim() ?? '';

  if (
    !normalizedCreatedAt ||
    normalizedCreatedAt.length > 64 ||
    !Number.isFinite(Date.parse(normalizedCreatedAt)) ||
    !normalizedAuthUserId ||
    normalizedAuthUserId.length >
      DASHBOARD_MEMBER_CURSOR_AUTH_USER_ID_MAX_LENGTH
  ) {
    return null;
  }

  return {
    createdAt: normalizedCreatedAt,
    authUserId: normalizedAuthUserId,
  };
}

/** Checks whether a member-page response belongs to the current request. */
export function isDashboardMemberPageRequestCurrent(
  request: DashboardMemberPageRequestState | null | undefined,
  projectKey: string,
  after: DashboardMemberCursor | null
) {
  return Boolean(
    request &&
    request.projectKey === projectKey &&
    request.after?.createdAt === after?.createdAt &&
    request.after?.authUserId === after?.authUserId
  );
}

/** Writes or clears the complete member cursor in existing URL state. */
export function setDashboardMemberPageParams(
  searchParams: URLSearchParams,
  after: DashboardMemberCursor | null
) {
  const nextParams = new URLSearchParams(searchParams.toString());

  if (after) {
    nextParams.set('memberAfterAt', after.createdAt);
    nextParams.set('memberAfterAuthUserId', after.authUserId);
  } else {
    nextParams.delete('memberAfterAt');
    nextParams.delete('memberAfterAuthUserId');
  }

  return nextParams;
}
