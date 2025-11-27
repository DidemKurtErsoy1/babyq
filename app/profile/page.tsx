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


  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const p = JSON.parse(raw) as Profile;
        setBabyName(p.baby_name || '');
        setBirthDate(p.birth_date || '');
      }
    } catch (err) {
      console.warn('Unable to parse local profile', err);
    }
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
    let cancelled = false;
    setCheckingProfile(true);
    (async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .maybeSingle();
        if (cancelled) return;
        if (!error && data?.id) {
          setProfileExists(true);
        } else {
          setProfileExists(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Error checking profile', err);
          setProfileExists(false);
        }
      } finally {
        if (!cancelled) setCheckingProfile(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, user]);

  useEffect(() => {
    if (!supabase || !user) return;
    let cancelled = false;
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
        if (cancelled) return;
        if (error) {
          setError(t('errorQuestions'));
          setQuestions([]);
        } else {
          setQuestions(data || []);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Error loading questions', err);
          setError(t('errorQuestions'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, user, t]);

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


        {!supabase && (
          <div style={{ marginTop: 12, color: '#b91c1c' }}>
            Supabase config is missing or invalid, so questions cannot be loaded.
          </div>
        )}


            </div>
            {questions.map((q) => (
              <div
                key={q.id}

              </div>
            ))}
          </div>
        )}


        )}
      </section>
    </main>
  );
}
