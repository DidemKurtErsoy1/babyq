'use client';

import { useEffect, useMemo, useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabaseBrowser';
import { useI18n } from '@/lib/useI18n';

import type { User } from '@supabase/supabase-js';

type Profile = { baby_name: string; birth_date: string };
type Question = {
  id: string;
  created_at: string;
  child_age_months: number | null;
  gender?: string | null;
  source?: string | null;
  text?: string | null;
  extras?: { lang?: string; references?: any[] } | null;
};

const LS_KEY = 'babyq_profile_v1';

function monthsBetween(birthISO: string) {
  if (!birthISO) return 0;
  const b = new Date(birthISO);
  const now = new Date();
  let m = (now.getFullYear() - b.getFullYear()) * 12 + (now.getMonth() - b.getMonth());
  if (now.getDate() < b.getDate()) m -= 1;
  return Math.max(0, m);
}

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function displayGender(g: string | null | undefined, lang: 'en' | 'tr') {
  if (g === 'female') return lang === 'tr' ? 'Kız' : 'Female';
  if (g === 'male') return lang === 'tr' ? 'Erkek' : 'Male';
  return '—';
}

export default function ProfilePage() {
  const { t, lang } = useI18n();
  const supabase = useMemo(() => getSupabaseBrowser(), []);

  const [babyName, setBabyName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [saved, setSaved] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profileExists, setProfileExists] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

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

  useEffect(() => {
    if (!supabase) {
      setError('Supabase configuration is missing.');
      return;
    }
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener?.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (!supabase || !user) return;
    setCheckingProfile(true);
    (async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .maybeSingle();
        if (!error && data?.id) {
          setProfileExists(true);
        } else {
          setProfileExists(false);
        }
      } catch (err) {
        console.error('Error checking profile', err);
        setProfileExists(false);
      } finally {
        setCheckingProfile(false);
      }
    })();
  }, [supabase, user]);

  useEffect(() => {
    if (!supabase || !user) return;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const { data, error } = await supabase
          .from('questions')
          .select('id, created_at, child_age_months, gender, source, text, extras')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);
        if (error) {
          setError(t('errorQuestions'));
          setQuestions([]);
        } else {
          setQuestions(data || []);
        }
      } catch (err) {
        console.error('Error loading questions', err);
        setError(t('errorQuestions'));
      } finally {
        setLoading(false);
      }
    })();
  }, [supabase, user, t]);

  const ageMonths = useMemo(() => monthsBetween(birthDate), [birthDate]);

  function onSave(e: React.FormEvent) {
    e.preventDefault();
    const p: Profile = { baby_name: babyName.trim(), birth_date: birthDate };
    localStorage.setItem(LS_KEY, JSON.stringify(p));
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  async function handleCreateProfile() {
    if (!supabase || !user) return;
    setCheckingProfile(true);
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: user.id }, { onConflict: 'id' });
    if (error) {
      setToast(error.message);
    } else {
      setProfileExists(true);
      setToast(lang === 'tr' ? 'Profil başarıyla oluşturuldu ✅' : 'Profile created successfully ✅');
    }
    setCheckingProfile(false);
    setTimeout(() => setToast(null), 2000);
  }

  return (
    <main style={{ maxWidth: 900, margin: '24px auto', padding: 16 }}>
      {toast && (
        <div
          role="status"
          style={{
            position: 'fixed',
            top: 12,
            right: 12,
            padding: '10px 12px',
            background: '#111',
            color: '#fff',
            borderRadius: 12,
            boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
            zIndex: 50,
          }}
        >
          {toast}
        </div>
      )}

      <h1 style={{ fontSize: 28, fontWeight: 800 }}>{t('profileTitle')}</h1>
      <p style={{ opacity: 0.75, marginTop: 6 }}>
        Enter your baby’s info. <strong>Age (months)</strong> will auto-fill on the Ask page.
      </p>

      <form onSubmit={onSave} style={{ display: 'grid', gap: 12, marginTop: 16, maxWidth: 520 }}>
        <label>
          Baby’s name (optional)
          <input
            value={babyName}
            onChange={(e) => setBabyName(e.target.value)}
            placeholder="e.g. Daisy"
            style={{ width: '100%', padding: 10, marginTop: 6, border: '1px solid #E5E7EB', borderRadius: 12 }}
          />
        </label>

        <label>
          Date of birth
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            style={{ width: '100%', padding: 10, marginTop: 6, border: '1px solid #E5E7EB', borderRadius: 12 }}
            required
          />
        </label>

        <div style={{ opacity: 0.85 }}>
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
        {user && !profileExists && !checkingProfile ? (
          <div
            style={{
              marginBottom: 16,
              border: '1px solid #E5E7EB',
              borderRadius: 12,
              padding: 14,
              background: '#F9FAFB',
            }}
          >
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>{t('createProfileTitle')}</h2>
            <p style={{ opacity: 0.85, marginTop: 4 }}>{t('createProfileDesc')}</p>
            <button
              type="button"
              onClick={handleCreateProfile}
              disabled={checkingProfile}
              style={{
                marginTop: 8,
                padding: '10px 12px',
                borderRadius: 10,
                background: '#111',
                color: '#fff',
                border: 0,
                cursor: 'pointer',
              }}
            >
              {checkingProfile ? '…' : t('createProfileCta')}
            </button>
          </div>
        ) : null}

        <h2 style={{ fontSize: 22, fontWeight: 700 }}>{t('profileTitle')}</h2>
        <p style={{ opacity: 0.75, marginTop: 6 }}>Latest questions saved to Supabase.</p>

        {!supabase && (
          <div style={{ marginTop: 12, color: '#b91c1c' }}>
            Supabase config is missing or invalid, so questions cannot be loaded.
          </div>
        )}

        {supabase && !user && (
          <div style={{ marginTop: 12, opacity: 0.85 }}>{t('loginPrompt')}</div>
        )}

        {loading && <div style={{ marginTop: 12 }}>{t('loadingQuestions')}</div>}
        {error && <div style={{ marginTop: 12, color: '#b91c1c' }}>{error}</div>}

        {user && !loading && !error && questions.length > 0 && (
          <div style={{ marginTop: 12, border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.6fr 0.8fr 0.7fr 0.7fr 1.6fr',
                padding: '10px 12px',
                background: '#F9FAFB',
                fontWeight: 600,
              }}
            >
              <div>Date</div>
              <div>{t('ageMonthsLabel')}</div>
              <div>{t('genderLabel')}</div>
              <div>{t('sourceLabel')}</div>
              <div>{t('questionPreview')}</div>
            </div>
            {questions.map((q) => (
              <div
                key={q.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.6fr 0.8fr 0.7fr 0.7fr 1.6fr',
                  padding: '10px 12px',
                  borderTop: '1px solid #E5E7EB',
                  alignItems: 'center',
                }}
              >
                <div>{formatDate(q.created_at)}</div>
                <div>{q.child_age_months ?? '—'}</div>
                <div>{displayGender(q.gender, lang)}</div>
                <div>{q.source || 'Ask form'}</div>
                <div style={{ opacity: 0.9 }}>{q.text ? `${q.text.slice(0, 80)}${q.text.length > 80 ? '…' : ''}` : '—'}</div>
              </div>
            ))}
          </div>
        )}

        {user && !loading && !error && questions.length === 0 && (
          <div style={{ marginTop: 12, opacity: 0.75 }}>{t('noQuestions')}</div>
        )}
      </section>
    </main>
  );
}
