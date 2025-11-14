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

type HistoryItem = {
  ts: number;
  ageMonths: number;
  sex: 'unknown' | 'female' | 'male';
  question: string;
  meta?: ApiResp['meta'];
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

function loadHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem('babyq_history_v1');
    return raw ? (JSON.parse(raw) as HistoryItem[]) : [];
  } catch {
    return [];
  }
}

function saveHistory(arr: HistoryItem[]) {
  try {
    localStorage.setItem('babyq_history_v1', JSON.stringify(arr.slice(0, 100)));
  } catch {}
}

function fmtWhen(ts: number) {
  const d = new Date(ts);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h ago`;
  return d.toLocaleString();
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
  const [toast, setToast] = useState<string | null>(null);

  // History modal
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const answerRef = useRef<HTMLDivElement | null>(null);

  // Profile'dan yaş (ay) ve cinsiyet otomatik doldur (localStorage)
  useEffect(() => {
    try {
      const raw = localStorage.getItem('babyq_profile_v1');
      if (raw) {
        const p = JSON.parse(raw) as { birth_date?: string; sex?: 'female' | 'male' | 'unknown' };
        if (p?.birth_date) setAge(String(monthsBetween(p.birth_date)));
        if (p?.sex) setSex(p.sex);
      }
    } catch {}
  }, []);

  // İlk yüklemede history çek
  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  // URL parametreleri
  const showDebug = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).has('debug');
  }, []);

  const providerQuery = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return new URLSearchParams(window.location.search).get('v') || '';
  }, []);

  // Kaynaklar default gizli; yalnızca ?debug veya ?sources varsa göster
  const showSources = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const sp = new URLSearchParams(window.location.search);
    return sp.has('debug') || sp.has('sources');
  }, []);

  // Preset chip’ler (EN)
  const presets = ['Fever', 'Cough', 'Rash', 'Vomiting', 'Diarrhea', 'Constipation', 'Sleep issue'];

  function addPreset(p: string) {
    setQuestion((q) => {
      if (!q.trim()) return p;
      if (q.toLowerCase().includes(p.toLowerCase())) return q;
      return `${q.trim()} — ${p}`;
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResp(null);
    setCopied(false);

    const payload = {
      ageMonths: Number(age || 0),
      sex, // ileride backend için hazır
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

      // History kaydı
      const arr = loadHistory();
      arr.unshift({
        ts: Date.now(),
        ageMonths: Number(age || 0),
        sex,
        question: question.trim(),
        meta: j.meta,
      });
      saveHistory(arr);
      setHistory(arr);
      setToast('Saved to history');
      setTimeout(() => setToast(null), 1400);

      // Yanıt alanına smooth scroll
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

  return (
    <main style={{ maxWidth: 720, margin: '40px auto', padding: 16, color: '#111' }}>
      {/* Inline CSS */}
      <style>{`
        @keyframes babyq-spin { to { transform: rotate(360deg); } }
        .overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.4);
          display: flex; align-items: center; justify-content: center; z-index: 60;
        }
        .modal {
          background: #FFFCF3; color:#111; border:1px solid #E6E1D9; border-radius:16px;
          width: min(720px, 92vw); max-height: 80vh; overflow: auto; padding: 16px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.25);
        }
        .chip { padding: 6px 10px; font-size: 12px; border-radius: 999px;
          border: 1px solid #E6E1D9; background: #FFFCF3; color: #111; cursor: pointer; }
        .btn {
          padding: 10px 12px; border-radius: 10px; border:1px solid #DDD; background:#FAF7F0; color:#111; cursor:pointer;
        }
        .btn.black { background:#111; color:#FAF7F0; border-color:#111; }
        .btn.ghost { background:#FFFCF3; border-color:#E6E1D9; }
        .btn.small { padding: 6px 10px; font-size: 12px; }
      `}</style>

      {/* Toast */}
      {toast && (
        <div
          role="status"
          style={{
            position: 'fixed',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#111',
            color: '#FAF7F0',
            padding: '8px 12px',
            borderRadius: 999,
            boxShadow: '0 4px 18px rgba(0,0,0,0.15)',
            fontSize: 13,
            zIndex: 50,
          }}
        >
          {toast}
        </div>
      )}

      {/* Header + History button */}
      <header style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, margin: 0 }}>Ask BabyQ</h1>
          <p style={{ opacity: 0.8, marginTop: 6 }}>Short, parent-friendly answers. Not medical advice.</p>
        </div>

        <button
          type="button"
          className="btn"
          onClick={() => setHistoryOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={historyOpen}
          aria-controls="history-modal"
          title="Show recent questions"
        >
          🕘 History
        </button>
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
            padding: 10,
            border: '1px solid #E6E1D9',
            background: '#FFFCF3',
            color: '#111',
            borderRadius: 12,
          }}
        >
          Answer ready. {srcBadge.emoji} {srcBadge.label}
        </div>
      )}

      {/* Form */}
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
        {/* Age */}
        <label htmlFor="age" style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontWeight: 600 }}>Baby’s age (months) 👶</span>
          <input
            id="age"
            type="number"
            min={0}
            max={60}
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="e.g., 7"
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 12,
              border: '1px solid #DDD',
              background: '#FAF7F0',
              color: '#111',
              outline: 'none',
            }}
            onFocus={(e) => (e.currentTarget.style.boxShadow = '0 0 0 2px #111')}
            onBlur={(e) => (e.currentTarget.style.boxShadow = 'none')}
            required
          />
        </label>

        {/* Sex */}
        <label htmlFor="sex" style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontWeight: 600 }}>Baby’s sex 🏷️</span>
          <select
            id="sex"
            value={sex}
            onChange={(e) => setSex(e.target.value as any)}
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 12,
              border: '1px solid #DDD',
              background: '#FAF7F0',
              color: '#111',
              outline: 'none',
            }}
            onFocus={(e) => (e.currentTarget.style.boxShadow = '0 0 0 2px #111')}
            onBlur={(e) => (e.currentTarget.style.boxShadow = 'none')}
          >
            <option value="unknown">Prefer not to say</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
          </select>
        </label>

        {/* Preset chips */}
        <div aria-label="quick concerns" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {presets.map((p) => (
            <button key={p} type="button" onClick={() => addPreset(p)} className="chip">
              {p}
            </button>
          ))}
        </div>

        {/* Question */}
        <label htmlFor="q" style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontWeight: 600 }}>What’s your concern? ❓</span>
          <textarea
            id="q"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={5}
            placeholder="Describe the issue briefly…"
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 12,
              border: '1px solid #DDD',
              background: '#FAF7F0',
              color: '#111',
              outline: 'none',
              resize: 'vertical',
            }}
            onFocus={(e) => (e.currentTarget.style.boxShadow = '0 0 0 2px #111')}
            onBlur={(e) => (e.currentTarget.style.boxShadow = 'none')}
            required
          />
        </label>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !question.trim()}
          aria-disabled={loading || !question.trim()}
          className="btn black"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            justifyContent: 'center',
          }}
        >
          {loading && (
            <span
              aria-hidden="true"
              style={{
                width: 14,
                height: 14,
                border: '2px solid #FAF7F0',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                display: 'inline-block',
                animation: 'babyq-spin 0.8s linear infinite',
              }}
            />
          )}
          {loading ? 'Preparing answer…' : 'Get answer'}
        </button>
      </form>

      {/* Answer */}
      {resp && (
        <section ref={answerRef} style={{ marginTop: 24 }}>
          {/* URGENT box */}
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
              <strong>URGENT:</strong> Possible emergency. Call your local emergency number
              or visit the nearest healthcare facility.
            </div>
          ) : null}

          <div
            style={{
              border: '1px solid #EEE',
              borderRadius: 16,
              padding: 16,
              background: '#FFF',
              boxShadow: '0 1px 0 rgba(0,0,0,0.03)',
            }}
          >
            {/* Header row with source badge + copy */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                aria-label="answer source"
                title={srcBadge.label}
                style={{
                  fontSize: 12,
                  padding: '4px 8px',
                  borderRadius: 999,
                  background: '#FFF4DB', // soft amber
                  border: '1px solid #F3E2B6',
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
                className="btn small"
                style={{ marginLeft: 'auto' }}
              >
                {copied ? '✅ Copied' : 'Copy answer'}
              </button>
            </div>

            <h3 style={{ fontSize: 22, fontWeight: 800, marginTop: 12, marginBottom: 6 }}>
              Answer
            </h3>
            <div style={{ whiteSpace: 'pre-wrap', marginTop: 4 }}>
              {cleanAnswer(resp.answer || '')}
            </div>

            {/* Disclaimer */}
            {resp?.disclaimer && (
              <div style={{ marginTop: 12, fontSize: 13, opacity: 0.75 }}>
                {resp.disclaimer}
              </div>
            )}

            {/* Sources (default hidden; only with ?debug or ?sources) */}
            {showSources && resp.candidates?.length ? (
              <details style={{ marginTop: 16 }}>
                <summary>Show sources ({resp.candidates.length})</summary>
                <ul style={{ marginTop: 8 }}>
                  {resp.candidates.map((c: any, i: number) => (
                    <li key={c.id || i} style={{ marginBottom: 8 }}>
                      <div style={{ fontWeight: 600 }}>
                        {(c.category || 'General')} • {c.age_min}-{c.age_max} months
                      </div>
                      <div style={{ opacity: 0.8 }}>{c.question}</div>
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}
          </div>

          {/* Debug (optional via ?debug) */}
          {showDebug && (
            <>
              <details style={{ marginTop: 12 }}>
                <summary>Debug (meta)</summary>
                <pre style={{ marginTop: 8 }}>
{JSON.stringify(resp.meta, null, 2)}
                </pre>
              </details>
              <details style={{ marginTop: 12 }}>
                <summary>Sent payload</summary>
                <pre style={{ marginTop: 8 }}>
{JSON.stringify(lastPayload, null, 2)}
                </pre>
              </details>
            </>
          )}
        </section>
      )}

      {/* History Modal */}
      {historyOpen && (
        <div className="overlay" onClick={() => setHistoryOpen(false)} aria-hidden>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="history-title"
            id="history-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <h2 id="history-title" style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>
                Recent questions
              </h2>
              <button
                className="btn ghost small"
                onClick={() => {
                  const arr = loadHistory();
                  setHistory(arr);
                }}
                title="Refresh list"
                style={{ marginLeft: 'auto' }}
              >
                Refresh
              </button>
              <button
                className="btn ghost small"
                onClick={() => {
                  saveHistory([]);
                  setHistory([]);
                }}
                title="Clear all history"
              >
                Clear all
              </button>
              <button className="btn small" onClick={() => setHistoryOpen(false)} title="Close">
                Close
              </button>
            </div>

            {history.length === 0 ? (
              <div style={{ padding: 8, opacity: 0.7 }}>No items yet.</div>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
                {history.map((h, idx) => (
                  <li
                    key={h.ts + '-' + idx}
                    style={{
                      border: '1px solid #E6E1D9',
                      background: '#FFF',
                      borderRadius: 12,
                      padding: 12,
                      display: 'grid',
                      gap: 6,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <strong style={{ fontSize: 14 }}>
                        {h.ageMonths} mo · {h.sex === 'unknown' ? '—' : h.sex}
                      </strong>
                      <span style={{ marginLeft: 'auto', fontSize: 12, opacity: 0.7 }}>
                        {fmtWhen(h.ts)}
                      </span>
                    </div>
                    <div style={{ fontSize: 14, opacity: 0.95 }}>{h.question}</div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                      <button
                        className="btn small black"
                        onClick={() => {
                          setAge(String(h.ageMonths));
                          setSex(h.sex);
                          setQuestion(h.question);
                          setHistoryOpen(false);
                          // odak soruya
                          setTimeout(() => {
                            const el = document.getElementById('q');
                            el?.focus();
                          }, 50);
                        }}
                        title="Use this question"
                      >
                        Use this
                      </button>
                      <button
                        className="btn small"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(h.question);
                            setToast('Question copied');
                            setTimeout(() => setToast(null), 1200);
                          } catch {}
                        }}
                        title="Copy question"
                      >
                        Copy
                      </button>
                      <span
                        style={{
                          marginLeft: 'auto',
                          fontSize: 12,
                          opacity: 0.75,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                        title="Answer source at the time"
                      >
                        {h.meta?.source === 'AI' ? '🤖 AI' : h.meta?.source === 'FAQ' ? '📚 FAQ' : '🛟 Fallback'}
                        {h.meta?.provider ? `· ${h.meta.provider}` : ''}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

