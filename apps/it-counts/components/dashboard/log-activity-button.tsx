'use client';

import Link from 'next/link';

import { Button } from '@bubbles/ui/shadcn/button';

/**
 * Primary CTA for logging an activity.
 * Single prominent button on the dashboard — the one action the user came for.
 * Links to /log until the inline bottom-sheet flow replaces it in Story 2.2.
 */
export function LogActivityButton() {
  return (
    <Button size="lg" className="h-12 px-8 text-base font-semibold">
      <Link href="/log">Log Activity</Link>
    </Button>
  );
}
