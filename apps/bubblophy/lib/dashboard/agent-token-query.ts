export interface DashboardAgentTokenCursor {
  projectKey: string;
  normalizedLabel: string;
  tokenId: string;
}

export interface DashboardAgentTokenPageRequestState {
  projectKey: string | null;
  after: DashboardAgentTokenCursor | null;
}

const projectKeyPattern = /^[A-Z0-9]{2,8}$/;
const normalizedLabelMaxLength = 80;
const tokenIdMaxLength = 128;

/** Parses the complete stable token-management cursor. */
export function parseDashboardAgentTokenCursor(
  projectKey: string | null | undefined,
  normalizedLabel: string | null | undefined,
  tokenId: string | null | undefined
): DashboardAgentTokenCursor | null {
  const normalizedProjectKey = projectKey?.trim().toUpperCase() ?? '';
  const normalizedTokenLabel = normalizedLabel?.trim().toLowerCase() ?? '';
  const normalizedTokenId = tokenId?.trim() ?? '';

  if (
    !projectKeyPattern.test(normalizedProjectKey) ||
    !normalizedTokenLabel ||
    normalizedTokenLabel.length > normalizedLabelMaxLength ||
    !normalizedTokenId ||
    normalizedTokenId.length > tokenIdMaxLength
  ) {
    return null;
  }

  return {
    projectKey: normalizedProjectKey,
    normalizedLabel: normalizedTokenLabel,
    tokenId: normalizedTokenId,
  };
}

/** Checks whether a token page response belongs to the current URL request. */
export function isDashboardAgentTokenPageRequestCurrent(
  request: DashboardAgentTokenPageRequestState | null | undefined,
  projectKey: string | null,
  after: DashboardAgentTokenCursor | null
) {
  return Boolean(
    request &&
    request.projectKey === projectKey &&
    request.after?.projectKey === after?.projectKey &&
    request.after?.normalizedLabel === after?.normalizedLabel &&
    request.after?.tokenId === after?.tokenId
  );
}

/** Writes or clears the independent token-management cursor. */
export function setDashboardAgentTokenPageParams(
  searchParams: URLSearchParams,
  after: DashboardAgentTokenCursor | null
) {
  const nextParams = new URLSearchParams(searchParams.toString());

  if (after) {
    nextParams.set('tokenAfterProject', after.projectKey);
    nextParams.set('tokenAfterLabel', after.normalizedLabel);
    nextParams.set('tokenAfterId', after.tokenId);
  } else {
    clearDashboardAgentTokenCursor(nextParams);
  }

  return nextParams;
}

/** Removes every inseparable token cursor field in place. */
export function clearDashboardAgentTokenCursor(searchParams: URLSearchParams) {
  searchParams.delete('tokenAfterProject');
  searchParams.delete('tokenAfterLabel');
  searchParams.delete('tokenAfterId');
}
