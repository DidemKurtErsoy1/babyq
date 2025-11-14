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
    language?: 'tr' | 'en';
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

// very light markdown-ish: turn lines starting with "- " or "• " into <li>
function renderRich(text: string) {
  const lines = (text || '').split('\n');
  const blocks: JSX.Element[] = [];
  let buffer: string[] = [];
  let list: string[] = [];

  const flushP = () => {
    if (buffer.length) {
      blocks.push(<p key={'p-' + blocks.length} style={{ margin: '8px 0' }}>{buffer.join(' ')}</p>);
      buffer = [];
    }
  };
  const flushList = () => {
    if (list.length) {
      blocks.push(
        <ul key={'ul-' + blocks.length} style={{ margin: '8px 0 8px 18px' }}>
          {list.map((li, i) => <li key={i} style={{ lineHeight: 1.5 }}>{li}</li>)}
        </ul>
      );
      list = [];
    }
  };

  for (const raw of lines) {
    const l = raw.trim();
    if (!l) {
      flushP(); flushList();
      continue;
    }
    if (l.startsWith('- ') || l.startsWith('• ')) {
      flushP();
      list.push(l.replace(/^[-•]\s*/, ''));
    } else {
      flushList();
      buffer.push(l);
    }
  }
  flushP(); flushList();
  return blocks;
}

