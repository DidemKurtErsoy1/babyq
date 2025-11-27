// app/profile/page.tsx
'use client';

import { FormEvent, useEffect, useState } from 'react';
import { getSupabaseBrowser } from '../../lib/supabaseBrowser'; // Gerekirse yolu düzelt

type QuestionRow = {
  id: string;
  created_at: string;
  text: string;
};

function calcAgeMonthsFromDate(dateStr: string): number {
  if (!dateStr) return 0;
  const dob = new Date(dateStr);
  if (Number.isNaN(dob.getTime())) return 0;
  const now = new Date();
  const years = now.getFullYear() - dob.getFullYear();
  const months = now.getMonth() - dob.getMonth();
  const total = years * 12 + months - (now.getDate() < dob.getDate() ? 1 : 0);
  return total < 0 ? 0 : total;
}

export default function ProfilePage() {
  const [babyName, setBabyName] = useState('');
  const [dob, setDob] = useState('');
  const [ageMonths, setAgeMonths] = useState(0);
  const [saving, setSaving] = useState(false);

  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [questionsError, setQuestionsError] = useState<string | null>(null);
  const [questionsLoading, setQuestionsLoading] = useState(false);

  // Tarih değişince yaş hesapla
  useEffect(() => {
    setAgeMonths(calcAgeMonthsFromDate(dob));
  }, [dob]);

  // Son 20 soruyu Supabase’ten çek
  useEffect(() => {
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setQuestionsError(
        'Supabase config is missing or invalid, so questions cannot be loaded.'
      );
      return;
    }

    setQuestionsLoading(true);
    supabase
      .from('questions')
      .select('id, created_at, text')
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data, error }) => {
        if (error) {
          console.error(error);
          setQuestionsError('Failed to load questions from Supabase.');
        } else {
          setQuestions(data || []);
          setQuestionsError(null);
        }
      })
      .finally(() => setQuestionsLoading(false));
  }, []);

  const onSave = (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Şimdilik localStorage’a kaydediyoruz; istersen Supabase’e de yazabiliriz.
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(
          'babyq_profile',
          JSON.stringify({ babyName, dob, ageMonths })
        );
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px' }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>
        Profile
      </h1>
      <p style={{ marginBottom: 16 }}>
        Enter your baby&apos;s info. <strong>Age (months)</strong> will auto-fill
        on the Ask page.
      </p>

      <form
        onSubmit={onSave}
        style={{ display: 'grid', gap: 12, marginTop: 16, maxWidth: 520 }}
      >
        <label style={{ display: 'grid', gap: 4 }}>
          Baby&apos;s name (optional)
          <input
            type="text"
            placeholder="e.g. Daisy"
            value={babyName}
            onChange={(e) => setBabyName(e.target.value)}
            style={{
              padding: '10px 12px',
              borderRadius: 6,
              border: '1px solid #ddd',
            }}
          />
        </label>

        <label style={{ display: 'grid', gap: 4 }}>
          Date of birth
          <input
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            style={{
              padding: '10px 12px',
              borderRadius: 6,
              border: '1px solid #ddd',
            }}
          />
        </label>

        <p>Calculated age: {ageMonths} months</p>

        <button
          type="submit"
          disabled={saving}
          style={{
            marginTop: 12,
            padding: '10px 16px',
            borderRadius: 999,
            border: 'none',
            background: 'black',
            color: 'white',
            cursor: saving ? 'default' : 'pointer',
          }}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </form>

      <section style={{ marginTop: 48 }}>
        <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>
          My Questions
        </h2>
        <p style={{ marginBottom: 8 }}>
          Latest 20 questions saved to Supabase.
        </p>

        {questionsError && (
          <>
            <p style={{ color: '#b91c1c' }}>{questionsError}</p>
            <p style={{ color: '#b91c1c' }}>Supabase yapılandırması eksik.</p>
          </>
        )}

        {!questionsError && questionsLoading && <p>Loading…</p>}

        {!questionsError && !questionsLoading && questions.length === 0 && (
          <p>No questions found yet.</p>
        )}

        {!questionsError && !questionsLoading && questions.length > 0 && (
          <ul style={{ marginTop: 12, paddingLeft: 18 }}>
            {questions.map((q) => (
              <li key={q.id}>
                <strong>
                  {new Date(q.created_at).toLocaleString(undefined, {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })}
                  :
                </strong>{' '}
                {q.text}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

