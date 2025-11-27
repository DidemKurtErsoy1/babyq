// app/legal/page.tsx
export default function LegalPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #FFF7EC 0%, #FFEFD9 28%, #FFF7EC 100%)',
      }}
    >
      <div
        style={{
          maxWidth: 820,
          margin: '0 auto',
          padding: '36px 20px 54px',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
        }}
      >
        <section
          style={{
            border: '1px solid #F0DED0',
            background: '#FFFFFF',
            borderRadius: 22,
            padding: '30px 26px',
            boxShadow: '0 14px 36px rgba(0,0,0,0.06)',
            display: 'grid',
            gap: 14,
          }}
        >
          <h1 style={{ fontSize: 33, fontWeight: 800, margin: 0, color: '#18110B' }}>Legal & Safety</h1>

          <div
            style={{
              marginTop: 10,
              border: '1px solid #F3E1B7',
              background: '#FFF3DC',
              borderRadius: 16,
              padding: '16px 18px',
              fontSize: 15,
              color: '#554A2F',
              lineHeight: 1.7,
              boxShadow: '0 10px 24px rgba(0,0,0,0.05)',
              display: 'grid',
              gap: 6,
            }}
          >
            <span style={{ fontWeight: 700, color: '#8C5A1F', display: 'inline-flex', gap: 8, alignItems: 'center' }}>
              <span role="img" aria-label="warning">
                ⚠️
              </span>
              Important disclaimer
            </span>
            <span>
              BabyQ provides general, educational information and does not offer medical diagnosis, treatment,
              or prescriptions. Always seek the advice of a qualified healthcare professional with any questions
              you may have regarding a medical condition. If you think your child may have a medical emergency,
              call your local emergency number immediately.
            </span>
          </div>

          <h2 style={{ marginTop: 18, fontSize: 24, fontWeight: 700, color: '#18110B' }}>Data</h2>
          <p style={{ opacity: 0.9, lineHeight: 1.7, fontSize: 16, color: '#1C1A17' }}>
            We store minimal data to operate the service. Questions may be logged to improve quality.
            See our Privacy section (coming soon) for details.
          </p>

          <h2 style={{ marginTop: 10, fontSize: 24, fontWeight: 700, color: '#18110B' }}>Contact</h2>
          <p style={{ opacity: 0.9, lineHeight: 1.7, fontSize: 16, color: '#1C1A17' }}>
            hello@babyq.app (placeholder)
          </p>
        </section>
      </div>
    </main>
  );
}
