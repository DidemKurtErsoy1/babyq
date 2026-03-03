'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/useAuth';
import { getSupabaseBrowser } from '../../lib/supabaseBrowser';

type Question = {
  id: string;
  text: string;
  answer: string | null;
  source: string | null;
  child_age_months: number | null;
  sex: string | null;
  urgent: boolean | null;
  created_at: string;
};

function SourceBadge({ source }: { source: string | null }) {
  const cfg =
    source === 'AI'
      ? { bg: '#E2F5EC', border: '#A8DDB8', color: '#1E5E3A', label: '🤖 AI' }
      : source === 'FAQ'
      ? { bg: '#FFFBF0', border: '#F0C070', color: '#7A4A10', label: '📚 FAQ' }
      : { bg: '#FFF5F5', border: '#F5B8B8', color: '#8C1F1F', label: '🛟 Fallback' };

  return (
    <span
      style={{
        fontSize: 12,
        padding: '4px 10px',
        borderRadius: 999,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        color: cfg.color,
        fontWeight: 700,
      }}
    >
      {cfg.label}
    </span>
  );
}

function SkeletonCard() {
  return (
    <div
      style={{
        border: '1px solid #C8E2D4',
        borderRadius: 20,
        padding: '22px 24px',
        background: '#fff',
        display: 'grid',
        gap: 10,
      }}
    >
      {[180, 120, 80].map((w, i) => (
        <div
          key={i}
          style={{
            height: 14,
            width: `${w}px`,
            maxWidth: '100%',
            borderRadius: 8,
            background: '#E8F5EE',
            animation: 'pulse 1.4s ease-in-out infinite',
          }}
        />
      ))}
    </div>
  );
}

export default function HistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }

    const supa = getSupabaseBrowser();
    if (!supa) {
      setFetchError('Supabase not configured.');
      setFetching(false);
      return;
    }

    supa
      .from('questions')
      .select('id, text, answer, source, child_age_months, sex, urgent, created_at')
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        if (error) {
          setFetchError(error.message);
        } else {
          setQuestions((data as Question[]) || []);
        }
        setFetching(false);
      });
  }, [user, authLoading, router]);

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  }

  if (authLoading || (fetching && user)) {
    return (
      <main style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #FFF8F0 0%, #F0FAF4 40%, #FFF8F0 100%)' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '36px 20px 64px', display: 'grid', gap: 16 }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: '#1A3328', margin: 0 }}>History</h1>
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.45} }`}</style>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #FFF8F0 0%, #F0FAF4 40%, #FFF8F0 100%)' }}>
      <div
        style={{
          maxWidth: 720,
          margin: '0 auto',
          padding: '36px 20px 64px',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        <h1 style={{ fontSize: 32, fontWeight: 900, margin: 0, color: '#1A3328' }}>History</h1>

        {fetchError && (
          <div
            style={{
              padding: 14,
              border: '1px solid #F5B8B8',
              background: '#FFF5F5',
              color: '#8C1F1F',
              borderRadius: 14,
            }}
          >
            {fetchError}
          </div>
        )}

        {!fetchError && questions.length === 0 && (
          <div
            style={{
              padding: 24,
              border: '1px solid #C8E2D4',
              background: '#FFFFFF',
              borderRadius: 20,
              color: '#4A6B55',
              fontSize: 16,
              textAlign: 'center',
            }}
          >
            No questions yet.
          </div>
        )}

        {questions.map((q) => {
          const isExpanded = expanded.has(q.id);
          return (
            <article
              key={q.id}
              style={{
                border: '1px solid #C8E2D4',
                borderRadius: 20,
                padding: '22px 24px',
                background: '#FFFFFF',
                boxShadow: '0 8px 28px rgba(44, 122, 86, 0.07)',
                display: 'grid',
                gap: 12,
              }}
            >
              {/* Header row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <SourceBadge source={q.source} />
                {q.urgent && (
                  <span
                    style={{
                      fontSize: 12,
                      padding: '4px 10px',
                      borderRadius: 999,
                      background: '#FFF5F5',
                      border: '1px solid #F5B8B8',
                      color: '#8C1F1F',
                      fontWeight: 700,
                    }}
                  >
                    🔺 Urgent
                  </span>
                )}
                <span style={{ marginLeft: 'auto', fontSize: 12, color: '#888', whiteSpace: 'nowrap' }}>
                  {formatDate(q.created_at)}
                </span>
              </div>

              {/* Meta */}
              {(q.child_age_months !== null || q.sex) && (
                <div style={{ fontSize: 13, color: '#636E72' }}>
                  {q.child_age_months !== null && <span>Age: {q.child_age_months} mo</span>}
                  {q.child_age_months !== null && q.sex && <span> · </span>}
                  {q.sex && <span>Gender: {q.sex}</span>}
                </div>
              )}

              {/* Question */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#4A6B55', marginBottom: 4 }}>Question</div>
                <div style={{ fontSize: 15, color: '#2D3436', lineHeight: 1.6 }}>{q.text}</div>
              </div>

              {/* Answer (collapsible) */}
              {q.answer && (
                <div>
                  <button
                    onClick={() => toggleExpand(q.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      fontSize: 13,
                      fontWeight: 700,
                      color: '#3D9A6D',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    {isExpanded ? '▲ Hide answer' : '▼ Show answer'}
                  </button>
                  {isExpanded && (
                    <div
                      style={{
                        marginTop: 10,
                        padding: '14px 16px',
                        borderRadius: 14,
                        background: '#F0FBF5',
                        border: '1px solid #A8DDB8',
                        fontSize: 14,
                        color: '#2D3436',
                        lineHeight: 1.7,
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {q.answer.replace(/^🔹 AI\n|^🔸 FAQ\n|^🔺 Fallback\n/, '')}
                    </div>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </main>
  );
}
