import type {
  DashboardActivityCursor,
  DashboardActivityKind,
  DashboardActivitySource,
} from '@/lib/dashboard/activity';

export interface DashboardActivityQueryState {
  kind: DashboardActivityKind;
  after: DashboardActivityCursor | null;
}

export interface DashboardActivityPageRequestState extends DashboardActivityQueryState {
  projectKey: string | null;
}

export interface DashboardActivityQueryValues {
  kind?: string | null;
  afterAt?: string | null;
  afterSource?: string | null;
  afterId?: string | null;
}

const activityTimestampMaxLength = 64;
const activityEventIdMaxLength = 128;

/**
 * Parses the independent audit URL contract into canonical filter and cursor.
 *
 * @param values Raw activity values from Next.js or URLSearchParams.
 * @returns Canonical event kind and an all-or-nothing stable cursor.
 */
export function parseDashboardActivityQuery(
  values: DashboardActivityQueryValues
): DashboardActivityQueryState {
  return {
    kind: isDashboardActivitySource(values.kind) ? values.kind : 'all',
    after: parseDashboardActivityCursor(
      values.afterAt,
      values.afterSource,
      values.afterId
    ),
  };
}

/** Checks whether a server activity page matches the current canonical URL. */
export function isDashboardActivityPageRequestCurrent(
  request: DashboardActivityPageRequestState | null | undefined,
  projectKey: string | null,
  query: DashboardActivityQueryState
) {
  return Boolean(
    request &&
    request.projectKey === projectKey &&
    request.kind === query.kind &&
    request.after?.occurredAt === query.after?.occurredAt &&
    request.after?.source === query.after?.source &&
    request.after?.eventId === query.after?.eventId
  );
}

/** Applies an event-kind filter and clears only the activity cursor. */
export function setDashboardActivityKindParams(
  searchParams: URLSearchParams,
  kind: DashboardActivityKind
) {
  const nextParams = new URLSearchParams(searchParams.toString());

  if (kind === 'all') {
    nextParams.delete('activityKind');
  } else {
    nextParams.set('activityKind', kind);
  }

  clearDashboardActivityCursor(nextParams);

  return nextParams;
}

/** Sets or clears the complete activity cursor without changing other state. */
export function setDashboardActivityPageParams(
  searchParams: URLSearchParams,
  after: DashboardActivityCursor | null
) {
  const nextParams = new URLSearchParams(searchParams.toString());

  if (after) {
    nextParams.set('activityAfterAt', after.occurredAt);
    nextParams.set('activityAfterSource', after.source);
    nextParams.set('activityAfterId', after.eventId);
  } else {
    clearDashboardActivityCursor(nextParams);
  }

  return nextParams;
}

/** Writes the canonical activity filter and cursor into existing URL params. */
export function writeDashboardActivityQueryParams(
  searchParams: URLSearchParams,
  query: DashboardActivityQueryState
) {
  const nextParams = new URLSearchParams(searchParams.toString());

  if (query.kind === 'all') {
    nextParams.delete('activityKind');
  } else {
    nextParams.set('activityKind', query.kind);
  }

  if (query.after) {
    nextParams.set('activityAfterAt', query.after.occurredAt);
    nextParams.set('activityAfterSource', query.after.source);
    nextParams.set('activityAfterId', query.after.eventId);
  } else {
    clearDashboardActivityCursor(nextParams);
  }

  return nextParams;
}

/** Removes the three inseparable activity cursor fields in place. */
export function clearDashboardActivityCursor(searchParams: URLSearchParams) {
  searchParams.delete('activityAfterAt');
  searchParams.delete('activityAfterSource');
  searchParams.delete('activityAfterId');
}

/** Parses a complete activity cursor and rejects partial or malformed tuples. */
function parseDashboardActivityCursor(
  occurredAt: string | null | undefined,
  source: string | null | undefined,
  eventId: string | null | undefined
): DashboardActivityCursor | null {
  const normalizedOccurredAt = occurredAt?.trim() ?? '';
  const normalizedEventId = eventId?.trim() ?? '';

  if (
    !normalizedOccurredAt ||
    normalizedOccurredAt.length > activityTimestampMaxLength ||
    !Number.isFinite(Date.parse(normalizedOccurredAt)) ||
    !isDashboardActivitySource(source) ||
    !normalizedEventId ||
    normalizedEventId.length > activityEventIdMaxLength
  ) {
    return null;
  }

  return {
    occurredAt: normalizedOccurredAt,
    source,
    eventId: normalizedEventId,
  };
}

/** Checks the public event-source vocabulary. */
function isDashboardActivitySource(
  value: string | null | undefined
): value is DashboardActivitySource {
  return value === 'issue' || value === 'project';
}
