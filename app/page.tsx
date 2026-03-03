// app/page.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../lib/useAuth';

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
    provider?: string;
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
  const { user } = useAuth();
  const [age, setAge] = useState<string>('7');
  const [sex, setSex] = useState<'female' | 'male' | 'unknown'>('unknown');
  const [question, setQuestion] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [resp, setResp] = useState<ApiResp | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastPayload, setLastPayload] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<null | 'sent'>(null);
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
    setFeedback(null);

    const payload = {
      ageMonths: Number(age || 0),
      question: question.trim(),
      sex,
      userId: user?.id ?? null,
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

  async function sendFeedback(was_helpful: boolean) {
    setFeedback('sent');
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_text: question.trim(),
          age_months: Number(age || 0),
          was_helpful,
        }),
      });
    } catch {}
  }

  const fieldBase = {
    width: '100%',
    padding: '13px 16px',
    borderRadius: 14,
    border: '1.5px solid #C8E2D4',
    background: '#FAFFF9',
    color: '#2D3436',
    outline: 'none',
    fontSize: 16,
    fontFamily: 'inherit',
    transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
  } as const;

  return (
    <main style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #FFF8F0 0%, #F0FAF4 40%, #FFF8F0 100%)' }}>
      <div
        style={{
          maxWidth: 960,
          margin: '0 auto',
          padding: '36px 20px 64px',
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
        }}
      >
        {/* ── Hero ── */}
        <section
          style={{
            borderRadius: 28,
            background: 'linear-gradient(135deg, #E8F7F0 0%, #F3FBF7 60%, #E5F5ED 100%)',
            border: '1px solid #C0E0CE',
            padding: '44px 40px',
            display: 'flex',
            gap: 36,
            alignItems: 'center',
            overflow: 'hidden',
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: '#4CAF7D',
                color: '#fff',
                padding: '5px 14px',
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 700,
                marginBottom: 20,
              }}
            >
              🌿 Trusted pediatric Q&amp;A
            </div>
            <h1
              style={{
                fontSize: 'clamp(28px, 4vw, 46px)',
                fontWeight: 900,
                color: '#1A3328',
                lineHeight: 1.12,
                margin: '0 0 16px',
                letterSpacing: '-0.5px',
              }}
            >
              Answers for every<br />
              parenting question
            </h1>
            <p
              style={{
                fontSize: 17,
                color: '#3D6B52',
                lineHeight: 1.65,
                margin: '0 0 28px',
                maxWidth: 440,
              }}
            >
              Fast, clear answers about your baby's health — backed by trusted
              pediatric guidelines. Always consult your doctor for emergencies.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, fontSize: 14, color: '#3D6B52', fontWeight: 700 }}>
              <span>✓ TR / EN bilingual</span>
              <span>✓ Urgent alert detection</span>
              <span>✓ Pediatric-backed</span>
            </div>
          </div>

          <div className="hero-img-wrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1519689680058-324335c77eba?w=520&h=520&fit=crop&auto=format&q=80"
              alt="Parent and baby"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: 22,
                boxShadow: '0 24px 56px rgba(76, 175, 125, 0.22)',
              }}
            />
          </div>
        </section>

        {/* ── Ask form ── */}
        <section
          style={{
            border: '1px solid #C8E2D4',
            background: '#FFFFFF',
            borderRadius: 26,
            padding: '32px 30px',
            boxShadow: '0 12px 40px rgba(44, 122, 86, 0.09)',
          }}
        >
          <header style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 6px', color: '#1A3328' }}>
              Ask BabyQ
            </h2>
            <p style={{ opacity: 0.85, marginTop: 4, marginBottom: 14, fontSize: 16, color: '#4A6B55' }}>
              Short, parent-friendly answers. Not medical advice.
            </p>
            <div
              style={{
                border: '1px solid #F0C070',
                background: '#FFFBF0',
                padding: '11px 14px',
                borderRadius: 14,
                color: '#7A4A10',
                fontSize: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span style={{ fontSize: 16 }}>⚠️</span>
              <span>This is not medical advice. In emergencies, call your local emergency number.</span>
            </div>
          </header>

          {/* Status banners */}
          {error && (
            <div
              role="alert"
              style={{
                marginBottom: 14,
                padding: 13,
                border: '1px solid #F5B8B8',
                background: '#FFF5F5',
                color: '#8C1F1F',
                borderRadius: 14,
              }}
            >
              <strong>Error:</strong> {error}
            </div>
          )}
          {!error && resp && (
            <div
              role="status"
              style={{
                marginBottom: 14,
                padding: 12,
                border: '1px solid #A8DDB8',
                background: '#EDF9F3',
                color: '#1A3328',
                borderRadius: 14,
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
                  background: '#C8EDD8',
                }}
              >
                {srcBadge.emoji}
              </span>
              <span>Answer ready. {srcBadge.label}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={onSubmit} style={{ display: 'grid', gap: 20 }}>
            {/* Age */}
            <label htmlFor="age" style={{ display: 'grid', gap: 8, fontSize: 15, color: '#2D3436' }}>
              <span style={{ fontWeight: 700 }}>Baby's age (months) 👶</span>
              <input
                id="age"
                type="number"
                min={0}
                max={60}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g., 7"
                style={fieldBase}
                onFocus={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(76,175,125,0.25)';
                  e.currentTarget.style.borderColor = '#4CAF7D';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = '#C8E2D4';
                }}
                required
              />
            </label>

            {/* Sex */}
            <label htmlFor="sex" style={{ display: 'grid', gap: 8, fontSize: 15, color: '#2D3436' }}>
              <span style={{ fontWeight: 700 }}>Baby's sex 🏷️</span>
              <select
                id="sex"
                value={sex}
                onChange={(e) => setSex(e.target.value as 'female' | 'male' | 'unknown')}
                style={fieldBase}
                onFocus={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(76,175,125,0.25)';
                  e.currentTarget.style.borderColor = '#4CAF7D';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = '#C8E2D4';
                }}
              >
                <option value="unknown">Prefer not to say</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
              </select>
            </label>

            {/* Question */}
            <label htmlFor="q" style={{ display: 'grid', gap: 8, fontSize: 15, color: '#2D3436' }}>
              <span style={{ fontWeight: 700 }}>What's your concern? ❓</span>
              <textarea
                id="q"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                rows={6}
                placeholder="Describe the issue briefly…"
                style={{ ...fieldBase, resize: 'vertical', minHeight: 170, lineHeight: 1.55 }}
                onFocus={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(76,175,125,0.25)';
                  e.currentTarget.style.borderColor = '#4CAF7D';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = '#C8E2D4';
                }}
                required
              />
            </label>

            <button
              type="submit"
              disabled={loading || !question.trim()}
              aria-disabled={loading || !question.trim()}
              className="submit-btn"
              style={{
                padding: '16px 22px',
                background: loading
                  ? '#A8D9BE'
                  : 'linear-gradient(135deg, #4CAF7D 0%, #3D9A6D 100%)',
                color: '#ffffff',
                borderRadius: 16,
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: 800,
                fontSize: 17,
                fontFamily: 'inherit',
                letterSpacing: 0.2,
                transition: 'transform 0.15s ease, box-shadow 0.2s ease',
                boxShadow: loading ? 'none' : '0 10px 28px rgba(76, 175, 125, 0.35)',
                opacity: loading ? 0.75 : 1,
              }}
            >
              {loading ? 'Preparing answer…' : '✨ Get answer'}
            </button>
          </form>
        </section>

        {/* ── Answer ── */}
        {resp && (
          <section
            ref={answerRef}
            style={{
              border: '1px solid #C8E2D4',
              borderRadius: 26,
              padding: '28px 30px',
              background: '#FFFFFF',
              boxShadow: '0 16px 48px rgba(44, 122, 86, 0.1)',
            }}
          >
            {/* URGENT box */}
            {resp?.meta?.urgent && (
              <div
                style={{
                  marginBottom: 16,
                  padding: 14,
                  border: '1px solid #F5B8B8',
                  background: '#FFF5F5',
                  color: '#8C1F1F',
                  borderRadius: 14,
                  fontWeight: 600,
                }}
              >
                🚨 <strong>URGENT:</strong> Possible emergency. Call your local emergency number or visit the nearest healthcare facility immediately.
              </div>
            )}

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 14,
                flexWrap: 'wrap',
              }}
            >
              <span
                aria-label="answer source"
                title={srcBadge.label}
                style={{
                  fontSize: 12,
                  padding: '6px 12px',
                  borderRadius: 999,
                  background: '#E2F5EC',
                  border: '1px solid #A8DDB8',
                  color: '#1E5E3A',
                  fontWeight: 700,
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
                  padding: '7px 14px',
                  borderRadius: 999,
                  border: '1px solid #B5DCC8',
                  background: '#EEF9F3',
                  color: '#1E5E3A',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: 'inherit',
                }}
              >
                {copied ? '✅ Copied' : 'Copy answer'}
              </button>
            </div>

            <h3 style={{ fontSize: 22, fontWeight: 800, marginTop: 4, marginBottom: 12, color: '#1A3328' }}>Answer</h3>
            <div
              style={{
                whiteSpace: 'pre-wrap',
                marginTop: 6,
                lineHeight: 1.7,
                fontSize: 16,
                padding: '16px 18px',
                borderRadius: 16,
                background:
                  resp?.meta?.source === 'AI'
                    ? '#F0FBF5'
                    : resp?.meta?.source === 'FAQ'
                    ? '#FFFBF0'
                    : '#FFF5F5',
                border:
                  resp?.meta?.source === 'AI'
                    ? '1px solid #A8DDB8'
                    : resp?.meta?.source === 'FAQ'
                    ? '1px solid #F0C070'
                    : '1px solid #F5B8B8',
                color: '#2D3436',
              }}
            >
              {cleanAnswer(resp.answer || '')}
            </div>

            {/* Disclaimer */}
            {resp?.disclaimer && (
              <div style={{ marginTop: 14, fontSize: 13, color: '#636E72', lineHeight: 1.6 }}>
                {resp.disclaimer}
              </div>
            )}

            {/* Feedback */}
            <div
              style={{
                marginTop: 18,
                paddingTop: 16,
                borderTop: '1px solid #D8E8DC',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              {feedback === 'sent' ? (
                <span style={{ fontSize: 14, color: '#4A6B55', fontWeight: 600 }}>Teşekkürler! 🙏</span>
              ) : (
                <>
                  <span style={{ fontSize: 13, color: '#636E72', fontWeight: 600 }}>Bu cevap yardımcı oldu mu?</span>
                  <button
                    onClick={() => sendFeedback(true)}
                    style={{
                      padding: '6px 16px',
                      borderRadius: 999,
                      border: '1px solid #A8DDB8',
                      background: '#EEF9F3',
                      color: '#1E5E3A',
                      cursor: 'pointer',
                      fontSize: 16,
                      fontFamily: 'inherit',
                    }}
                    aria-label="Evet, yardımcı oldu"
                  >
                    👍
                  </button>
                  <button
                    onClick={() => sendFeedback(false)}
                    style={{
                      padding: '6px 16px',
                      borderRadius: 999,
                      border: '1px solid #D8E8DC',
                      background: '#F5FAF7',
                      color: '#636E72',
                      cursor: 'pointer',
                      fontSize: 16,
                      fontFamily: 'inherit',
                    }}
                    aria-label="Hayır, yardımcı olmadı"
                  >
                    👎
                  </button>
                </>
              )}
            </div>

            {/* Sources */}
            {showSources && resp.candidates?.length ? (
              <details style={{ marginTop: 18 }}>
                <summary style={{ fontWeight: 700, color: '#3D6B52', cursor: 'pointer' }}>
                  Show sources ({resp.candidates.length})
                </summary>
                <ul style={{ marginTop: 10, paddingLeft: 18, display: 'grid', gap: 8 }}>
                  {resp.candidates.map((c: any, i: number) => (
                    <li key={c.id || i}>
                      <div style={{ fontWeight: 700 }}>
                        {(c.category || 'General')} • {c.age_min}-{c.age_max} months
                      </div>
                      <div style={{ opacity: 0.8 }}>{c.question}</div>
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}

            {/* Debug */}
            {showDebug && (
              <>
                <details style={{ marginTop: 14 }}>
                  <summary>Debug (meta)</summary>
                  <pre style={{ marginTop: 8 }}>{JSON.stringify(resp.meta, null, 2)}</pre>
                </details>
                <details style={{ marginTop: 14 }}>
                  <summary>Sent payload</summary>
                  <pre style={{ marginTop: 8 }}>{JSON.stringify(lastPayload, null, 2)}</pre>
                </details>
              </>
            )}
          </section>
        )}
      </div>

      <style jsx>{`
        .hero-img-wrap {
          flex-shrink: 0;
          width: 280px;
          height: 280px;
        }
        @media (max-width: 700px) {
          .hero-img-wrap {
            display: none;
          }
        }

        @media (min-width: 640px) {
          .submit-btn {
            width: auto;
            min-width: 240px;
            align-self: flex-start;
          }
        }
        @media (max-width: 639px) {
          .submit-btn {
            width: 100%;
          }
        }

        .submit-btn:not([disabled]):hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 32px rgba(76, 175, 125, 0.42);
        }
        .submit-btn:not([disabled]):active {
          transform: translateY(0);
        }
      `}</style>
    </main>
  );
}
