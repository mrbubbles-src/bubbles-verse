import { ICategories, IVaultEntry, TContent } from '@/types/types';
import { cache } from 'react';
import { sql } from 'drizzle-orm';
import { isDatabaseFallbackEnabled, logFallback } from './runtime-fallbacks';

async function getDatabase() {
  if (isDatabaseFallbackEnabled) {
    // FALLBACK(no-db): Keep the app bootable without a database until the
    // monorepo environment is wired up to the real infrastructure.
    logFallback(
      'getDatabase',
      'THE_CODING_VAULT_ENABLE_NO_DB_FALLBACK is active, skipping DB access.'
    );
    return null;
  }

  const { db } = await import('@/drizzle/db/index');
  return db;
}

const getCategories = cache(async (): Promise<Array<ICategories>> => {
  try {
    const db = await getDatabase();
    if (!db) {
      return [];
    }

    const result = await db.execute(sql`SELECT current_user, session_user`);
    console.log(result);
    const dbCategories = await db.query.categories.findMany({
      with: {
        vaultEntries: {
          columns: {
            id: true,
            title: true,
            slug: true,
            published: true,
            isFeatured: true,
            order: true,
          },
        },
      },
      orderBy: (c, { asc }) => [asc(c.order)],
    });
    return dbCategories;
  } catch (error) {
    console.error('Fehler beim Abrufen der Kategorien:', error);
    logFallback(
      'getCategories',
      'Falling back to an empty category list after a DB read error.'
    );
    return [];
  }
});

const getMaxOrder = async (): Promise<number> => {
  try {
    const db = await getDatabase();
    if (!db) {
      return 0;
    }

    const result = await db.query.vaultEntries.findMany({
      columns: { order: true },
      orderBy: (entries, { desc }) => [desc(entries.order)],
      limit: 1,
    });

    return result[0]?.order ?? 0;
  } catch (error) {
    console.error('Fehler beim Abrufen der maximalen Reihenfolge:', error);
    logFallback(
      'getMaxOrder',
      'Falling back to order 0 after a DB read error.'
    );
    return 0;
  }
};

const getVaultEntryBySlug = cache(
  async (slug: string): Promise<IVaultEntry | null> => {
    const db = await getDatabase();
    if (!db) {
      return null;
    }

    const entry = await db.query.vaultEntries.findFirst({
      where: (entries, { eq }) => eq(entries.slug, slug),
      columns: {
        title: true,
        content: true,
        description: true,
        published: true,
        isFeatured: true,
        createdAt: true,
        updatedAt: true,
      },
      with: {
        user: true,
      },
    });

    if (!entry) {
      return null;
    }
    const { user, ...rest } = entry;
    return {
      ...rest,
      content: rest.content as TContent,
      author: user.authorInfo ? { ...user.authorInfo } : user.username,
      createdAt: new Date(rest.createdAt),
      updatedAt: new Date(rest.updatedAt),
    };
  },
);

export { getCategories, getMaxOrder, getVaultEntryBySlug };
