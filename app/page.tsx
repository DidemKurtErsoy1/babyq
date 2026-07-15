// app/page.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../lib/useAuth';
import { getSupabaseBrowser } from '../lib/supabaseBrowser';
import { getPostHog } from '../lib/posthog';

/* ── Types ── */
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

/* ── Helpers ── */
const cleanAnswer = (s: string) =>
  (s || '').replace(/^🔹 AI\n|^🔸 FAQ\n|^🔺 Fallback\n/, '');

const badgeFor = (src?: 'AI' | 'FAQ' | 'FALLBACK', provider?: string) => {
  if (src === 'AI')  return { emoji: '🤖', label: `AI · ${provider ?? 'LLM'}`, cls: 'badge-gold' };
  if (src === 'FAQ') return { emoji: '📚', label: 'FAQ', cls: 'badge-accent' };
  return { emoji: '🛟', label: 'Fallback', cls: 'badge-neutral' };
};

type Baby = {
  id: string;
  name: string;
  birth_date: string;
  sex: 'female' | 'male' | 'unknown';
};

function monthsBetween(birthISO: string) {
  if (!birthISO) return 0;
  const b = new Date(birthISO);
  const now = new Date();
  let m = (now.getFullYear() - b.getFullYear()) * 12 + (now.getMonth() - b.getMonth());
  if (now.getDate() < b.getDate()) m -= 1;
  return Math.max(0, m);
}

const CHIPS = [
  { label: 'Fever',   emoji: '🌡️' },
  { label: 'Sleep',   emoji: '😴' },
  { label: 'Feeding', emoji: '🍼' },
  { label: 'Crying',  emoji: '😢' },
  { label: 'Rash',    emoji: '🔴' },
];

