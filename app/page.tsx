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
  if (src === 'AI')  return { emoji: '🤖', label: `AI · ${provider ?? 'LLM'}` };
  if (src === 'FAQ') return { emoji: '📚', label: 'FAQ' };
  return { emoji: '🛟', label: 'Fallback' };
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

  /* ── Input focus helpers ── */
  function focusField(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    e.currentTarget.style.borderColor = '#40916C';
    e.currentTarget.style.boxShadow   = '0 0 0 3px rgba(64,145,108,0.18)';
  }
  function blurField(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    e.currentTarget.style.borderColor = '#E5E7EB';
    e.currentTarget.style.boxShadow   = 'none';
  }

  /* ── Shared field style ── */
  const fieldStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 16px',
    background: '#fff',
    color: '#111827',
    border: '1.5px solid #E5E7EB',
    borderRadius: 12,
    outline: 'none',
    fontFamily: 'inherit',
    fontSize: 15,
    lineHeight: 1.55,
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
  };

  return (
    <main style={{ background: '#F8F9FA', minHeight: '100vh' }}>

      {/* ═══════════════════════════════════════
          HERO
      ═══════════════════════════════════════ */}
      <section style={{
        background: '#1B4332',
        overflow: 'hidden',
        position: 'relative',
      }}>
        <div style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: '72px 32px 80px',
          display: 'flex',
          alignItems: 'center',
          gap: 56,
        }}>
          {/* Left: text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Pill badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: 999,
              padding: '5px 14px',
              fontSize: 13,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.85)',
              marginBottom: 24,
            }}>
              🌿 Trusted pediatric Q&amp;A
            </div>

            <h1 style={{
              fontSize: 'clamp(32px, 5vw, 52px)',
              fontWeight: 800,
              lineHeight: 1.1,
              color: '#fff',
              letterSpacing: '-0.5px',
              margin: '0 0 20px',
            }}>
              Answers for every<br />parenting question
            </h1>

            <p style={{
              fontSize: 17,
              color: 'rgba(255,255,255,0.7)',
              lineHeight: 1.65,
              margin: '0 0 36px',
              maxWidth: 440,
            }}>
              Fast, clear answers about your baby's health — backed by trusted
              pediatric guidelines. Always consult your doctor for emergencies.
            </p>

            <button
              onClick={() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '15px 30px',
                background: '#40916C',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: 16,
                fontFamily: 'inherit',
                boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
                transition: 'background 0.15s ease, transform 0.1s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#2D6A4F'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#40916C'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              Get instant answers →
            </button>
          </div>

          {/* Right: photo */}
          <div className="hero-photo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=600"
              alt="Happy baby"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: 20,
                boxShadow: '0 32px 72px rgba(0,0,0,0.35)',
                display: 'block',
              }}
            />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          TRUST STRIP
      ═══════════════════════════════════════ */}
      <div style={{
        background: '#fff',
        borderBottom: '1px solid #E5E7EB',
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
          color: '#374151',
        }}>
          <span>🔒 Not medical advice</span>
          <span style={{ color: '#D1D5DB', userSelect: 'none' }}>•</span>
          <span>✓ Pediatric-backed</span>
          <span style={{ color: '#D1D5DB', userSelect: 'none' }}>•</span>
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
          style={{
            background: '#fff',
            borderRadius: 16,
            border: '1px solid #E5E7EB',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
            padding: '40px 36px',
          }}
        >
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 6px', color: '#111827' }}>
              Ask BabyQ
            </h2>
            <p style={{ fontSize: 15, color: '#6B7280', margin: 0, lineHeight: 1.5 }}>
              Short, parent-friendly answers. Not medical advice.
            </p>
          </div>

          {/* Disclaimer banner */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '11px 14px',
            background: '#FFFBEB',
            border: '1px solid #FDE68A',
            borderRadius: 10,
            fontSize: 13,
            color: '#92400E',
            marginBottom: 28,
          }}>
            <span style={{ fontSize: 15 }}>⚠️</span>
            <span>Not a substitute for professional medical advice. In emergencies call your local emergency number.</span>
          </div>

          {/* Error */}
          {error && (
            <div role="alert" style={{
              padding: '12px 16px',
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: 10,
              color: '#B91C1C',
              fontSize: 14,
              marginBottom: 24,
            }}>
              <strong>Error:</strong> {error}
            </div>
          )}

          <form onSubmit={onSubmit} style={{ display: 'grid', gap: 26 }}>

            {/* ── Baby quick-select ── */}
            {babies.length > 0 && (
              <div>
                <label style={{ display: 'block', fontSize: 15, fontWeight: 600, color: '#374151', marginBottom: 10 }}>
                  Who&apos;s this about?
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {babies.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => pickBaby(b)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 999,
                        border: selectedBabyId === b.id ? '1.5px solid #40916C' : '1.5px solid #E5E7EB',
                        background: selectedBabyId === b.id ? '#ECFDF5' : '#fff',
                        color: selectedBabyId === b.id ? '#1E5E3A' : '#374151',
                        fontWeight: 700,
                        fontSize: 14,
                        cursor: 'pointer',
                      }}
                    >
                      {b.name} · {monthsBetween(b.birth_date)}mo
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setSelectedBabyId(null)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 999,
                      border: selectedBabyId === null ? '1.5px solid #40916C' : '1.5px solid #E5E7EB',
                      background: selectedBabyId === null ? '#ECFDF5' : '#fff',
                      color: selectedBabyId === null ? '#1E5E3A' : '#374151',
                      fontWeight: 700,
                      fontSize: 14,
                      cursor: 'pointer',
                    }}
                  >
                    Someone else
                  </button>
                </div>
              </div>
            )}

            {/* ── Age slider ── */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <label style={{ fontSize: 15, fontWeight: 600, color: '#374151' }}>
                  Baby&apos;s age
                </label>
                <span style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#40916C',
                  background: '#ECFDF5',
                  border: '1px solid #A7F3D0',
                  padding: '3px 12px',
                  borderRadius: 999,
                }}>
                  {ageLabel}
                </span>
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
                color: '#9CA3AF',
                marginTop: 6,
              }}>
                <span>Newborn</span>
                <span>5 years (60 mo)</span>
              </div>
            </div>

            {/* ── Sex ── */}
            <div>
              <label htmlFor="sex" style={{ display: 'block', fontSize: 15, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                Baby&apos;s sex
              </label>
              <select
                id="sex"
                value={sex}
                onChange={(e) => setSex(e.target.value as 'female' | 'male' | 'unknown')}
                onFocus={focusField}
                onBlur={blurField}
                style={{
                  ...fieldStyle,
                  appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
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
              <label htmlFor="q" style={{ display: 'block', fontSize: 15, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                What&apos;s your concern?
              </label>
              <textarea
                id="q"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onFocus={(e) => {
                  focusField(e);
                  setShowChips(true);
                  if (!askStartedRef.current) {
                    askStartedRef.current = true;
                    getPostHog()?.capture('ask_started');
                  }
                }}
                onBlur={blurField}
                rows={5}
                placeholder="Describe what you're noticing…"
                style={{ ...fieldStyle, resize: 'vertical', minHeight: 148 }}
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
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        padding: '6px 14px',
                        background: '#ECFDF5',
                        border: '1px solid #A7F3D0',
                        borderRadius: 999,
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: 500,
                        color: '#065F46',
                        fontFamily: 'inherit',
                        transition: 'background 0.12s ease',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#D1FAE5'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = '#ECFDF5'; }}
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
              className="submit-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '15px 30px',
                background: loading ? '#9CA3AF' : '#40916C',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                cursor: (loading || !question.trim()) ? 'not-allowed' : 'pointer',
                fontWeight: 700,
                fontSize: 16,
                fontFamily: 'inherit',
                opacity: (loading || !question.trim()) ? 0.6 : 1,
                transition: 'background 0.15s ease, transform 0.1s ease',
                boxShadow: loading ? 'none' : '0 2px 10px rgba(64,145,108,0.32)',
              }}
            >
              {loading ? 'Preparing…' : '✨ Get answer'}
            </button>
          </form>
        </section>

        {/* ── LOADING (footprints) ── */}
        {loading && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 14,
            padding: '36px 0',
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
            <p style={{ fontSize: 14, color: '#6B7280', margin: 0, fontWeight: 500 }}>
              Preparing your answer…
            </p>
          </div>
        )}

        {/* ── ANSWER CARD ── */}
        {resp && !loading && (
          <section
            ref={answerRef}
            style={{
              background: '#fff',
              borderRadius: 16,
              borderTop:    '1px solid #E5E7EB',
              borderRight:  '1px solid #E5E7EB',
              borderBottom: '1px solid #E5E7EB',
              borderLeft:   isUrgent ? '5px solid #DC2626' : '5px solid #40916C',
              boxShadow: isUrgent
                ? '0 4px 24px rgba(220,38,38,0.12)'
                : '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
              padding: '32px 32px 28px',
              animation: isUrgent
                ? 'shake 0.55s ease-in-out, fadeInUp 0.3s ease'
                : 'fadeInUp 0.3s ease',
            }}
          >
            {/* Urgent banner */}
            {isUrgent && (
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: '14px 18px',
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: 12,
                marginBottom: 24,
              }}>
                <span style={{ fontSize: 22, flexShrink: 0, marginTop: 1 }}>⚠️</span>
                <div>
                  <strong style={{ color: '#B91C1C', fontSize: 15, display: 'block', marginBottom: 3 }}>
                    This looks urgent — call emergency services
                  </strong>
                  <span style={{ fontSize: 13, color: '#7F1D1D', lineHeight: 1.5 }}>
                    Please contact your local emergency number or visit the nearest healthcare facility immediately.
                  </span>
                </div>
              </div>
            )}

            {/* Header: source badge + copy */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '4px 12px',
                borderRadius: 999,
                background: '#ECFDF5',
                border: '1px solid #A7F3D0',
                color: '#065F46',
                fontSize: 12,
                fontWeight: 600,
              }}>
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
                  padding: '5px 14px',
                  borderRadius: 999,
                  border: '1px solid #E5E7EB',
                  background: '#F9FAFB',
                  color: '#374151',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 500,
                  fontFamily: 'inherit',
                  transition: 'background 0.12s ease',
                }}
              >
                {copied ? '✅ Copied' : 'Copy answer'}
              </button>
            </div>

            {/* Answer heading + body */}
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 12px', color: '#111827' }}>
              Answer
            </h3>
            <div style={{
              whiteSpace: 'pre-wrap',
              lineHeight: 1.78,
              fontSize: 15,
              color: '#374151',
              padding: '18px 20px',
              background: '#F9FAFB',
              borderRadius: 10,
              border: '1px solid #E5E7EB',
            }}>
              {cleanAnswer(resp.answer || '')}
            </div>

            {/* Disclaimer */}
            {resp?.disclaimer && (
              <p style={{ marginTop: 14, fontSize: 13, color: '#6B7280', lineHeight: 1.6 }}>
                {resp.disclaimer}
              </p>
            )}

            {/* Feedback */}
            <div style={{
              marginTop: 22,
              paddingTop: 16,
              borderTop: '1px solid #F3F4F6',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}>
              {feedback === 'sent' ? (
                <span style={{ fontSize: 14, color: '#40916C', fontWeight: 600 }}>
                  Thank you! 🙏
                </span>
              ) : (
                <>
                  <span style={{ fontSize: 13, color: '#6B7280', fontWeight: 500 }}>
                    Was this answer helpful?
                  </span>
                  <button
                    onClick={() => sendFeedback(true)}
                    aria-label="Yes, it was helpful"
                    style={{
                      padding: '5px 14px', borderRadius: 999,
                      border: '1px solid #A7F3D0', background: '#ECFDF5',
                      color: '#065F46', cursor: 'pointer', fontSize: 16, fontFamily: 'inherit',
                    }}
                  >👍</button>
                  <button
                    onClick={() => sendFeedback(false)}
                    aria-label="No, it wasn't helpful"
                    style={{
                      padding: '5px 14px', borderRadius: 999,
                      border: '1px solid #E5E7EB', background: '#F9FAFB',
                      color: '#6B7280', cursor: 'pointer', fontSize: 16, fontFamily: 'inherit',
                    }}
                  >👎</button>
                </>
              )}
            </div>

            {/* Sources */}
            {showSources && resp.candidates?.length ? (
              <details style={{ marginTop: 20 }}>
                <summary style={{ fontWeight: 600, color: '#374151', cursor: 'pointer', fontSize: 14 }}>
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
                  <summary style={{ fontSize: 13, cursor: 'pointer', color: '#6B7280' }}>Debug (meta)</summary>
                  <pre style={{ marginTop: 8 }}>{JSON.stringify(resp.meta, null, 2)}</pre>
                </details>
                <details style={{ marginTop: 8 }}>
                  <summary style={{ fontSize: 13, cursor: 'pointer', color: '#6B7280' }}>Sent payload</summary>
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
