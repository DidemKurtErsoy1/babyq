'use client';

import { useEffect } from 'react';
import { getPostHog } from '../lib/posthog';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    getPostHog()?.capture('client_error', {
      source: 'global-error',
      message: error?.message?.slice(0, 300),
      stack: error?.stack?.slice(0, 1000),
      digest: error?.digest,
    });
  }, [error]);

  return (
    <html>
      <body style={{ margin: 0, fontFamily: 'sans-serif', background: '#FAF7F1', minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <div style={{ textAlign: 'center', padding: 32, maxWidth: 480 }}>
          <h2 style={{ color: '#12271E', fontWeight: 800, marginBottom: 12 }}>Something went wrong</h2>
          <pre style={{ background: '#fff', border: '1px solid #F0C6C3', borderRadius: 14, padding: 16, fontSize: 13, color: '#7A2323', textAlign: 'left', whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginBottom: 20 }}>
            {error?.message ?? 'Unknown error'}
            {error?.digest ? `\n\nDigest: ${error.digest}` : ''}
          </pre>
          <button
            onClick={reset}
            style={{ padding: '12px 26px', background: 'linear-gradient(135deg, #3a9068, #2F7A57)', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 15, boxShadow: '0 8px 22px rgba(47,122,87,0.32)' }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
