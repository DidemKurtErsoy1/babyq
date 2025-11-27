// app/page.tsx
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
    provider?: string; // e.g. "gemini"
  };
  error?: string;
  detail?: string;
};

const cleanAnswer = (s: string) =>
  (s || '').replace(/^🔹 AI\n|^🔸 FAQ\n|^🔺 Fallback\n/, '');

const badgeFor = (src?: 'AI' | 'FAQ' | 'FALLBACK', provider?: string) => {
  if (src === 'AI') return { emoji: '🤖', label: `Source: AI (${provider ?? 'LLM'})` };
  if (src === 'FAQ') return { emoji: '📚', label: 'Source: FAQ' };
  return { emoji: '🛟', label: 'Source: Fallback' };
};

function monthsBetween(birthISO: string) {
  if (!birthISO) return 0;
  const b = new Date(birthISO);
  const now = new Date();
  let m = (now.getFullYear() - b.getFullYear()) * 12 + (now.getMonth() - b.getMonth());
  if (now.getDate() < b.getDate()) m -= 1;
  return Math.max(0, m);
}

export default function Home() {
  const [age, setAge] = useState<string>('7');
  const [sex, setSex] = useState<'female' | 'male' | 'unknown'>('unknown');
  const [question, setQuestion] = useState<string>('Fever 38.2°C; what should I do?');
  const [loading, setLoading] = useState(false);
  const [resp, setResp] = useState<ApiResp | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastPayload, setLastPayload] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const answerRef = useRef<HTMLDivElement | null>(null);

  // Profile → age auto-fill
  useEffect(() => {
    try {
      const raw = localStorage.getItem('babyq_profile_v1');
      if (!raw) return;
      const p = JSON.parse(raw) as { birth_date?: string };
      if (!p?.birth_date) return;
      setAge(String(monthsBetween(p.birth_date)));
    } catch {}
  }, []);

  // URL params
  const showDebug = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).has('debug');
  }, []);

  const providerQuery = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return new URLSearchParams(window.location.search).get('v') || '';
  }, []);

  // Sources panel only when ?debug or ?sources
  const showSources = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const sp = new URLSearchParams(window.location.search);
    return sp.has('debug') || sp.has('sources');
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResp(null);
    setCopied(false);

    const payload = {
      ageMonths: Number(age || 0),
      question: question.trim(),
      sex, // şimdilik backend kullanmasa da ilerisi için gönderiyoruz
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

      // scroll to answer
      setTimeout(() => {
        answerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    } catch (err: any) {
      setError(err?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  const srcBadge = badgeFor(resp?.meta?.source as any, resp?.meta?.provider);

  const fieldBase = {
    width: '100%',
    padding: '13px 14px',
    borderRadius: 12,
    border: '1px solid #DED6C8',
    background: '#FBF7EE',
    color: '#111',
    outline: 'none',
    fontSize: 16,
  } as const;

  return (
    <main style={{ background: '#F7F0E5', minHeight: '100vh' }}>
      <div
        style={{
          maxWidth: 800,
          margin: '0 auto',
          padding: '32px 18px 48px',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
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
          <header style={{ marginBottom: 14 }}>
            <h1 style={{ fontSize: 34, fontWeight: 800, margin: 0, color: '#0E0A05' }}>
              Ask BabyQ
            </h1>
            <p style={{ opacity: 0.75, marginTop: 6, marginBottom: 12, fontSize: 16 }}>
              Short, parent-friendly answers. Not medical advice.
            </p>
            <div
              style={{
                border: '1px solid #F2DFB4',
                background: '#FFF8E9',
                padding: '12px 14px',
                borderRadius: 14,
                color: '#5C4A2A',
                fontSize: 14,
              }}
            >
              Not medical advice.
            </div>
          </header>

          {/* Status banners */}
          {error && (
            <div
              role="alert"
              style={{
                marginBottom: 12,
                padding: 12,
                border: '1px solid #F2B8C6',
                background: '#FFF0F4',
                color: '#7A1A2C',
                borderRadius: 12,
              }}
            >
              <strong>Error:</strong> {error}
            </div>
          )}
          {!error && resp && (
            <div
              role="status"
              style={{
                marginBottom: 12,
                padding: 12,
                border: '1px solid #E6E1D9',
                background: '#FFFCF3',
                color: '#111',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 14,
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 28,
                  height: 28,
                  borderRadius: 10,
                  background: '#F4E8D4',
                }}
              >
                {srcBadge.emoji}
              </span>
              <span>Answer ready. {srcBadge.label}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={onSubmit} style={{ display: 'grid', gap: 16 }}>
            {/* Age */}
            <label htmlFor="age" style={{ display: 'grid', gap: 8, fontSize: 15 }}>
              <span style={{ fontWeight: 700, color: '#0E0A05' }}>Baby’s age (months) 👶</span>
              <input
                id="age"
                type="number"
                min={0}
                max={60}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g., 7"
                style={fieldBase}
                onFocus={(e) =>
                  (e.currentTarget.style.boxShadow = '0 0 0 3px rgba(17,17,17,0.12)')
                }
                onBlur={(e) => (e.currentTarget.style.boxShadow = 'none')}
                required
              />
            </label>

            {/* Sex */}
            <label htmlFor="sex" style={{ display: 'grid', gap: 8, fontSize: 15 }}>
              <span style={{ fontWeight: 700, color: '#0E0A05' }}>Baby’s sex 🏷️</span>
              <select
                id="sex"
                value={sex}
                onChange={(e) => setSex(e.target.value as 'female' | 'male' | 'unknown')}
                style={fieldBase}
                onFocus={(e) =>
                  (e.currentTarget.style.boxShadow = '0 0 0 3px rgba(17,17,17,0.12)')
                }
                onBlur={(e) => (e.currentTarget.style.boxShadow = 'none')}
              >
                <option value="unknown">Prefer not to say</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
              </select>
            </label>

            {/* Question */}
            <label htmlFor="q" style={{ display: 'grid', gap: 8, fontSize: 15 }}>
              <span style={{ fontWeight: 700, color: '#0E0A05' }}>What’s your concern? ❓</span>
              <textarea
                id="q"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                rows={6}
                placeholder="Describe the issue briefly…"
                style={{ ...fieldBase, resize: 'vertical', minHeight: 140 }}
                onFocus={(e) =>
                  (e.currentTarget.style.boxShadow = '0 0 0 3px rgba(17,17,17,0.12)')
                }
                onBlur={(e) => (e.currentTarget.style.boxShadow = 'none')}
                required
              />
            </label>

            <button
              type="submit"
              disabled={loading || !question.trim()}
              aria-disabled={loading || !question.trim()}
              className="primary-btn"
              style={{
                padding: '14px 18px',
                background: loading ? '#555' : '#111',
                color: '#FAF7F0',
                borderRadius: 14,
                border: '1px solid #0E0A05',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: 700,
                letterSpacing: 0.1,
                transition: 'transform 0.15s ease, box-shadow 0.2s ease',
                boxShadow: loading ? 'none' : '0 6px 14px rgba(0,0,0,0.08)',
              }}
            >
              {loading ? 'Preparing answer…' : 'Get answer'}
            </button>
          </form>
        </section>

        {/* Answer */}
        {resp && (
          <section
            ref={answerRef}
            style={{
              marginTop: 4,
              border: '1px solid #EAE2D4',
              borderRadius: 18,
              padding: 20,
              background: '#FFFEFA',
              boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
            }}
          >
            {/* URGENT box */}
            {resp?.meta?.urgent ? (
              <div
                style={{
                  marginBottom: 14,
                  padding: 12,
                  border: '1px solid #f99',
                  background: '#fee',
                  color: '#900',
                  borderRadius: 12,
                }}
              >
                <strong>URGENT:</strong> Possible emergency. Call your local emergency number or visit the
                nearest healthcare facility.
              </div>
            ) : null}

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 12,
                flexWrap: 'wrap',
              }}
            >
              <span
                aria-label="answer source"
                title={srcBadge.label}
                style={{
                  fontSize: 12,
                  padding: '6px 10px',
                  borderRadius: 999,
                  background: '#FFF4DB',
                  border: '1px solid #F3E2B6',
                  color: '#5C4A2A',
                }}
              >
                {srcBadge.emoji} {srcBadge.label}
              </span>

              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(cleanAnswer(resp.answer || ''));
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  } catch {}
                }}
                style={{
                  marginLeft: 'auto',
                  padding: '8px 12px',
                  borderRadius: 999,
                  border: '1px solid #DDD',
                  background: '#FBF7EE',
                  color: '#111',
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                {copied ? '✅ Copied' : 'Copy answer'}
              </button>
            </div>

            <h3 style={{ fontSize: 22, fontWeight: 800, marginTop: 4, marginBottom: 10 }}>Answer</h3>
            <div style={{ whiteSpace: 'pre-wrap', marginTop: 6, lineHeight: 1.6, fontSize: 16 }}>
              {cleanAnswer(resp.answer || '')}
            </div>

            {/* Disclaimer */}
            {resp?.disclaimer && (
              <div style={{ marginTop: 14, fontSize: 13, opacity: 0.78, lineHeight: 1.5 }}>
                {resp.disclaimer}
              </div>
            )}

            {/* Sources (hidden unless ?debug or ?sources) */}
            {showSources && resp.candidates?.length ? (
              <details style={{ marginTop: 16 }}>
                <summary style={{ fontWeight: 600 }}>Show sources ({resp.candidates.length})</summary>
                <ul style={{ marginTop: 8, paddingLeft: 18, display: 'grid', gap: 8 }}>
                  {resp.candidates.map((c: any, i: number) => (
                    <li key={c.id || i}>
                      <div style={{ fontWeight: 600 }}>
                        {(c.category || 'General')} • {c.age_min}-{c.age_max} months
                      </div>
                      <div style={{ opacity: 0.8 }}>{c.question}</div>
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}

            {/* Debug (optional) */}
            {showDebug && (
              <>
                <details style={{ marginTop: 12 }}>
                  <summary>Debug (meta)</summary>
                  <pre style={{ marginTop: 8 }}>{JSON.stringify(resp.meta, null, 2)}</pre>
                </details>
                <details style={{ marginTop: 12 }}>
                  <summary>Sent payload</summary>
                  <pre style={{ marginTop: 8 }}>{JSON.stringify(lastPayload, null, 2)}</pre>
                </details>
              </>
            )}
          </section>
        )}
      </div>

      <style jsx>{`
        @media (min-width: 768px) {
          main div form .primary-btn {
            width: auto;
            min-width: 220px;
            align-self: flex-start;
          }
        }

        @media (max-width: 767px) {
          main div form .primary-btn {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}
