/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from 'next/og';

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0f0f0f',
          flexDirection: 'column',
          padding: 60,
          fontSize: 36,
          color: 'white',
          fontFamily: 'Arial',
        }}>
        <img
          src="https://www.mrbubbles-src.dev/logo-og.svg"
          width="650"
          height="160"
          style={{ marginBottom: 40 }}
          alt="mrbubbles-src.dev logo"
        />
        <div style={{ fontSize: 48, fontWeight: 'bold' }}>
          Manuel Fahrenholz
        </div>
        <div style={{ fontSize: 28, marginTop: 12, color: '#cccccc' }}>
          Fullstack Web Developer
        </div>
        <div style={{ fontSize: 20, marginTop: 8 }}>mrbubbles-src.dev</div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
