import 'server-only';

import { getCachedBubblesPostgresClient } from '@bubbles/database-access/postgres';
import { drizzle } from 'drizzle-orm/postgres-js';

import * as relations from '@/drizzle/db/relations';
import * as schema from '@/drizzle/db/schema';

const sqlClient = getCachedBubblesPostgresClient({
  appKey: 'bubblophy',
  databaseUrl: process.env.DATABASE_URL!,
});

/**
 * Exposes the Bubblophy Drizzle client with schema and relations attached.
 *
 * Use this only from server-only data access modules so browser bundles never
 * receive database credentials or privileged query helpers.
 */
export const db = drizzle(sqlClient, {
  schema: {
    ...schema,
    ...relations,
  },
});
