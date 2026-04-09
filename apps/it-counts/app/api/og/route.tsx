/* eslint-disable @next/next/no-img-element */

import { ImageResponse } from 'next/og';

/**
 * Serves the It Counts Open Graph image (1200×630) for link previews.
 * Uses the current request origin so the logo resolves on custom domains too.
 */
export async function GET(request: Request) {
  const logoUrl = new URL('/images/it-counts-logo.png', request.url).toString()

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        padding: 60,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 32,
        background: '#1e1e2e',
      }}>
      <img
        src={logoUrl}
        style={{ width: 600, height: 168 }}
        alt="It Counts Logo"
      />
      <p
        style={{
          fontSize: 32,
          color: '#cdd6f4',
          fontFamily: 'sans-serif',
          textAlign: 'center',
        }}>
        Track your movement and watch your level grow.
      </p>
    </div>,
    {
      width: 1200,
      height: 630,
    },
  );
}
