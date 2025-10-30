'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type ApiResp = {
  answer?: string;
  candidates?: any[];
  disclaimer?: string;
  meta?: {
    source?: 'AI' | 'FAQ' | 'FALLBACK';
    llmUsed?: boolean;
    llmError?: string | null;
    matchedFaqs?: number;
    urgent?: boolean;
    provider?: string; // e.g., "gemini"
  };
  error?: string;
  detail?: string;
};

const cleanAnswer = (s: string) =>
  (s || '').replace(/^🔹 AI\n|^🔸 FAQ\n|^🔺 Fallback\n/, '');

export default function Home() {
  const [age, setAge] = useState<string>('7');
  const [question, setQuestion] = useState<string>('Fever 38.2°C; what should I do?');
  const [loading, setLoading] = useState(false);
  const [resp, setResp] = useState<ApiResp | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastPayload, setLastPayload] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const answerRef = useRef<HTMLDivElement | null>(null);

  // Autofill age (months) from profile in localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('babyq_profile_v1');
      if (!raw) return;
      const p = JSON.parse(raw) as { birth_date?: string };
      if (!p?.birth_date) return;

      const monthsBetween = (birthISO: string) => {
        const b = new Date(birthISO);
        const now = new Date();
        let m =
          (now.getFullYear() - b.getFullYear()) * 12 +
          (now.getMonth() - b.getMonth());
        if (now.getDate() < b.getDate()) m -= 1;
        return Math.max(0, m);
      };

      setAge(String(monthsBetween(p.birth_date)));
    } catch {
      /* ignore */
    }
  }, []);

  // URL params: ?debug=1 and ?v=provider
  const showDebug = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).has('debug');
  }, []);
  const providerQuery = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return new URLSearchParams(window.location.search).get('v') || '';
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResp(null);
    setCopied(false);

    const payload = {
      ageMonths: Number(age || 0),
      question: question.trim(),
    };
    setLastPayload(payload);

    try {
      const url = providerQuery ? `/api/ask?v=${providerQuery}` : '/api/ask';
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const j = (await r.json()) as ApiResp;
      if (!r.ok) throw new Error(j?.error || j?.detail || `HTTP ${r.status}`);
      setResp(j);

      // Auto-scroll to answer
      setTimeout(() => {
        answerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    } catch (err: any) {
      setError(err?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  function sourceBadge(meta?: ApiResp['meta']) {
    if (!meta?.source) return null;
    const m = meta.source;
    const provider = meta.provider ? ` (${meta.provider})` : '';
    const baseStyle: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      fontSize: 12,
      padding: '6px 10px',
      borderRadius: 999,
      border: '1px solid #DDD',
      background: '#FAF7F0',
    };
    const label =
      m === 'AI' ? `Source: AI${provider}` :
      m === 'FAQ' ? 'Source: FAQ' :
      'Source: Fallback';

    const emoji = m === 'AI' ? '🤖'
      : m === 'FAQ' ? '📚'
      : '🛟';

    return (
      <span aria-label="answer-source" style={baseStyle}>
        <span>{emoji}</span> {label}
      </span>
    );
  }

  async function onCopy() {
    try {
      const text = cleanAnswer(resp?.answer || '').trim();
      if (!text) return;
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore
    }
  }

  return (
    <main style={{ maxWidth: 720, margin: '40px auto', padding: 16 }}>
      <header style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 6 }}>Ask BabyQ 👶</h1>
        <p style={{ opacity: 0.8 }}>
          Quick, parent-friendly guidance. Keep it short; we’ll highlight red flags when needed.
        </p>
      </header>

      {/* Status banners */}
      {error && (
        <div
          role="status"
          style={{
            marginBottom: 16,
            padding: 12,
            border: '1px solid #e6b3c6',
            background: '#fff0f6',
            borderRadius: 12,
            color: '#741b47'
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {!error && loading && (
        <div
          role="status"
          style={{
            marginBottom: 16,
            padding: 12,
            border: '1px solid #DDD',
            background: '#FAF7F0',
            borderRadius: 12,
          }}
        >
          Preparing your answer…
        </div>
      )}

      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
        <label style={{ fontWeight: 600, color: '#111' }} htmlFor="age">
          Baby’s age (months) 🏷️
        </label>
        <input
          id="age"
          type="number"
          min={0}
          max={60}
          value={age}
          onChange={(e) => setAge(e.target.value)}
          placeholder="e.g., 9"
          aria-label="Baby age in months"
          style={{
            width: '100%',
            padding: 12,
            background: '#FAF7F0',
            color: '#111',
            border: '1px solid #DDD',
            borderRadius: 12,
            outline: 'none',
          }}
          onFocus={(e) => (e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,0,0,.15)')}
          onBlur={(e) => (e.currentTarget.style.boxShadow = 'none')}
          required
        />

        <label style={{ fontWeight: 600, color: '#111' }} htmlFor="q">
          What’s your concern? ❓
        </label>
        <textarea
          id="q"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={5}
          placeholder="Briefly describe the symptoms (e.g., Cough and 38.2°C fever since last night)."
          aria-label="Describe your concern"
          style={{
            width: '100%',
            padding: 12,
            background: '#FAF7F0',
            color: '#111',
            border: '1px solid #DDD',
            borderRadius: 12,
            outline: 'none',
            resize: 'vertical'
          }}
          onFocus={(e) => (e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,0,0,.15)')}
          onBlur={(e) => (e.currentTarget.style.boxShadow = 'none')}
          required
        />

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="submit"
            disabled={loading || !question.trim()}
            aria-disabled={loading || !question.trim()}
            style={{
              padding: '14px 16px',
              background: loading ? '#444' : '#111',
              color: '#FAF7F0',
              borderRadius: 12,
              border: 0,
              cursor: loading ? 'not-allowed' : 'pointer',
              minWidth: 140,
              fontWeight: 600,
            }}
          >
            {loading ? 'Preparing…' : 'Get Answer'}
          </button>

          <button
            type="button"
            disabled={!resp?.answer}
            onClick={onCopy}
            aria-disabled={!resp?.answer}
            style={{
              padding: '14px 16px',
              background: '#FAF7F0',
              color: '#111',
              borderRadius: 12,
              border: '1px solid #DDD',
              cursor: resp?.answer ? 'pointer' : 'not-allowed',
              minWidth: 140,
              fontWeight: 600,
            }}
          >
            {copied ? 'Copied ✅' : 'Copy answer'}
          </button>
        </div>
      </form>

      {resp && (
        <section ref={answerRef} style={{ marginTop: 24 }}>
          {/* URGENT banner (server meta) */}
          {resp?.meta?.urgent ? (
            <div
              style={{
                marginBottom: 12,
                padding: 12,
                border: '1px solid #f99',
                background: '#fee',
                color: '#900',
                borderRadius: 12,
              }}
            >
              <strong>URGENT:</strong> Possible emergency. Call your local emergency number or visit the nearest facility.
            </div>
          ) : null}

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <h3 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Answer</h3>
            {sourceBadge(resp.meta)}
          </div>

          <div
            style={{
              whiteSpace: 'pre-wrap',
              marginTop: 8,
              background: '#fff',
              border: '1px solid #EEE',
              borderRadius: 12,
              padding: 12,
            }}
          >
            {cleanAnswer(resp.answer || '')}
          </div>

          {/* Disclaimer */}
          {resp?.disclaimer && (
            <div style={{ marginTop: 10, fontSize: 13, opacity: 0.75 }}>
              {resp.disclaimer}
            </div>
          )}

          {/* Candidates (FAQ context list) */}
          {resp.candidates?.length ? (
            <details style={{ marginTop: 14 }}>
              <summary>Show sources ({resp.candidates.length})</summary>
              <ul style={{ marginTop: 8 }}>
                {resp.candidates.map((c: any, i: number) => (
                  <li key={c.id || i} style={{ marginBottom: 8 }}>
                    <div style={{ fontWeight: 600 }}>
                      {c.category || 'General'} • {c.age_min}-{c.age_max} months
                    </div>
                    <div style={{ opacity: 0.8 }}>{c.question}</div>
                  </li>
                ))}
              </ul>
            </details>
          ) : null}

          {/* Debug panels only with ?debug=1 */}
          {showDebug && (
            <>
              <details style={{ marginTop: 12 }}>
                <summary>Debug (meta)</summary>
                <pre style={{ marginTop: 8 }}>
{JSON.stringify(resp.meta, null, 2)}
                </pre>
              </details>

              <details style={{ marginTop: 12 }}>
                <summary>Request payload</summary>
                <pre style={{ marginTop: 8 }}>
{JSON.stringify(lastPayload, null, 2)}
                </pre>
              </details>
            </>
          )}
        </section>
      )}
    </main>
  );
}
