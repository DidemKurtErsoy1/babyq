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
    setFeedback(null);

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
    padding: '13px 14px',
    borderRadius: 14,
    border: '1px solid #E4D3BF',
    background: '#FFF9EF',
    color: '#18110B',
    outline: 'none',
    fontSize: 16,
    transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
  } as const;

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
          gap: 22,
        }}
      >
        <section
          style={{
            border: '1px solid #F0DED0',
            background: '#FFFFFF',
            borderRadius: 22,
            padding: '30px 26px',
            boxShadow: '0 14px 36px rgba(0,0,0,0.06)',
          }}
        >
          <header style={{ marginBottom: 14 }}>
            <h1 style={{ fontSize: 34, fontWeight: 800, margin: 0, color: '#18110B' }}>
              Ask BabyQ
            </h1>
            <p
              style={{
                opacity: 0.78,
                marginTop: 6,
                marginBottom: 12,
                fontSize: 16,
                color: '#6F665D',
                maxWidth: 620,
              }}
            >
              Short, parent-friendly answers. Not medical advice.
            </p>
            <div
              style={{
                border: '1px solid #F3E1B7',
                background: '#FFF3DC',
                padding: '12px 14px',
                borderRadius: 16,
                color: '#5C4A2A',
                fontSize: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span style={{ fontSize: 16 }}>⚠️</span>
              <span>Not medical advice.</span>
            </div>
          </header>

          {/* Status banners */}
          {error && (
            <div
              role="alert"
              style={{
                marginBottom: 12,
                padding: 12,
                border: '1px solid #F4C5D0',
                background: '#FFF1F3',
                color: '#7A1A2C',
                borderRadius: 14,
                boxShadow: '0 4px 12px rgba(226,74,74,0.14)',
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
                border: '1px solid #E8D7C5',
                background: '#FFF8EC',
                color: '#18110B',
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
                  borderRadius: 12,
                  background: '#FFF0D8',
                }}
              >
                {srcBadge.emoji}
              </span>
              <span>Answer ready. {srcBadge.label}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={onSubmit} style={{ display: 'grid', gap: 18 }}>
            {/* Age */}
            <label htmlFor="age" style={{ display: 'grid', gap: 8, fontSize: 15, color: '#18110B' }}>
              <span style={{ fontWeight: 700 }}>Baby’s age (months) 👶</span>
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
                  (e.currentTarget.style.boxShadow = '0 0 0 3px rgba(75,166,181,0.3)')
                }
                onBlur={(e) => (e.currentTarget.style.boxShadow = 'none')}
                required
              />
            </label>

            {/* Sex */}
            <label htmlFor="sex" style={{ display: 'grid', gap: 8, fontSize: 15, color: '#18110B' }}>
              <span style={{ fontWeight: 700 }}>Baby’s sex 🏷️</span>
              <select
                id="sex"
                value={sex}
                onChange={(e) => setSex(e.target.value as 'female' | 'male' | 'unknown')}
                style={fieldBase}
                onFocus={(e) =>
                  (e.currentTarget.style.boxShadow = '0 0 0 3px rgba(75,166,181,0.3)')
                }
                onBlur={(e) => (e.currentTarget.style.boxShadow = 'none')}
              >
                <option value="unknown">Prefer not to say</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
              </select>
            </label>

            {/* Question */}
            <label htmlFor="q" style={{ display: 'grid', gap: 8, fontSize: 15, color: '#18110B' }}>
              <span style={{ fontWeight: 700 }}>What’s your concern? ❓</span>
              <textarea
                id="q"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                rows={6}
                placeholder="Describe the issue briefly…"
                style={{ ...fieldBase, resize: 'vertical', minHeight: 170, lineHeight: 1.55 }}
                onFocus={(e) =>
                  (e.currentTarget.style.boxShadow = '0 0 0 3px rgba(75,166,181,0.3)')
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
                padding: '15px 18px',
                background: loading ? '#FFB545AA' : '#FFB545',
                color: '#ffffff',
                borderRadius: 14,
                border: '1px solid #E5A03A',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: 750,
                letterSpacing: 0.1,
                transition: 'transform 0.15s ease, box-shadow 0.2s ease, background 0.15s ease',
                boxShadow: loading ? 'none' : '0 10px 24px rgba(255,181,69,0.35)',
                opacity: loading ? 0.8 : 1,
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
              border: '1px solid #E4D3BF',
              borderRadius: 20,
              padding: 22,
              background: '#FFF9EF',
              boxShadow: '0 16px 40px rgba(0,0,0,0.08)',
            }}
          >
            {/* URGENT box */}
            {resp?.meta?.urgent ? (
              <div
                style={{
                  marginBottom: 14,
                  padding: 12,
                  border: '1px solid #E24A4A',
                  background: '#FFE8E8',
                  color: '#8C1F1F',
                  borderRadius: 14,
                  boxShadow: '0 8px 20px rgba(226,74,74,0.15)',
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
                  background: '#E7F6F8',
                  border: '1px solid #A7D5DE',
                  color: '#225A63',
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
                  border: '1px solid #C6DDE1',
                  background: '#F1FBFD',
                  color: '#1F4B52',
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                {copied ? '✅ Copied' : 'Copy answer'}
              </button>
            </div>

            <h3 style={{ fontSize: 22, fontWeight: 800, marginTop: 4, marginBottom: 10 }}>Answer</h3>
            <div
              style={{
                whiteSpace: 'pre-wrap',
                marginTop: 6,
                lineHeight: 1.65,
                fontSize: 16,
                padding: 14,
                borderRadius: 14,
                background:
                  resp?.meta?.source === 'AI'
                    ? '#F3FCFD'
                    : resp?.meta?.source === 'FAQ'
                    ? '#FFF9ED'
                    : '#FFF1F1',
                border:
                  resp?.meta?.source === 'AI'
                    ? '1px solid #A7D5DE'
                    : resp?.meta?.source === 'FAQ'
                    ? '1px solid #F0D6A3'
                    : '1px solid #E5A6A6',
              }}
            >
              {cleanAnswer(resp.answer || '')}
            </div>

            {/* Disclaimer */}
            {resp?.disclaimer && (
              <div style={{ marginTop: 14, fontSize: 13, color: '#6F665D', lineHeight: 1.55 }}>
                {resp.disclaimer}
              </div>
            )}

            {/* Feedback */}
            <div
              style={{
                marginTop: 16,
                paddingTop: 14,
                borderTop: '1px solid #EDE0D0',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              {feedback === 'sent' ? (
                <span style={{ fontSize: 14, color: '#6F665D' }}>Teşekkürler! 🙏</span>
              ) : (
                <>
                  <span style={{ fontSize: 13, color: '#6F665D' }}>Bu cevap yardımcı oldu mu?</span>
                  <button
                    onClick={() => sendFeedback(true)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 999,
                      border: '1px solid #C6DDE1',
                      background: '#F1FBFD',
                      color: '#1F4B52',
                      cursor: 'pointer',
                      fontSize: 16,
                    }}
                    aria-label="Evet, yardımcı oldu"
                  >
                    👍
                  </button>
                  <button
                    onClick={() => sendFeedback(false)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 999,
                      border: '1px solid #E4D3BF',
                      background: '#FFF9EF',
                      color: '#5C4A2A',
                      cursor: 'pointer',
                      fontSize: 16,
                    }}
                    aria-label="Hayır, yardımcı olmadı"
                  >
                    👎
                  </button>
                </>
              )}
            </div>

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

        main div form .primary-btn:not([disabled]):hover {
          background: #d6800f;
          box-shadow: 0 12px 26px rgba(214, 128, 15, 0.35);
          transform: translateY(-1px);
        }
      `}</style>
    </main>
  );
}