/* ── Component ── */
export default function Home() {
  const { user } = useAuth();

  const [age,       setAge]       = useState<string>('7');
  const [sex,       setSex]       = useState<'female' | 'male' | 'unknown'>('unknown');
  const [question,  setQuestion]  = useState<string>('');
  const [loading,   setLoading]   = useState(false);
  const [resp,      setResp]      = useState<ApiResp | null>(null);
  const [error,     setError]     = useState<string | null>(null);
  const [lastPayload, setLastPayload] = useState<any>(null);
  const [copied,    setCopied]    = useState(false);
  const [feedback,  setFeedback]  = useState<null | 'sent'>(null);
  const [showChips, setShowChips] = useState(false);
  const [babies,    setBabies]    = useState<Baby[]>([]);
  const [selectedBabyId, setSelectedBabyId] = useState<string | null>(null);

  const answerRef = useRef<HTMLElement>(null);
  const formRef   = useRef<HTMLElement>(null);
  const askStartedRef = useRef(false);

  function pickBaby(b: Baby) {
    setSelectedBabyId(b.id);
    setAge(String(monthsBetween(b.birth_date)));
    setSex(b.sex);
  }

  /* Saved babies → quick-select + age auto-fill */
  useEffect(() => {
    async function load() {
      let loaded: Baby[] = [];
      if (user) {
        const supa = getSupabaseBrowser();
        if (supa) {
          const { data } = await supa
            .from('babies')
            .select('id, name, birth_date, sex')
            .order('created_at', { ascending: true });
          loaded = (data as Baby[]) || [];
        }
      } else {
        try {
          const raw = localStorage.getItem('babyq_babies_v1');
          if (raw) loaded = JSON.parse(raw);
        } catch {}
        if (loaded.length === 0) {
          // Pre-multi-baby localStorage shape
          try {
            const legacyRaw = localStorage.getItem('babyq_profile_v1');
            if (legacyRaw) {
              const p = JSON.parse(legacyRaw) as { baby_name?: string; birth_date?: string };
              if (p?.birth_date) setAge(String(monthsBetween(p.birth_date)));
            }
          } catch {}
        }
      }
      setBabies(loaded);
      if (loaded.length === 1) pickBaby(loaded[0]);
    }
    load();
  }, [user]);

  /* URL params */
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

  /* Submit */
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResp(null);
    setCopied(false);
    setFeedback(null);

    const payload = {
      ageMonths: Number(age || 0),
      question:  question.trim(),
      sex,
      userId:    user?.id ?? null,
      // Guest-saved babies only exist in localStorage, not in the babies
      // table, so their id would violate questions.baby_id's foreign key.
      babyId:    user ? selectedBabyId : null,
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
      // The API returns HTTP 400 with a friendly `answer` (e.g. "question too short")
      // for pre-checks that aren't real errors — only throw when there's no answer to show.
      if (!r.ok && !j?.answer) throw new Error(j?.error || j?.detail || `HTTP ${r.status}`);
      setResp(j);
      getPostHog()?.capture('answer_received', {
        source: j.meta?.source,
        provider: j.meta?.provider,
        urgent: j.meta?.urgent,
        has_baby: !!selectedBabyId,
        signed_in: !!user,
      });
      setTimeout(() => answerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
    } catch (err: any) {
      setError(err?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  /* Feedback */
  async function sendFeedback(was_helpful: boolean) {
    setFeedback('sent');
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question_text: question.trim(), age_months: Number(age || 0), was_helpful }),
      });
    } catch {}
  }

  /* Derived */
  const srcBadge  = badgeFor(resp?.meta?.source as any, resp?.meta?.provider);
  const isUrgent  = !!resp?.meta?.urgent;
  const sliderPct = `${Math.round((Math.max(0, Math.min(60, Number(age))) / 60) * 100)}%`;
  const ageLabel  = age === '0' ? 'Newborn' : `${age} ${age === '1' ? 'month' : 'months'}`;

  return (
    <main className="page-shell">

      {/* ═══════════════════════════════════════
          HERO
      ═══════════════════════════════════════ */}
      <section className="hero">
        {/* glow orbs */}
        <div className="hero-orb" style={{ width: 420, height: 420, top: -120, left: -80, background: 'radial-gradient(circle, #3a9068 0%, transparent 70%)' }} />
        <div className="hero-orb" style={{ width: 360, height: 360, bottom: -140, right: 40, background: 'radial-gradient(circle, #B8863B 0%, transparent 70%)' }} />

        <div style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: '84px 32px 92px',
          display: 'flex',
          alignItems: 'center',
          gap: 56,
          position: 'relative',
        }}>
          {/* Left: text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Pill badge */}
            <div className="glass-chip" style={{ marginBottom: 26 }}>
              <span style={{
                width: 7, height: 7, borderRadius: '50%',
                background: '#F3D99B', boxShadow: '0 0 0 3px rgba(243,217,155,0.25)',
                display: 'inline-block',
              }} />
              Trusted pediatric Q&amp;A
            </div>

            <h1 style={{
              fontSize: 'clamp(34px, 5.4vw, 58px)',
              fontWeight: 800,
              lineHeight: 1.08,
              color: '#fff',
              letterSpacing: '-1px',
              margin: '0 0 22px',
            }}>
              Answers for every<br /><span className="grad-text">parenting question</span>
            </h1>

            <p style={{
              fontSize: 17.5,
              color: 'rgba(255,255,255,0.72)',
              lineHeight: 1.65,
              margin: '0 0 34px',
              maxWidth: 460,
            }}>
              Fast, clear answers about your baby's health — backed by trusted
              pediatric guidelines. Always consult your doctor for emergencies.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 34 }}>
              <button
                onClick={() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '16px 32px',
                  background: 'linear-gradient(135deg, #3a9068 0%, #2F7A57 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 12,
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: 16,
                  fontFamily: 'inherit',
                  boxShadow: '0 10px 30px rgba(47,122,87,0.45), inset 0 1px 0 rgba(255,255,255,0.25)',
                  transition: 'transform 0.15s ease, box-shadow 0.2s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(47,122,87,0.55), inset 0 1px 0 rgba(255,255,255,0.25)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(47,122,87,0.45), inset 0 1px 0 rgba(255,255,255,0.25)'; }}
              >
                Get instant answers →
              </button>
            </div>

            {/* feature chips */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <div className="glass-chip">⚡ Seconds, not searches</div>
              <div className="glass-chip">🌍 TR &amp; EN</div>
              <div className="glass-chip">🛟 Safety-first</div>
            </div>
          </div>

          {/* Right: photo with glow ring + floating card */}
          <div className="hero-photo">
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=600"
                alt="Happy baby"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: 24,
                  boxShadow: '0 40px 80px rgba(0,0,0,0.45)',
                  border: '1px solid rgba(255,255,255,0.14)',
                  display: 'block',
                }}
              />
              {/* floating mini answer card */}
              <div className="hero-float-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                  <span className="badge badge-gold">🤖 AI</span>
                  <span style={{ fontSize: 11.5, color: 'var(--ink-tertiary)', fontWeight: 600 }}>7 mo · fever</span>
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--ink-secondary)', lineHeight: 1.5 }}>
                  Keep them lightly dressed, offer fluids often, and watch how they’re acting…
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          TRUST STRIP
      ═══════════════════════════════════════ */}
      <div style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        padding: '13px 24px',
      }}>
        <div style={{
          maxWidth: 1100,
          margin: '0 auto',
          display: 'flex',
          gap: 10,
          justifyContent: 'center',
          alignItems: 'center',
          flexWrap: 'wrap',
          fontSize: 13,
          fontWeight: 500,
          color: 'var(--ink-secondary)',
        }}>
          <span>🔒 Not medical advice</span>
          <span style={{ color: 'var(--border-strong)', userSelect: 'none' }}>•</span>
          <span>✓ Pediatric-backed</span>
          <span style={{ color: 'var(--border-strong)', userSelect: 'none' }}>•</span>
          <span>🌍 TR/EN bilingual</span>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          PAGE BODY
      ═══════════════════════════════════════ */}
      <div style={{
        maxWidth: 760,
        margin: '0 auto',
        padding: '52px 24px 96px',
        display: 'flex',
        flexDirection: 'column',
        gap: 28,
      }}>

        {/* ── ASK FORM ── */}
        <section
          ref={formRef}
          id="ask-form"
          className="premium-card"
          style={{
            padding: '40px 36px',
          }}
        >
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 6px', color: 'var(--ink)' }}>
              Ask BabyQ
            </h2>
            <p style={{ fontSize: 15, color: 'var(--ink-secondary)', margin: 0, lineHeight: 1.5 }}>
              Short, parent-friendly answers. Not medical advice.
            </p>
          </div>

          {/* Disclaimer banner */}
          <div className="alert alert-warn" style={{ marginBottom: 28 }}>
            <span style={{ fontSize: 15 }}>⚠️</span>
            <span>Not a substitute for professional medical advice. In emergencies call your local emergency number.</span>
          </div>

          {/* Error */}
          {error && (
            <div role="alert" className="alert alert-danger" style={{ marginBottom: 24 }}>
              <strong>Error:</strong>&nbsp;{error}
            </div>
          )}

          <form onSubmit={onSubmit} style={{ display: 'grid', gap: 26 }}>

            {/* ── Baby quick-select ── */}
            {babies.length > 0 && (
              <div>
                <label className="field-label">Who&apos;s this about?</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {babies.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => pickBaby(b)}
                      className={`chip ${selectedBabyId === b.id ? 'chip-active' : ''}`}
                    >
                      {b.name} · {monthsBetween(b.birth_date)}mo
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setSelectedBabyId(null)}
                    className={`chip ${selectedBabyId === null ? 'chip-active' : ''}`}
                  >
                    Someone else
                  </button>
                </div>
              </div>
            )}

            {/* ── Age slider ── */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <label className="field-label" style={{ marginBottom: 0 }}>Baby&apos;s age</label>
                <span className="badge badge-accent">{ageLabel}</span>
              </div>
              <input
                type="range"
                min={0}
                max={60}
                step={1}
                value={age}
                onChange={(e) => { setAge(e.target.value); setSelectedBabyId(null); }}
                className="age-slider"
                style={{ '--slider-pct': sliderPct } as React.CSSProperties}
                aria-label={`Baby's age: ${ageLabel}`}
              />
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 12,
                color: 'var(--ink-tertiary)',
                marginTop: 6,
              }}>
                <span>Newborn</span>
                <span>5 years (60 mo)</span>
              </div>
            </div>

            {/* ── Sex ── */}
            <div>
              <label htmlFor="sex" className="field-label">Baby&apos;s sex</label>
              <select
                id="sex"
                value={sex}
                onChange={(e) => setSex(e.target.value as 'female' | 'male' | 'unknown')}
                className="input"
                style={{
                  appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%235B6B60' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 14px center',
                  paddingRight: 40,
                  cursor: 'pointer',
                }}
              >
                <option value="unknown">Prefer not to say</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
              </select>
            </div>

            {/* ── Question ── */}
            <div>
              <label htmlFor="q" className="field-label">What&apos;s your concern?</label>
              <textarea
                id="q"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onFocus={() => {
                  setShowChips(true);
                  if (!askStartedRef.current) {
                    askStartedRef.current = true;
                    getPostHog()?.capture('ask_started');
                  }
                }}
                rows={5}
                placeholder="Describe what you're noticing…"
                className="textarea"
                required
              />

              {/* Quick chips */}
              {showChips && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                  {CHIPS.map((c) => (
                    <button
                      type="button"
                      key={c.label}
                      onClick={() =>
                        setQuestion((q) => q.trim() ? `${q.trimEnd()} ${c.label}` : c.label)
                      }
                      className="chip"
                      style={{ fontSize: 13, padding: '6px 14px' }}
                    >
                      {c.emoji} {c.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── Submit ── */}
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="btn submit-btn"
              style={{ fontSize: 16, padding: '15px 30px' }}
            >
              {loading ? 'Preparing…' : '✨ Get answer'}
            </button>
          </form>
        </section>

        {/* ── LOADING (footprints) ── */}
        {loading && (
          <div className="card" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 14,
            padding: '40px 0',
          }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  style={{
                    fontSize: 30,
                    display: 'inline-block',
                    animation: `footstep 1.5s ease-in-out ${i * 0.38}s infinite`,
                  }}
                  aria-hidden="true"
                >
                  👣
                </span>
              ))}
            </div>
            <p style={{ fontSize: 14, color: 'var(--ink-secondary)', margin: 0, fontWeight: 500 }}>
              Preparing your answer…
            </p>
          </div>
        )}

        {/* ── ANSWER CARD ── */}
        {resp && !loading && (
          <section
            ref={answerRef}
            className="card fade-in-up"
            style={{
              borderLeft: isUrgent ? '5px solid var(--danger)' : '5px solid var(--accent)',
              boxShadow: isUrgent
                ? '0 4px 24px rgba(194,59,59,0.14)'
                : 'var(--shadow-card)',
              padding: '32px 32px 28px',
              animation: isUrgent
                ? 'shake 0.55s ease-in-out, fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
                : undefined,
            }}
          >
            {/* Urgent banner */}
            {isUrgent && (
              <div className="alert alert-urgent" style={{ marginBottom: 24 }}>
                <span style={{ fontSize: 22, flexShrink: 0, marginTop: 1 }}>⚠️</span>
                <div>
                  <strong style={{ color: '#7A2323', fontSize: 15, display: 'block', marginBottom: 3 }}>
                    This looks urgent — call emergency services
                  </strong>
                  <span style={{ fontSize: 13, lineHeight: 1.5 }}>
                    Please contact your local emergency number or visit the nearest healthcare facility immediately.
                  </span>
                </div>
              </div>
            )}

            {/* Header: source badge + copy */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
              <span className={`badge ${srcBadge.cls}`}>
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
                className="btn-ghost"
                style={{ marginLeft: 'auto', padding: '6px 16px', fontSize: 13 }}
              >
                {copied ? '✅ Copied' : 'Copy answer'}
              </button>
            </div>

            {/* Answer heading + body */}
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 12px', color: 'var(--ink)' }}>
              Answer
            </h3>
            <div style={{
              whiteSpace: 'pre-wrap',
              lineHeight: 1.78,
              fontSize: 15,
              color: 'var(--ink-secondary)',
              padding: '18px 20px',
              background: 'var(--surface-sunken)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
            }}>
              {cleanAnswer(resp.answer || '')}
            </div>

            {/* Disclaimer */}
            {resp?.disclaimer && (
              <p style={{ marginTop: 14, fontSize: 13, color: 'var(--ink-tertiary)', lineHeight: 1.6 }}>
                {resp.disclaimer}
              </p>
            )}

            {/* Feedback */}
            <div style={{
              marginTop: 22,
              paddingTop: 16,
              borderTop: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}>
              {feedback === 'sent' ? (
                <span style={{ fontSize: 14, color: 'var(--accent-strong)', fontWeight: 600 }}>
                  Thank you! 🙏
                </span>
              ) : (
                <>
                  <span style={{ fontSize: 13, color: 'var(--ink-secondary)', fontWeight: 500 }}>
                    Was this answer helpful?
                  </span>
                  <button
                    onClick={() => sendFeedback(true)}
                    aria-label="Yes, it was helpful"
                    className="chip"
                    style={{ padding: '5px 14px', fontSize: 16 }}
                  >👍</button>
                  <button
                    onClick={() => sendFeedback(false)}
                    aria-label="No, it wasn't helpful"
                    className="chip"
                    style={{ padding: '5px 14px', fontSize: 16 }}
                  >👎</button>
                </>
              )}
            </div>

            {/* Sources */}
            {showSources && resp.candidates?.length ? (
              <details style={{ marginTop: 20 }}>
                <summary style={{ fontWeight: 600, color: 'var(--ink-secondary)', cursor: 'pointer', fontSize: 14 }}>
                  Sources ({resp.candidates.length})
                </summary>
                <ul style={{ marginTop: 10, paddingLeft: 18, display: 'grid', gap: 8 }}>
                  {resp.candidates.map((c: any, i: number) => (
                    <li key={c.id || i}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>
                        {c.category || 'General'} · {c.age_min}–{c.age_max} months
                      </div>
                      <div style={{ opacity: 0.7, fontSize: 13 }}>{c.question}</div>
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}

            {/* Debug */}
            {showDebug && (
              <>
                <details style={{ marginTop: 14 }}>
                  <summary style={{ fontSize: 13, cursor: 'pointer', color: 'var(--ink-tertiary)' }}>Debug (meta)</summary>
                  <pre style={{ marginTop: 8 }}>{JSON.stringify(resp.meta, null, 2)}</pre>
                </details>
                <details style={{ marginTop: 8 }}>
                  <summary style={{ fontSize: 13, cursor: 'pointer', color: 'var(--ink-tertiary)' }}>Sent payload</summary>
                  <pre style={{ marginTop: 8 }}>{JSON.stringify(lastPayload, null, 2)}</pre>
                </details>
              </>
            )}
          </section>
        )}
      </div>

      {/* ── Responsive styles ── */}
      <style jsx>{`
        .hero-photo {
          flex-shrink: 0;
          width: 340px;
          height: 400px;
        }
        @media (max-width: 768px) {
          .hero-photo { display: none; }
        }
        .submit-btn {
          width: 100%;
        }
        @media (min-width: 640px) {
          .submit-btn {
            width: auto !important;
            min-width: 200px;
            align-self: flex-start;
          }
        }
      `}</style>
    </main>
  );
}
