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
          background: 'transparent',
          flexDirection: 'column',
          padding: 60,
          fontSize: 36,
          color: 'white',
          fontFamily: 'Fira Code, Poppins, Montserrat, sans-serif',
        }}>
        <img
          src="https://thecodingvault.mrbubbles-src.dev/logo-og.svg"
          width="650"
          height="160"
          style={{ marginBottom: 40 }}
          alt="thecodingvault.mrbubbles-src.dev logo"
        />
        <div style={{ fontSize: 48, fontWeight: 'bold' }}>The Coding Vault</div>
        <div style={{ fontSize: 28, marginTop: 12, color: '#cccccc' }}>
          Ein Ort für alle deine Coding-Fragen!
        </div>
        <div style={{ fontSize: 20, marginTop: 8 }}>
          thecodingvault.mrbubbles-src.dev
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
