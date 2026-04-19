type RedirectFeedbackMessages<TStatus extends string> = Record<TStatus, string>;

export type RedirectFeedbackConfig<TStatus extends string> = {
  pathname: string;
  param: string;
  messages: RedirectFeedbackMessages<TStatus>;
};

/**
 * Defines one redirect-feedback contract for a dashboard route.
 *
 * Use this for server-first mutation flows that redirect back to a page with a
 * short query param, while a client bridge turns that param into a toast.
 *
 * @param config Pathname, query key, and human-readable messages for one route.
 * @returns The same config with its status keys preserved for typed helpers.
 */
export function createRedirectFeedbackConfig<TStatus extends string>(
  config: RedirectFeedbackConfig<TStatus>
) {
  return config;
}

/**
 * Resolves one feedback message from a query string for a known route config.
 *
 * @param search Raw query string, with or without a leading `?`.
 * @param config Redirect-feedback config for the current route.
 * @returns The matching toast copy or `null` when the param is missing/invalid.
 */
export function getRedirectFeedbackMessage<TStatus extends string>(
  search: string,
  config: RedirectFeedbackConfig<TStatus>
) {
  const normalizedSearch = search.startsWith('?') ? search.slice(1) : search;

  if (!normalizedSearch) {
    return null;
  }

  const params = new URLSearchParams(normalizedSearch);
  const status = params.get(config.param);

  if (!status) {
    return null;
  }

  return config.messages[status as TStatus] ?? null;
}

/**
 * Builds the redirect href for one mutation outcome.
 *
 * @param status Short result code stored in the query string.
 * @param config Redirect-feedback config for the current route.
 * @returns The route pathname plus its encoded feedback param.
 */
export function getRedirectFeedbackHref<TStatus extends string>(
  status: TStatus,
  config: RedirectFeedbackConfig<TStatus>
) {
  return `${config.pathname}?${config.param}=${status}`;
}

/**
 * Removes the handled feedback param while preserving all other query params.
 *
 * @param search Raw query string, with or without a leading `?`.
 * @param config Redirect-feedback config for the current route.
 * @returns The remaining query string without a leading `?`.
 */
export function stripRedirectFeedbackParam<TStatus extends string>(
  search: string,
  config: RedirectFeedbackConfig<TStatus>
) {
  const normalizedSearch = search.startsWith('?') ? search.slice(1) : search;

  if (!normalizedSearch) {
    return '';
  }

  const params = new URLSearchParams(normalizedSearch);

  params.delete(config.param);

  return params.toString();
}
