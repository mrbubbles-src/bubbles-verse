/* eslint-disable @next/next/no-img-element */

import { ImageResponse } from 'next/og';

/**
 * Serves the It Counts Open Graph image (1200×630) for link previews.
 * Renders the logo and tagline on a Catppuccin Mocha base background.
 */
export async function GET() {
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
        src="https://it-counts.vercel.app/images/it-counts-logo.png"
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
