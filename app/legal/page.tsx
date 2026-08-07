// app/legal/page.tsx
export default function LegalPage() {
  return (
    <main className="page-shell">
      <div
        style={{
          maxWidth: 780,
          margin: '0 auto',
          padding: '48px 20px 64px',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
        }}
      >
        <section className="premium-card" style={{ padding: '32px 30px', display: 'grid', gap: 16 }}>
          <h1 style={{ fontSize: 30, fontWeight: 800, margin: 0, color: 'var(--brand)', letterSpacing: '-0.02em' }}>Legal &amp; Safety</h1>

          <div className="alert alert-warn" style={{ marginTop: 6, alignItems: 'flex-start' }}>
            <span role="img" aria-label="warning" style={{ fontSize: 18 }}>⚠️</span>
            <div style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontWeight: 700 }}>Important disclaimer</span>
              <span>
                BabyQ provides general, educational information and does not offer medical diagnosis, treatment,
                or prescriptions. Always seek the advice of a qualified healthcare professional with any questions
                you may have regarding a medical condition. If you think your child may have a medical emergency,
                call your local emergency number immediately.
              </span>
            </div>
          </div>

          <h2 style={{ marginTop: 8, fontSize: 21, fontWeight: 750, color: 'var(--ink)' }}>Data</h2>
          <p style={{ lineHeight: 1.7, fontSize: 15.5, color: 'var(--ink-secondary)', margin: 0 }}>
            We store minimal data to operate the service. Questions may be logged to improve quality.
            See our Privacy section (coming soon) for details.
          </p>

          <h2 style={{ fontSize: 21, fontWeight: 750, color: 'var(--ink)' }}>Contact</h2>
          <p style={{ lineHeight: 1.7, fontSize: 15.5, color: 'var(--ink-secondary)', margin: 0 }}>
            <a href="mailto:didemkurtersoy@gmail.com" style={{ color: 'var(--accent-strong)', fontWeight: 600 }}>
              didemkurtersoy@gmail.com
            </a>
          </p>
        </section>
      </div>
    </main>
  );
}
