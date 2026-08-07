// app/opengraph-image.tsx
//
// Generated at build time so link previews (WhatsApp, LinkedIn, iMessage) get a
// real 1200×630 card instead of the 512px square app icon, which most clients
// crop or letterbox badly. Sharing an answer to WhatsApp is one of the most-used
// features, so this is the image most people will actually see first.
import { ImageResponse } from 'next/og';

export const alt = 'BabyQ — trusted pediatric answers for parents';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 88px',
          background: 'linear-gradient(135deg, #FAF7F1 0%, #F1EDE3 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            fontSize: 30,
            fontWeight: 700,
            color: '#2F7A57',
            letterSpacing: -0.5,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 52,
              height: 52,
              borderRadius: 14,
              background: '#2F7A57',
              color: '#FAF7F1',
              fontSize: 28,
              fontWeight: 800,
            }}
          >
            B
          </div>
          BabyQ
        </div>

        <div
          style={{
            marginTop: 34,
            fontSize: 74,
            fontWeight: 800,
            color: '#16241D',
            letterSpacing: -2.5,
            lineHeight: 1.08,
            maxWidth: 880,
          }}
        >
          Answers for every parenting question
        </div>

        <div
          style={{
            marginTop: 26,
            fontSize: 30,
            color: '#4A5A52',
            lineHeight: 1.4,
            maxWidth: 820,
          }}
        >
          Fast, calm answers about your baby&apos;s health — with the pediatric
          sources behind them.
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 44 }}>
          {['WHO', 'AAP', 'NHS'].map((org) => (
            <div
              key={org}
              style={{
                display: 'flex',
                padding: '10px 20px',
                borderRadius: 999,
                border: '2px solid #D9D2C4',
                fontSize: 22,
                fontWeight: 700,
                color: '#4A5A52',
                letterSpacing: 1,
              }}
            >
              {org}
            </div>
          ))}
        </div>
      </div>
    ),
    size
  );
}
