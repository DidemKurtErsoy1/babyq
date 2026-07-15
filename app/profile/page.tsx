'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../lib/useAuth';
import { getSupabaseBrowser } from '../../lib/supabaseBrowser';

type Baby = {
  id: string;
  name: string;
  birth_date: string;
  sex: 'female' | 'male' | 'unknown';
};

const LS_KEY = 'babyq_babies_v1';
const LEGACY_LS_KEY = 'babyq_profile_v1'; // pre-multi-baby single profile

function monthsBetween(birthISO: string) {
  if (!birthISO) return 0;
  const b = new Date(birthISO);
  const now = new Date();
  let m = (now.getFullYear() - b.getFullYear()) * 12 + (now.getMonth() - b.getMonth());
  if (now.getDate() < b.getDate()) m -= 1;
  return Math.max(0, m);
}

function ageLabel(months: number) {
  if (months < 1) return 'Newborn';
  if (months < 24) return `${months} mo`;
  return `${Math.floor(months / 12)} yr ${months % 12} mo`;
}

function emptyForm(): Omit<Baby, 'id'> {
  return { name: '', birth_date: '', sex: 'unknown' };
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [babies, setBabies] = useState<Baby[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Omit<Baby, 'id'>>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      if (user) {
        const supa = getSupabaseBrowser();
        if (supa) {
          const { data } = await supa
            .from('babies')
            .select('id, name, birth_date, sex')
            .order('created_at', { ascending: true });

          if (data && data.length > 0) {
            setBabies(data as Baby[]);
            setLoading(false);
            return;
          }

          // No babies yet — migrate a legacy single-baby profile row, if any.
          const { data: legacy } = await supa
            .from('profiles')
            .select('baby_name, birth_date')
            .eq('id', user.id)
            .single();

          if (legacy?.baby_name || legacy?.birth_date) {
            const { data: inserted } = await supa
              .from('babies')
              .insert({
                user_id: user.id,
                name: legacy.baby_name || 'Baby',
                birth_date: legacy.birth_date || null,
                sex: 'unknown',
              })
              .select('id, name, birth_date, sex')
              .single();
            setBabies(inserted ? [inserted as Baby] : []);
            setLoading(false);
            return;
          }

          setBabies([]);
          setLoading(false);
          return;
        }
      }

      // Guest fallback: localStorage
      try {
        const raw = localStorage.getItem(LS_KEY);
        if (raw) {
          setBabies(JSON.parse(raw));
          setLoading(false);
          return;
        }
        const legacyRaw = localStorage.getItem(LEGACY_LS_KEY);
        if (legacyRaw) {
          const legacy = JSON.parse(legacyRaw) as { baby_name?: string; birth_date?: string };
          if (legacy?.baby_name || legacy?.birth_date) {
            const migrated: Baby[] = [{
              id: crypto.randomUUID(),
              name: legacy.baby_name || 'Baby',
              birth_date: legacy.birth_date || '',
              sex: 'unknown',
            }];
            setBabies(migrated);
            localStorage.setItem(LS_KEY, JSON.stringify(migrated));
            setLoading(false);
            return;
          }
        }
      } catch {}
      setBabies([]);
      setLoading(false);
    }
    load();
  }, [user]);

  function persistGuest(next: Baby[]) {
    setBabies(next);
    try { localStorage.setItem(LS_KEY, JSON.stringify(next)); } catch {}
  }

  function startAdd() {
    setForm(emptyForm());
    setEditingId(null);
    setShowForm(true);
  }

  function startEdit(b: Baby) {
    setForm({ name: b.name, birth_date: b.birth_date, sex: b.sex });
    setEditingId(b.id);
    setShowForm(true);
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    const name = form.name.trim() || 'Baby';

    if (user) {
      const supa = getSupabaseBrowser();
      if (!supa) return;
      if (editingId) {
        const { data } = await supa
          .from('babies')
          .update({ name, birth_date: form.birth_date || null, sex: form.sex })
          .eq('id', editingId)
          .select('id, name, birth_date, sex')
          .single();
        if (data) setBabies((prev) => prev.map((b) => (b.id === editingId ? (data as Baby) : b)));
      } else {
        const { data } = await supa
          .from('babies')
          .insert({ user_id: user.id, name, birth_date: form.birth_date || null, sex: form.sex })
          .select('id, name, birth_date, sex')
          .single();
        if (data) setBabies((prev) => [...prev, data as Baby]);
      }
    } else {
      if (editingId) {
        persistGuest(babies.map((b) => (b.id === editingId ? { ...b, name, birth_date: form.birth_date, sex: form.sex } : b)));
      } else {
        persistGuest([...babies, { id: crypto.randomUUID(), name, birth_date: form.birth_date, sex: form.sex }]);
      }
    }

    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function onDelete(id: string) {
    if (user) {
      const supa = getSupabaseBrowser();
      if (supa) await supa.from('babies').delete().eq('id', id);
      setBabies((prev) => prev.filter((b) => b.id !== id));
    } else {
      persistGuest(babies.filter((b) => b.id !== id));
    }
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
          gap: 20,
        }}
      >
        <section className="premium-card" style={{ padding: '34px 32px', display: 'grid', gap: 18 }}>
          <div style={{ display: 'grid', gap: 6 }}>
            <h1 style={{ fontSize: 30, fontWeight: 800, margin: 0, color: 'var(--brand)', letterSpacing: '-0.02em' }}>Baby Profiles</h1>
            <p style={{ marginTop: 4, fontSize: 15.5, color: 'var(--ink-secondary)', lineHeight: 1.6 }}>
              Add each of your children. On the Ask page you can pick who a question is about — age fills in automatically.
            </p>
          </div>

          {!loading && babies.length > 0 && (
            <div style={{ display: 'grid', gap: 10 }}>
              {babies.map((b) => (
                <div
                  key={b.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    border: '1px solid var(--accent-border)',
                    background: 'var(--accent-soft)',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px 18px',
                  }}
                >
                  <div style={{ display: 'grid', gap: 2 }}>
                    <div style={{ fontSize: 16.5, fontWeight: 750, color: 'var(--brand)' }}>{b.name}</div>
                    <div style={{ fontSize: 13.5, color: 'var(--ink-secondary)' }}>
                      {b.birth_date ? ageLabel(monthsBetween(b.birth_date)) : 'No birth date'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => startEdit(b)} className="btn-ghost" style={{ padding: '7px 14px', fontSize: 13.5 }}>
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(b.id)}
                      className="btn-ghost"
                      style={{ padding: '7px 14px', fontSize: 13.5, color: '#8C2B2B', borderColor: 'var(--danger-border)' }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!showForm && (
            <button onClick={startAdd} className="btn save-btn" style={{ fontSize: 15.5 }}>
              + Add a baby
            </button>
          )}

          {showForm && (
            <form onSubmit={onSave} style={{ display: 'grid', gap: 18, marginTop: 4 }}>
              <label>
                <span className="field-label">Baby&apos;s name</span>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Daisy"
                  className="input"
                />
              </label>

              <label>
                <span className="field-label">Date of birth</span>
                <input
                  type="date"
                  value={form.birth_date}
                  onChange={(e) => setForm((f) => ({ ...f, birth_date: e.target.value }))}
                  className="input"
                  required
                />
              </label>

              <label>
                <span className="field-label">Sex (optional)</span>
                <select
                  value={form.sex}
                  onChange={(e) => setForm((f) => ({ ...f, sex: e.target.value as Baby['sex'] }))}
                  className="input"
                >
                  <option value="unknown">Prefer not to say</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                </select>
              </label>

              {form.birth_date && (
                <div className="alert alert-ok">
                  <span style={{ fontSize: 18 }}>🌱</span>
                  <span>Calculated age: <strong>{monthsBetween(form.birth_date)} months</strong></span>
                </div>
              )}

              <div style={{ display: 'flex', gap: 12 }}>
                <button type="submit" className="btn" style={{ fontSize: 15.5 }}>
                  {editingId ? 'Save changes' : 'Add baby'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditingId(null); }}
                  className="btn-ghost"
                  style={{ fontSize: 15.5, padding: '13px 24px' }}
                >
                  Cancel
                </button>
              </div>

              {saved && <div style={{ color: 'var(--accent-strong)', fontWeight: 700, fontSize: 14.5 }}>✓ Saved!</div>}
            </form>
          )}

          <p style={{ marginTop: 4, fontSize: 13, color: 'var(--ink-tertiary)', lineHeight: 1.6 }}>
            {user
              ? 'Profiles are saved to your account and synced across devices.'
              : 'Profiles are stored locally on this device. Sign in to sync across devices.'}
          </p>
        </section>
      </div>

      <style jsx>{`
        @media (min-width: 640px) {
          .save-btn {
            width: auto;
            min-width: 180px;
            align-self: flex-start;
          }
        }
        @media (max-width: 639px) {
          .save-btn {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}
