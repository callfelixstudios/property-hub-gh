import { ImageResponse } from 'next/og';

export const alt = 'Buy Land & Houses in Ghana — Litigation-Free | Property Hub GH';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          backgroundColor: '#0f172a',
          padding: '60px 80px',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              backgroundColor: '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: '28px',
              fontWeight: 'bold',
            }}
          >
            PH
          </div>
          <span
            style={{
              fontSize: '36px',
              fontWeight: 'bold',
              color: '#ffffff',
              letterSpacing: '-0.02em',
            }}
          >
            Property Hub <span style={{ color: '#3b82f6' }}>GH</span>
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '900px' }}>
          <div
            style={{
              fontSize: '52px',
              fontWeight: 800,
              color: '#ffffff',
              lineHeight: 1.15,
              letterSpacing: '-0.03em',
            }}
          >
            Buy Land &amp; Houses in Ghana
          </div>
          <div
            style={{
              fontSize: '24px',
              color: '#94a3b8',
              lineHeight: 1.4,
            }}
          >
            Litigation-free plots, uncompleted structures and complete residential estates across
            Greater Accra, Kumasi and all 16 regions.
          </div>
        </div>

        <div style={{ display: 'flex', gap: '20px' }}>
          <div
            style={{
              backgroundColor: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              borderRadius: '9999px',
              padding: '10px 24px',
              color: '#60a5fa',
              fontSize: '18px',
              fontWeight: 600,
            }}
          >
            ✓ Verified Listings
          </div>
          <div
            style={{
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              borderRadius: '9999px',
              padding: '10px 24px',
              color: '#34d399',
              fontSize: '18px',
              fontWeight: 600,
            }}
          >
            🛡️ SafeMove Escrow
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
