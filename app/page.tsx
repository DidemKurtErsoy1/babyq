// app/page.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../lib/useAuth';
import { getSupabaseBrowser } from '../lib/supabaseBrowser';
import { getPostHog } from '../lib/posthog';
import { useI18n } from '../lib/useI18n';

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
    model?: string | null;
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

/* ── Component ── */
export default function Home() {
  const { user } = useAuth();
  const { t, chips } = useI18n();

  const [age,       setAge]       = useState<string>('7');
  const [sex,       setSex]       = useState<'female' | 'male' | 'unknown'>('unknown');
  const [question,  setQuestion]  = useState<string>('');
  const [loading,   setLoading]   = useState(false);
  const [resp,      setResp]      = useState<ApiResp | null>(null);
  const [error,     setError]     = useState<string | null>(null);
  const [lastPayload, setLastPayload] = useState<any>(null);
  const [copied,    setCopied]    = useState(false);
  const [feedback,  setFeedback]  = useState<null | 'sent'>(null);
  // Visible from the start (not gated behind a textarea focus) so a curious
  // visitor can try a one-tap example without typing anything first.
  const [showChips, setShowChips] = useState(true);
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

  /* Core ask — takes the question text explicitly so callers (form submit,
     one-tap example chips) don't race React state updates. `via` records how
     the ask was triggered so the activation funnel can separate organic (typed)
     questions from one-tap example taps — most early traffic was the latter,
     which otherwise inflates ask_started / answer_received. */
  async function runAsk(questionText: string, via: 'typed' | 'example_chip' = 'typed') {
    const q = questionText.trim();
    if (!q) return;

    setLoading(true);
    setError(null);
    setResp(null);
    setCopied(false);
    setFeedback(null);

    // Personalize the answer with the picked baby's name (works for guests too,
    // since it's sent in the request rather than looked up from babyId).
    const selectedBaby = babies.find((b) => b.id === selectedBabyId);

    const payload = {
      ageMonths: Number(age || 0),
      question:  q,
      sex,
      babyName:  selectedBaby?.name ?? null,
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
      // Don't let a rate-limit notice count as a real answer in the funnel.
      if (j.meta?.provider !== 'rate-limit') {
        getPostHog()?.capture('answer_received', {
          via,
          source: j.meta?.source,
          provider: j.meta?.provider,
          model: j.meta?.model,
          urgent: j.meta?.urgent,
          has_baby: !!selectedBabyId,
          signed_in: !!user,
        });
      }
      setTimeout(() => answerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
    } catch (err: any) {
      setError(err?.message || t('genericError'));
      getPostHog()?.capture('client_error', { source: 'ask_flow', message: String(err?.message || err).slice(0, 300) });
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    runAsk(question, 'typed');
  }

  /* One-tap example: fill the field, mark ask_started, and answer immediately */
  function askExample(text: string) {
    setQuestion(text);
    if (!askStartedRef.current) {
      askStartedRef.current = true;
      getPostHog()?.capture('ask_started', { via: 'example_chip' });
    }
    runAsk(text, 'example_chip');
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
  const ageLabel  = age === '0' ? t('newborn') : `${age} ${t(age === '1' ? 'month' : 'months')}`;

  function shareWhatsApp() {
    const text = `${t('sharePrefix')}\n\n${cleanAnswer(resp?.answer || '')}\n\nhttps://babyq.app`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  }

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
              {t('heroBadge')}
            </div>

            <h1 style={{
              fontSize: 'clamp(34px, 5.4vw, 58px)',
              fontWeight: 800,
              lineHeight: 1.08,
              color: '#fff',
              letterSpacing: '-1px',
              margin: '0 0 22px',
            }}>
              {t('heroTitleLine1')}<br /><span className="grad-text">{t('heroTitleLine2')}</span>
            </h1>

            <p style={{
              fontSize: 17.5,
              color: 'rgba(255,255,255,0.72)',
              lineHeight: 1.65,
              margin: '0 0 34px',
              maxWidth: 460,
            }}>
              {t('heroSubtitle')}
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
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
                {t('heroCta')}
              </button>
            </div>

            {/* One-tap demo — answer without scrolling to the form */}
            <div style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 10, fontWeight: 600 }}>
                {t('heroTryLabel')}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {chips.slice(0, 3).map((c) => (
                  <button
                    key={c.label}
                    type="button"
                    onClick={() => askExample(c.example)}
                    disabled={loading}
                    title={c.example}
                    className="glass-chip"
                    style={{ cursor: loading ? 'wait' : 'pointer', border: 'none', fontFamily: 'inherit' }}
                  >
                    {c.emoji} {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* feature chips */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <div className="glass-chip">{t('heroChipSeconds')}</div>
              <div className="glass-chip">{t('heroChipBilingual')}</div>
              <div className="glass-chip">{t('heroChipSafety')}</div>
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
          <span>{t('trustNotMedical')}</span>
          <span style={{ color: 'var(--border-strong)', userSelect: 'none' }}>•</span>
          <span>{t('trustPediatric')}</span>
          <span style={{ color: 'var(--border-strong)', userSelect: 'none' }}>•</span>
          <span>{t('trustBilingual')}</span>
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
              {t('askTitle')}
            </h2>
            <p style={{ fontSize: 15, color: 'var(--ink-secondary)', margin: 0, lineHeight: 1.5 }}>
              {t('subtitle')}
            </p>
          </div>

          {/* Disclaimer banner */}
          <div className="alert alert-warn" style={{ marginBottom: 28 }}>
            <span style={{ fontSize: 15 }}>⚠️</span>
            <span>{t('formDisclaimer')}</span>
          </div>

          {/* Error */}
          {error && (
            <div role="alert" className="alert alert-danger" style={{ marginBottom: 24 }}>
              <strong>{t('errorPrefix')}</strong>&nbsp;{error}
            </div>
          )}

          <form onSubmit={onSubmit} style={{ display: 'grid', gap: 26 }}>

            {/* ── Baby quick-select ── */}
            {babies.length > 0 && (
              <div>
                <label className="field-label">{t('whoAbout')}</label>
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
                    {t('someoneElse')}
                  </button>
                </div>
              </div>
            )}

            {/* ── Age slider ── */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <label className="field-label" style={{ marginBottom: 0 }}>{t('babyAge')}</label>
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
                <span>{t('newborn')}</span>
                <span>{t('ageRangeMax')}</span>
              </div>
            </div>

            {/* ── Sex ── */}
            <div>
              <label htmlFor="sex" className="field-label">{t('sexLabel')}</label>
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
                <option value="unknown">{t('sexPreferNot')}</option>
                <option value="female">{t('sexFemale')}</option>
                <option value="male">{t('sexMale')}</option>
              </select>
            </div>

            {/* ── Question ── */}
            <div>
              <label htmlFor="q" className="field-label">{t('concernLabel')}</label>
              <textarea
                id="q"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onFocus={() => {
                  setShowChips(true);
                  if (!askStartedRef.current) {
                    askStartedRef.current = true;
                    getPostHog()?.capture('ask_started', { via: 'typed' });
                  }
                }}
                rows={5}
                placeholder={t('concernPlaceholder')}
                className="textarea"
                required
              />

              {/* One-tap examples — instant answer, no typing needed */}
              {showChips && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 650, color: 'var(--ink-tertiary)', marginBottom: 9, letterSpacing: 0.2 }}>
                    {t('tryExample')}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {chips.map((c) => (
                      <button
                        type="button"
                        key={c.label}
                        onClick={() => askExample(c.example)}
                        disabled={loading}
                        title={c.example}
                        className="chip"
                        style={{ fontSize: 13, padding: '6px 14px' }}
                      >
                        {c.emoji} {c.label}
                      </button>
                    ))}
                  </div>
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
              {loading ? t('preparingAnswer') : `✨ ${t('getAnswer')}`}
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
              {t('preparingAnswer')}
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
                    {t('urgentTitle')}
                  </strong>
                  <span style={{ fontSize: 13, lineHeight: 1.5 }}>
                    {t('urgentBody')}
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
                {copied ? t('copied') : t('copyAnswer')}
              </button>
            </div>

            {/* Answer heading + body */}
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 12px', color: 'var(--ink)' }}>
              {t('answerTitle')}
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
              flexWrap: 'wrap',
            }}>
              {feedback === 'sent' ? (
                <span style={{ fontSize: 14, color: 'var(--accent-strong)', fontWeight: 600 }}>
                  {t('feedbackThanks')}
                </span>
              ) : (
                <>
                  <span style={{ fontSize: 13, color: 'var(--ink-secondary)', fontWeight: 500 }}>
                    {t('feedbackQuestion')}
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
              <button
                type="button"
                onClick={shareWhatsApp}
                className="chip"
                style={{ marginLeft: feedback === 'sent' ? 0 : 'auto', padding: '5px 14px', fontSize: 13, fontWeight: 600 }}
              >
                💬 {t('shareWhatsApp')}
              </button>
            </div>

            {/* Sources — always visible when FAQ context was used */}
            {resp.candidates?.length ? (
              <details style={{ marginTop: 20 }} open={resp.meta?.source === 'FAQ'}>
                <summary style={{ fontWeight: 600, color: 'var(--ink-secondary)', cursor: 'pointer', fontSize: 14 }}>
                  📚 {t('sourcesCount')} ({resp.candidates.length})
                </summary>
                <p style={{ margin: '10px 0 0', fontSize: 13, color: 'var(--ink-tertiary)', lineHeight: 1.5 }}>
                  {t('sourcesHint')}
                </p>
                <ul style={{ marginTop: 12, paddingLeft: 18, display: 'grid', gap: 10 }}>
                  {resp.candidates.map((c: any, i: number) => (
                    <li key={c.id || i}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>
                        {c.category || t('sourceGeneral')} · {c.age_min}–{c.age_max} {t('months')}
                      </div>
                      <div style={{ opacity: 0.75, fontSize: 13, marginTop: 2 }}>{c.question}</div>
                      {c.source ? (
                        <div style={{ fontSize: 12, color: 'var(--ink-tertiary)', marginTop: 4 }}>
                          {t('sourceLabel')}: {c.source}
                        </div>
                      ) : null}
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

      {/* ═══════════════════════════════════════
          WHY BABYQ — differentiation vs a generic chatbot
      ═══════════════════════════════════════ */}
      <section style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '64px 24px 72px' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{ fontSize: 'clamp(24px, 3.4vw, 32px)', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--ink)', margin: '0 0 12px' }}>
              {t('whyTitle')}
            </h2>
            <p style={{ fontSize: 16.5, color: 'var(--ink-secondary)', lineHeight: 1.6, maxWidth: 560, margin: '0 auto' }}>
              {t('whySubtitle')}
            </p>
          </div>

          <div style={{ display: 'grid', gap: 18, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
            {[
              { emoji: '🛟', title: t('whySafetyTitle'), body: t('whySafetyBody') },
              { emoji: '👶', title: t('whyKnowsTitle'),  body: t('whyKnowsBody')  },
              { emoji: '📚', title: t('whySourcesTitle'), body: t('whySourcesBody') },
            ].map((c) => (
              <div key={c.title} className="card" style={{ padding: '26px 24px' }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 24, background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', marginBottom: 16,
                }}>
                  {c.emoji}
                </div>
                <h3 style={{ fontSize: 17.5, fontWeight: 750, color: 'var(--ink)', margin: '0 0 8px' }}>{c.title}</h3>
                <p style={{ fontSize: 14.5, color: 'var(--ink-secondary)', lineHeight: 1.6, margin: 0 }}>{c.body}</p>
              </div>
            ))}
          </div>

          {/* Authority proof — honest credibility, not a vanity user count */}
          <div style={{
            marginTop: 34, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center',
            gap: '10px 16px',
          }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-tertiary)', letterSpacing: 0.2 }}>
              {t('whyAuthority')}
            </span>
            {['WHO', 'AAP', 'NHS'].map((org) => (
              <span key={org} className="badge badge-neutral" style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: 0.4 }}>
                {org}
              </span>
            ))}
          </div>
        </div>
      </section>

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