export default function Home() {
  const [age, setAge] = useState<string>('7');
  const [gender, setGender] = useState<'female'|'male'|'unknown'>('unknown');
  const [question, setQuestion] = useState<string>('Fever 38.2°C; what should I do?');
  const [loading, setLoading] = useState(false);
  const [resp, setResp] = useState<ApiResp | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastPayload, setLastPayload] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [needsProfile, setNeedsProfile] = useState(false);

  const answerRef = useRef<HTMLDivElement | null>(null);

  // Profile → yaş (ay) otomatik
  useEffect(() => {
    try {
      const raw = localStorage.getItem('babyq_profile_v1');
      if (!raw) { setNeedsProfile(true); return; }
      const p = JSON.parse(raw) as { birth_date?: string };
      if (!p?.birth_date) { setNeedsProfile(true); return; }
      setAge(String(monthsBetween(p.birth_date)));
      setNeedsProfile(false);
    } catch { setNeedsProfile(true); }
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

  const concernChips = [
    'Fever 38.0°C', 'Cough & wheeze', 'Rash', 'Not eating', 'Vomiting', 'Diarrhea'
  ];

  async function uploadImageIfAny(): Promise<string> {
    if (!imageFile) return '';
    try {
      // Basit bir upload endpoint’in varsa buraya POST edebilirsin.
      // Şimdilik sadece local URL oluşturup API’ye boş bırakıyoruz.
      return '';
    } catch { return ''; }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResp(null);
    setCopied(false);

    const imageUrl = await uploadImageIfAny();
    const payload = {
      ageMonths: Number(age || 0),
      question: question.trim(),
      gender,
      imageUrl
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

  return (
    <main style={{ maxWidth: 720, margin: '40px auto', padding: 16, color: '#111' }}>
      <header style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, margin: 0 }}>Ask BabyQ</h1>
        <p style={{ opacity: 0.8, marginTop: 6 }}>
          Short, parent-friendly answers. Not medical advice.
        </p>
      </header>

      {/* Profile CTA */}
      {needsProfile && (
        <div
          role="note"
          style={{
            marginBottom: 16,
            padding: 12,
            border: '1px solid #E6E1D9',
            background: '#FFFCF3',
            borderRadius: 12
          }}
        >
          👶 To get more accurate guidance, please{' '}
          <a href="/profile" style={{ textDecoration: 'underline' }}>create your profile</a>.
        </div>
      )}

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

        {/* Gender */}
        <label htmlFor="sex" style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontWeight: 600 }}>Baby’s sex 🏷️</span>
          <select
            id="sex"
            value={gender}
            onChange={(e) => setGender(e.target.value as any)}
            style={{
              width: '100%', padding: '12px 14px', borderRadius: 12,
              border: '1px solid #DDD', background: '#FAF7F0', color: '#111', outline: 'none'
            }}
            onFocus={(e) => (e.currentTarget.style.boxShadow = '0 0 0 2px #111')}
            onBlur={(e) => (e.currentTarget.style.boxShadow = 'none')}
          >
            <option value="unknown">Prefer not to say</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
          </select>
        </label>

        {/* Concern chips */}
        <div aria-label="quick concern chips" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {concernChips.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setQuestion(c)}
              style={{
                padding: '6px 10px',
                borderRadius: 999,
                border: '1px solid #DDD',
                background: '#FFF4DB',
                cursor: 'pointer',
                fontSize: 12
              }}
              title={`Use template: ${c}`}
            >
              {c}
            </button>
          ))}
        </div>

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

        {/* Image upload (MVP placeholder) */}
        <label htmlFor="img" style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontWeight: 600 }}>Attach an image (optional)</span>
          <input
            id="img"
            type="file"
            accept="image/png,image/jpeg"
            onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
            style={{ background: '#FAF7F0', padding: 8, borderRadius: 12, border: '1px solid #DDD' }}
          />
        </label>

        <button
          type="submit"
          disabled={loading || !question.trim()}
          aria-disabled={loading || !question.trim()}
          style={{
            padding: '14px 16px',
            background: loading ? '#666' : '#111',
            color: '#FAF7F0',
            borderRadius: 12,
            border: 0,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 700,
          }}
        >
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
              <strong>{resp.meta?.language === 'tr' ? 'ACİL:' : 'URGENT:'}</strong>{' '}
              {resp.meta?.language === 'tr'
                ? 'Olası acil durum. 112’yi arayın veya en yakın sağlık kuruluşuna başvurun.'
                : 'Possible emergency. Call your local emergency number or visit the nearest healthcare facility.'}
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
                title={badgeFor(resp?.meta?.source as any, resp?.meta?.provider).label}
                style={{
                  fontSize: 12,
                  padding: '4px 8px',
                  borderRadius: 999,
                  background: '#FFF4DB',
                  border: '1px solid #F3E2B6',
                }}
              >
                {badgeFor(resp?.meta?.source as any, resp?.meta?.provider).emoji}{' '}
                {badgeFor(resp?.meta?.source as any, resp?.meta?.provider).label}
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
                  padding: '6px 10px',
                  borderRadius: 999,
                  border: '1px solid #DDD',
                  background: '#FAF7F0',
                  color: '#111',
                  cursor: 'pointer',
                  fontSize: 12,
                }}
              >
                {copied ? '✅ Copied' : 'Copy answer'}
              </button>
            </div>

            <h3 style={{ fontSize: 22, fontWeight: 800, marginTop: 12, marginBottom: 6 }}>
              {resp.meta?.language === 'tr' ? 'Yanıt' : 'Answer'}
            </h3>

            <div style={{ marginTop: 4, lineHeight: 1.55 }}>
              {renderRich(cleanAnswer(resp.answer || ''))}
            </div>

            {/* Disclaimer */}
            {resp?.disclaimer && (
              <div style={{ marginTop: 12, fontSize: 13, opacity: 0.75 }}>
                {resp.disclaimer}
              </div>
            )}

            {/* References (show only with ?debug or ?sources) */}
            {showSources && resp.candidates?.length ? (
              <details style={{ marginTop: 16 }}>
                <summary>References ({resp.candidates.length})</summary>
                <ul style={{ marginTop: 8 }}>
                  {resp.candidates.map((c: any, i: number) => (
                    <li key={c.id || i} style={{ marginBottom: 8 }}>
                      <div style={{ fontWeight: 600 }}>
                        {(c.category || 'General')} • {c.age_min}-{c.age_max}{' '}
                        {resp.meta?.language === 'tr' ? 'ay' : 'months'}
                      </div>
                      <div style={{ opacity: 0.8 }}>{c.question}</div>
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}
          </div>

          {/* Debug */}
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
    </main>
  );
}

