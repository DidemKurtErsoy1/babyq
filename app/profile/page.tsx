'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

type Profile = { baby_name: string; birth_date: string };
type Question = {
  id: string;
  created_at: string;
  child_age_months: number | null;
  source?: string | null;
  extras?: { lang?: string } | null;
};

const LS_KEY = 'babyq_profile_v1';

function monthsBetween(birthISO: string) {
  if (!birthISO) return 0;
  const b = new Date(birthISO); const now = new Date();
  let m = (now.getFullYear() - b.getFullYear()) * 12 + (now.getMonth() - b.getMonth());
  if (now.getDate() < b.getDate()) m -= 1;
  return Math.max(0, m);
}

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function ProfilePage() {
  const [babyName, setBabyName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [saved, setSaved] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    return createClient(url, key, { auth: { persistSession: false } });
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const p = JSON.parse(raw) as Profile;
        setBabyName(p.baby_name || '');
        setBirthDate(p.birth_date || '');
      }
    } catch {}
  }, []);

  const ageMonths = useMemo(() => monthsBetween(birthDate), [birthDate]);

  useEffect(() => {
    async function load() {
      if (!supabase) {
        setError('Supabase yapılandırması eksik.');
        return;
      }
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('questions')
        .select('id, created_at, child_age_months, source, extras')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) {
        setError('Sorular yüklenemedi.');
      } else {
        setQuestions(data || []);
      }
      setLoading(false);
    }
    load();
  }, [supabase]);

  function onSave(e: React.FormEvent) {
    e.preventDefault();
    const p: Profile = { baby_name: babyName.trim(), birth_date: birthDate };
    localStorage.setItem(LS_KEY, JSON.stringify(p));
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <main style={{ maxWidth: 900, margin: '24px auto', padding: 16 }}>
      <h1 style={{ fontSize: 28, fontWeight: 800 }}>Profile</h1>
      <p style={{ opacity: .75, marginTop: 6 }}>
        Enter your baby’s info. <strong>Age (months)</strong> will auto-fill on the Ask page.
      </p>

      <form onSubmit={onSave} style={{ display: 'grid', gap: 12, marginTop: 16, maxWidth: 520 }}>
        <label>
          Baby’s name (optional)
          <input
            value={babyName}
            onChange={(e) => setBabyName(e.target.value)}
            placeholder="e.g. Daisy"
            style={{ width: '100%', padding: 10, marginTop: 6, border:'1px solid #E5E7EB', borderRadius:12 }}
          />
        </label>

        <label>
          Date of birth
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            style={{ width: '100%', padding: 10, marginTop: 6, border:'1px solid #E5E7EB', borderRadius:12 }}
            required
          />
        </label>

        <div style={{ opacity: .85 }}>
          Calculated age: <strong>{ageMonths}</strong> months
        </div>

        <button
          type="submit"
          style={{ padding: '12px 14px', background: '#111', color: '#fff', borderRadius: 12, border: 0, cursor: 'pointer' }}
        >
          Save
        </button>

        {saved && <div style={{ color: 'green' }}>Saved ✓</div>}
      </form>

      <section style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>My Questions</h2>
        <p style={{ opacity: .75, marginTop: 6 }}>Latest 20 questions saved to Supabase.</p>

        {!supabase && (
          <div style={{ marginTop: 12, color: '#b91c1c' }}>
            Supabase env keys are missing, so questions cannot be loaded.
          </div>
        )}

        {loading && <div style={{ marginTop: 12 }}>Loading…</div>}
        {error && <div style={{ marginTop: 12, color: '#b91c1c' }}>{error}</div>}

        {!loading && !error && questions.length > 0 && (
          <div style={{ marginTop: 12, border:'1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.8fr 0.8fr 0.6fr', padding: '10px 12px', background: '#F9FAFB', fontWeight: 600 }}>
              <div>Date</div>
              <div>Age (months)</div>
              <div>Source</div>
              <div>Lang</div>
            </div>
            {questions.map((q) => (
              <div
                key={q.id}
                style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.8fr 0.8fr 0.6fr', padding: '10px 12px', borderTop: '1px solid #E5E7EB', alignItems: 'center' }}
              >
                <div>{formatDate(q.created_at)}</div>
                <div>{q.child_age_months ?? '—'}</div>
                <div>{q.source || 'Ask form'}</div>
                <div>{q.extras?.lang?.toUpperCase?.() || '—'}</div>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && supabase && questions.length === 0 && (
          <div style={{ marginTop: 12, opacity: .75 }}>No questions recorded yet.</div>
        )}
      </section>
    </main>
  );
}
