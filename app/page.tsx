// app/page.tsx
'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';

type Sex = 'unknown' | 'female' | 'male';

type ApiMeta = {
  source?: 'AI' | 'FAQ' | 'FALLBACK';
  llmUsed?: boolean;
  llmError?: string | null;
  matchedFaqs?: number;
  urgent?: boolean;
  provider?: string;
  language?: string;
};

type ApiResp = {
  answer?: string;
  candidates?: any[];
  disclaimer?: string;
  meta?: ApiMeta;
  error?: string;
  detail?: string;
};

function clampAge(age: number) {
  if (Number.isNaN(age) || age < 0) return 0;
  if (age > 60) return 60; // 0–5 yaş arasıyla sınırla
  return Math.round(age);
}

export default function HomePage() {
  const [ageMonths, setAgeMonths] = useState<number>(0);
  const [sex, setSex] = useState<Sex>('unknown');
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [resp, setResp] = useState<ApiResp | null>(null);
  const [error, setError] = useState<string | null>(null);

  const answerRef = useRef<HTMLDivElement | null>(null);

  // Yanıt geldiğinde otomatik aşağı kaydır
  useEffect(() => {
    if (resp?.answer && answerRef.current) {
      answerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [resp?.answer]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setResp(null);

    const cleanAge = clampAge(ageMonths);
    if (!question.trim()) {
      setError('Lütfen bebeğinizle ilgili sorunuzu yazın.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ageMonths: cleanAge,
          question: question.trim(),
          gender: sex,
        }),
      });

      const data = (await res.json()) as ApiResp;
      if (!res.ok) {
        setError(data.error || data.detail || 'Bir hata oluştu.');
      } else {
        setResp(data);
      }
    } catch (err) {
      console.error(err);
      setError('Sunucuya bağlanırken bir sorun oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const meta = resp?.meta ?? {};

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px' }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>BabyQ</h1>
      <p style={{ marginBottom: 24 }}>
        Bebeğinizle ilgili sorunuzu yazın. Yaş (ay) bilgisini eklemeniz, daha
        güvenli ve anlamlı yanıtlar vermemize yardımcı olur.
      </p>

      <form
        onSubmit={onSubmit}
        style={{ display: 'grid', gap: 12, marginBottom: 32 }}
      >
        <label style={{ display: 'grid', gap: 4 }}>
          Age (months)
          <input
            type="number"
            min={0}
            max={60}
            value={ageMonths}
            onChange={(e) => setAgeMonths(clampAge(Number(e.target.value)))}
            style={{
              padding: '10px 12px',
              borderRadius: 6,
              border: '1px solid #ddd',
              maxWidth: 160,
            }}
          />
        </label>

        <label style={{ display: 'grid', gap: 4 }}>
          Gender (optional)
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => setSex('unknown')}
              style={{
                padding: '6px 10px',
                borderRadius: 999,
                border: '1px solid #ddd',
                background: sex === 'unknown' ? '#000' : '#fff',
                color: sex === 'unknown' ? '#fff' : '#000',
                cursor: 'pointer',
              }}
            >
              Not specified
            </button>
            <button
              type="button"
              onClick={() => setSex('female')}
              style={{
                padding: '6px 10px',
                borderRadius: 999,
                border: '1px solid #ddd',
                background: sex === 'female' ? '#000' : '#fff',
                color: sex === 'female' ? '#fff' : '#000',
                cursor: 'pointer',
              }}
            >
              Girl
            </button>
            <button
              type="button"
              onClick={() => setSex('male')}
              style={{
                padding: '6px 10px',
                borderRadius: 999,
                border: '1px solid #ddd',
                background: sex === 'male' ? '#000' : '#fff',
                color: sex === 'male' ? '#fff' : '#000',
                cursor: 'pointer',
              }}
            >
              Boy
            </button>
          </div>
        </label>

        <label style={{ display: 'grid', gap: 4 }}>
          Question
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={5}
            placeholder="Örn: 7 aylık bebeğimin ateşi 38.5, ne yapmalıyım?"
            style={{
              padding: '10px 12px',
              borderRadius: 6,
              border: '1px solid #ddd',
              resize: 'vertical',
            }}
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: 8,
            padding: '10px 16px',
            borderRadius: 999,
            border: 'none',
            background: '#000',
            color: '#fff',
            cursor: loading ? 'default' : 'pointer',
          }}
        >
          {loading ? 'Preparing answer…' : 'Ask BabyQ'}
        </button>
      </form>

      {error && (
        <div
          style={{
            marginBottom: 16,
            padding: '10px 12px',
            borderRadius: 8,
            background: '#fee2e2',
            color: '#991b1b',
            fontSize: 14,
          }}
        >
          {error}
        </div>
      )}

      <div ref={answerRef}>
        {resp?.answer && (
          <section
            style={{
              marginTop: 16,
              padding: '16px 14px',
              borderRadius: 12,
              border: '1px solid #e5e5e5',
              background: '#f9fafb',
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: 8,
                alignItems: 'center',
                marginBottom: 8,
              }}
            >
              {meta.source && (
                <span
                  style={{
                    fontSize: 12,
                    padding: '2px 8px',
                    borderRadius: 999,
                    border: '1px solid #d4d4d4',
                  }}
                >
                  {meta.source === 'AI'
                    ? '🤖 AI'
                    : meta.source === 'FAQ'
                    ? '📚 FAQ'
                    : '🛟 Fallback'}
                </span>
              )}
              {meta.urgent && (
                <span
                  style={{
                    fontSize: 12,
                    padding: '2px 8px',
                    borderRadius: 999,
                    background: '#fee2e2',
                    color: '#991b1b',
                  }}
                >
                  ⚠️ Possible urgent
                </span>
              )}
            </div>

            <pre
              style={{
                whiteSpace: 'pre-wrap',
                fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
                fontSize: 15,
                margin: 0,
              }}
            >
              {resp.answer}
            </pre>

            {resp.disclaimer && (
              <p
                style={{
                  marginTop: 12,
                  fontSize: 12,
                  color: '#6b7280',
                  borderTop: '1px dashed #e5e7eb',
                  paddingTop: 8,
                }}
              >
                {resp.disclaimer}
              </p>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
