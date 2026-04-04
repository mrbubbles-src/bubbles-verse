import { NextResponse } from 'next/server';
import { isDatabaseFallbackEnabled } from '@/lib/runtime-fallbacks';
// import { categories } from '@/drizzle/db/schema';
// import { asc } from 'drizzle-orm';

export async function GET() {
  if (isDatabaseFallbackEnabled) {
    // FALLBACK(no-db): Expose an empty category list while the DB is offline.
    return NextResponse.json([], {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  }

  const { db } = await import('@/drizzle/db/index');
  // const dbCategories = await db
  //   .select()
  //   .from(categories)
  //   .orderBy(asc(categories.order));
  const dbCategories = await db.query.categories.findMany({
    orderBy: (categories, { asc }) => asc(categories.order),
  });

  return NextResponse.json(dbCategories, {
    headers: {
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
