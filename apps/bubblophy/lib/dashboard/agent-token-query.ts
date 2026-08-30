export interface DashboardAgentTokenCursor {
  projectKey: string;
  normalizedLabel: string;
  tokenId: string;
}

export interface DashboardAgentTokenPageRequestState {
  projectKey: string | null;
  query: string | null;
  after: DashboardAgentTokenCursor | null;
}

export const DASHBOARD_AGENT_TOKEN_QUERY_MAX_LENGTH = 80;

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
  query: string | null,
  after: DashboardAgentTokenCursor | null
) {
  return Boolean(
    request &&
    request.projectKey === projectKey &&
    request.query === query &&
    request.after?.projectKey === after?.projectKey &&
    request.after?.normalizedLabel === after?.normalizedLabel &&
    request.after?.tokenId === after?.tokenId
  );
}

/** Normalizes the optional literal token-label prefix from the URL. */
export function normalizeDashboardAgentTokenQuery(
  query: string | null | undefined
) {
  return query?.trim() || null;
}

/** Writes a fresh token-label search and clears its incompatible cursor. */
export function setDashboardAgentTokenSearchParams(
  searchParams: URLSearchParams,
  query: string | null
) {
  const nextParams = new URLSearchParams(searchParams.toString());

  if (query) {
    nextParams.set('tokenQ', query);
  } else {
    nextParams.delete('tokenQ');
  }

  clearDashboardAgentTokenCursor(nextParams);

  return nextParams;
}

/** Canonicalizes the complete token search and cursor URL contract. */
export function writeDashboardAgentTokenQueryParams(
  searchParams: URLSearchParams,
  query: string | null,
  after: DashboardAgentTokenCursor | null
) {
  const nextParams = setDashboardAgentTokenPageParams(searchParams, after);

  if (query) {
    nextParams.set('tokenQ', query);
  } else {
    nextParams.delete('tokenQ');
  }

  return nextParams;
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
