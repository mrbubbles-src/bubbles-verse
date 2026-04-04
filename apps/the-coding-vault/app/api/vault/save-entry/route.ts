import { vaultEntries } from '@/drizzle/db/schema';
import { isDatabaseFallbackEnabled } from '@/lib/runtime-fallbacks';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  if (isDatabaseFallbackEnabled) {
    // FALLBACK(no-db): Writing entries is disabled until the DB is configured.
    return NextResponse.json(
      { message: 'Speichern ist im Monorepo-Fallback aktuell deaktiviert.' },
      { status: 503 }
    );
  }

  const { db } = await import('@/drizzle/db');
  const body = await req.json();

  const { title, content, slug, categoryId, authorId, description } = body;
  const order = Number(body.order);
  const parsedContent = JSON.parse(content);

  if (!parsedContent?.blocks?.length) {
    return NextResponse.json(
      { message: 'Content must include at least one block.' },
      { status: 400 },
    );
  }
  if (
    !title?.trim() ||
    !slug?.trim() ||
    !categoryId?.trim() ||
    !authorId?.trim() ||
    !order ||
    !description?.trim()
  ) {
    return NextResponse.json(
      { message: 'Invalid or missing fields in payload.' },
      { status: 400 },
    );
  }

  try {
    const test = await db.query.vaultEntries.findFirst();
    console.log(test);
    await db.insert(vaultEntries).values({
      title,
      content: parsedContent,
      slug,
      categoryId,
      authorId,
      order,
      description,
    });

    return NextResponse.json(
      {
        message: 'Entry saved successfully.',
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error saving entry:', error);
    return NextResponse.json(
      { message: 'Failed to save entry.', error: error },
      { status: 500 },
    );
  }
}
