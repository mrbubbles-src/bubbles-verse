import 'server-only';

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as relations from '@/drizzle/db/relations';
import * as schema from '@/drizzle/db/schema';

const globalForBubblophyDb = globalThis as typeof globalThis & {
  bubblophySqlClient?: postgres.Sql;
};

const sqlClient =
  globalForBubblophyDb.bubblophySqlClient ??
  postgres(process.env.DATABASE_URL!, {
    prepare: false,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForBubblophyDb.bubblophySqlClient = sqlClient;
}

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
