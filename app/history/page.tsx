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
  baby_id: string | null;
};

function SourceBadge({ source }: { source: string | null }) {
  const cfg =
    source === 'AI'
      ? { cls: 'badge-gold', label: '🤖 AI' }
      : source === 'FAQ'
      ? { cls: 'badge-accent', label: '📚 FAQ' }
      : { cls: 'badge-neutral', label: '🛟 Fallback' };

  return <span className={`badge ${cfg.cls}`}>{cfg.label}</span>;
}

function SkeletonCard() {
  return (
    <div className="card" style={{ padding: '22px 24px', display: 'grid', gap: 10 }}>
      {[180, 120, 80].map((w, i) => (
        <div key={i} className="skeleton-line" style={{ width: `${w}px`, maxWidth: '100%' }} />
      ))}
    </div>
  );
}

export default function HistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [babyNames, setBabyNames] = useState<Record<string, string>>({});
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
      .from('babies')
      .select('id, name')
      .then(({ data }) => {
        const map: Record<string, string> = {};
        (data || []).forEach((b: { id: string; name: string }) => { map[b.id] = b.name; });
        setBabyNames(map);
      });

    supa
      .from('questions')
      .select('id, text, answer, source, child_age_months, sex, urgent, created_at, baby_id')
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
      <main className="page-shell">
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 20px 72px', display: 'grid', gap: 16 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--brand)', margin: 0, letterSpacing: '-0.02em' }}>History</h1>
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <div
        style={{
          maxWidth: 720,
          margin: '0 auto',
          padding: '48px 20px 72px',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
        }}
      >
        <h1 style={{ fontSize: 30, fontWeight: 800, margin: 0, color: 'var(--brand)', letterSpacing: '-0.02em' }}>History</h1>

        {fetchError && (
          <div className="alert alert-danger">{fetchError}</div>
        )}

        {!fetchError && questions.length === 0 && (
          <div className="card" style={{ padding: 28, color: 'var(--ink-secondary)', fontSize: 16, textAlign: 'center' }}>
            No questions yet.
          </div>
        )}

        {questions.map((q) => {
          const isExpanded = expanded.has(q.id);
          return (
            <article key={q.id} className="card" style={{ padding: '22px 24px', display: 'grid', gap: 12 }}>
              {/* Header row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <SourceBadge source={q.source} />
                {q.urgent && <span className="badge badge-danger">🔺 Urgent</span>}
                <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--ink-tertiary)', whiteSpace: 'nowrap' }}>
                  {formatDate(q.created_at)}
                </span>
              </div>

              {/* Meta */}
              {(q.baby_id || q.child_age_months !== null || q.sex) && (
                <div style={{ fontSize: 13, color: 'var(--ink-secondary)' }}>
                  {q.baby_id && babyNames[q.baby_id] && <span>👶 {babyNames[q.baby_id]}</span>}
                  {q.baby_id && babyNames[q.baby_id] && q.child_age_months !== null && <span> · </span>}
                  {q.child_age_months !== null && <span>Age: {q.child_age_months} mo</span>}
                  {q.child_age_months !== null && q.sex && <span> · </span>}
                  {q.sex && <span>Gender: {q.sex}</span>}
                </div>
              )}

              {/* Question */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-tertiary)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.3 }}>Question</div>
                <div style={{ fontSize: 15, color: 'var(--ink)', lineHeight: 1.6 }}>{q.text}</div>
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
                      color: 'var(--accent-strong)',
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
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--surface-sunken)',
                        border: '1px solid var(--border)',
                        fontSize: 14,
                        color: 'var(--ink-secondary)',
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
