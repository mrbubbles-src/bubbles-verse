import type { BubblesPostgresClient } from '@bubbles/database-access/postgres';

import { getCachedBubblesPostgresClient } from '@bubbles/database-access/postgres';
import { drizzle } from 'drizzle-orm/postgres-js';

import * as relations from './relations';
import * as schema from './schema';

declare global {
  var __dashboardDbClient:
    | ReturnType<typeof createDashboardDbClient>
    | undefined;
}

/**
 * Creates the shared Postgres.js client for the dashboard app.
 *
 * The dashboard runs inside Next.js dev with Turbopack, so this client must be
 * cached across module reloads. Otherwise every HMR cycle creates more open DB
 * connections until Supabase starts timing out simple allowlist queries.
 *
 * @returns One reusable Postgres.js client for the whole process.
 */
function createDashboardSqlClient() {
  return getCachedBubblesPostgresClient({
    appKey: 'dashboard',
    databaseUrl: process.env.DATABASE_URL!,
  });
}

/**
 * Creates the typed Drizzle client on top of the shared SQL transport.
 *
 * @param sqlClient Shared Postgres.js transport instance.
 * @returns Drizzle client configured with the dashboard schema.
 */
function createDashboardDbClient(sqlClient: BubblesPostgresClient) {
  return drizzle(sqlClient, {
    schema: { ...schema, ...relations },
  });
}

/**
 * Returns a process-wide shared Drizzle client for the dashboard app.
 *
 * Reusing the same instance avoids connection churn during local HMR while
 * still working the same way in production.
 */
function getDashboardDb() {
  const sqlClient = createDashboardSqlClient();

  const dbClient =
    globalThis.__dashboardDbClient ?? createDashboardDbClient(sqlClient);

  globalThis.__dashboardDbClient = dbClient;

  return dbClient;
}

export const db = getDashboardDb();
