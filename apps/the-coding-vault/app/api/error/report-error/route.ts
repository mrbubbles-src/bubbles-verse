import { reportErrorToDiscord } from '@/lib/error';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const body = await req.json();
  await reportErrorToDiscord(body);
  return NextResponse.json({ success: true });
}
