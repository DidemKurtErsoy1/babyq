'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body style={{ margin: 0, fontFamily: 'sans-serif', background: '#FFF8F0', minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <div style={{ textAlign: 'center', padding: 32, maxWidth: 480 }}>
          <h2 style={{ color: '#1A3328', fontWeight: 800, marginBottom: 12 }}>Something went wrong</h2>
          <pre style={{ background: '#fff', border: '1px solid #F5B8B8', borderRadius: 12, padding: 16, fontSize: 13, color: '#8C1F1F', textAlign: 'left', whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginBottom: 20 }}>
            {error?.message ?? 'Unknown error'}
            {error?.digest ? `\n\nDigest: ${error.digest}` : ''}
          </pre>
          <button
            onClick={reset}
            style={{ padding: '12px 24px', background: '#4CAF7D', color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 700, fontSize: 15 }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
