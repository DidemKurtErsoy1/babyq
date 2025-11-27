// app/legal/page.tsx
export default function LegalPage() {
  return (
    <main style={{ background: '#F7F0E5', minHeight: '100vh' }}>
      <div
        style={{
          maxWidth: 800,
          margin: '0 auto',
          padding: '32px 18px 48px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <section
          style={{
            border: '1px solid #EEE',
            background: '#FFF',
            borderRadius: 18,
            padding: '28px 24px',
            boxShadow: '0 8px 28px rgba(0,0,0,0.05)',
          }}
        >
          <h1 style={{ fontSize: 32, fontWeight: 800, margin: 0, color: '#0E0A05' }}>Legal & Safety</h1>

          <div
            style={{
              marginTop: 12,
              border: '1px solid #F0E1B9',
              background: '#FFF8E2',
              borderRadius: 14,
              padding: 14,
              fontSize: 15,
              color: '#554A2F',
              lineHeight: 1.6,
            }}
          >
            BabyQ provides general, educational information and does not offer medical diagnosis, treatment,
            or prescriptions. Always seek the advice of a qualified healthcare professional with any questions
            you may have regarding a medical condition. If you think your child may have a medical emergency,
            call your local emergency number immediately.
          </div>

          <h2 style={{ marginTop: 22, fontSize: 24, fontWeight: 700, color: '#0E0A05' }}>Data</h2>
          <p style={{ opacity: 0.85, lineHeight: 1.6, fontSize: 16 }}>
            We store minimal data to operate the service. Questions may be logged to improve quality.
            See our Privacy section (coming soon) for details.
          </p>

          <h2 style={{ marginTop: 18, fontSize: 24, fontWeight: 700, color: '#0E0A05' }}>Contact</h2>
          <p style={{ opacity: 0.85, lineHeight: 1.6, fontSize: 16 }}>hello@babyq.app (placeholder)</p>
        </section>
      </div>
    </main>
  );
}
