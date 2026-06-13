import postgres from 'postgres';

export type BubblesPostgresClient = postgres.Sql;

export type BubblesPostgresClientOptions = {
  prepare?: boolean;
  idle_timeout?: number;
  connect_timeout?: number;
  max_lifetime?: number;
};

const DEFAULT_POSTGRES_CLIENT_OPTIONS = {
  prepare: false,
  idle_timeout: 20,
  connect_timeout: 10,
  max_lifetime: 60 * 30,
} satisfies Required<BubblesPostgresClientOptions>;

const POSTGRES_CLIENT_CACHE_PROPERTY =
  '__bubblesDatabaseAccessPostgresClientCache';

type BubblesDatabaseAccessGlobal = typeof globalThis & {
  __bubblesDatabaseAccessPostgresClientCache?: Record<
    string,
    BubblesPostgresClient
  >;
};

/**
 * Builds the Postgres.js option set shared by Bubblesverse apps.
 *
 * @param overrides App-specific transport option overrides.
 * @returns Postgres.js options with conservative HMR-friendly defaults.
 */
export function getBubblesPostgresClientOptions(
  overrides: BubblesPostgresClientOptions = {}
) {
  return {
    ...DEFAULT_POSTGRES_CLIENT_OPTIONS,
    ...overrides,
  } satisfies Required<BubblesPostgresClientOptions>;
}

/**
 * Creates a Postgres.js client without caching it.
 *
 * @param databaseUrl Optional Postgres connection string from a server-only env
 * source.
 * @param options Optional Postgres.js transport options.
 * @returns A Postgres.js SQL client.
 */
export function createBubblesPostgresClient({
  databaseUrl,
  options,
}: {
  databaseUrl?: string;
  options?: BubblesPostgresClientOptions;
}) {
  const clientOptions = getBubblesPostgresClientOptions(options);

  if (databaseUrl?.trim()) {
    return postgres(databaseUrl, clientOptions);
  }

  return postgres(clientOptions);
}

/**
 * Returns an HMR-safe cached Postgres.js client for one app key.
 *
 * @param input App key, server-only database URL, and optional transport
 * options.
 * @returns The cached Postgres.js client for the app key.
 */
export function getCachedBubblesPostgresClient({
  appKey,
  databaseUrl,
  options,
}: {
  appKey: string;
  databaseUrl?: string;
  options?: BubblesPostgresClientOptions;
}) {
  if (!appKey.trim()) {
    throw new Error('appKey is required to cache a Postgres client.');
  }

  const cache = getBubblesPostgresClientCache();
  const cachedClient = cache[appKey];

  if (cachedClient) {
    return cachedClient;
  }

  const client = createBubblesPostgresClient({ databaseUrl, options });

  cache[appKey] = client;

  return client;
}

/**
 * Clears cached clients for unit tests.
 *
 * @returns Nothing.
 */
export function clearCachedBubblesPostgresClientsForTests() {
  getBubblesPostgresGlobal().__bubblesDatabaseAccessPostgresClientCache = {};
}

/**
 * Reads the global cache used to survive local HMR reloads.
 *
 * @returns A process-wide app-keyed Postgres.js client cache.
 */
function getBubblesPostgresClientCache() {
  const bubblesGlobal = getBubblesPostgresGlobal();

  if (!bubblesGlobal[POSTGRES_CLIENT_CACHE_PROPERTY]) {
    bubblesGlobal[POSTGRES_CLIENT_CACHE_PROPERTY] = {};
  }

  return bubblesGlobal[POSTGRES_CLIENT_CACHE_PROPERTY];
}

/**
 * Narrows globalThis to the database-access cache shape.
 *
 * @returns globalThis with the optional Postgres client cache property.
 */
function getBubblesPostgresGlobal() {
  return globalThis as BubblesDatabaseAccessGlobal;
}
