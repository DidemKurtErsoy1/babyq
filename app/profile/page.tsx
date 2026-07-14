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

  const fieldBase = {
    width: '100%',
    padding: '13px 16px',
    borderRadius: 14,
    border: '1.5px solid #C8E2D4',
    background: '#FAFFF9',
    color: '#2D3436',
    outline: 'none',
    fontSize: 16,
    fontFamily: 'inherit',
    transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
  } as const;

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
        <section
          style={{
            border: '1px solid #C8E2D4',
            background: '#FFFFFF',
            borderRadius: 26,
            padding: '32px 30px',
            boxShadow: '0 12px 40px rgba(44, 122, 86, 0.09)',
            display: 'grid',
            gap: 16,
          }}
        >
          <div style={{ display: 'grid', gap: 6 }}>
            <h1 style={{ fontSize: 32, fontWeight: 900, margin: 0, color: '#1A3328' }}>Baby Profiles</h1>
            <p style={{ marginTop: 4, fontSize: 16, color: '#4A6B55', lineHeight: 1.6 }}>
              Add each of your children. On the Ask page you can pick who a question is about — age fills in automatically.
            </p>
          </div>

          {!loading && babies.length > 0 && (
            <div style={{ display: 'grid', gap: 12 }}>
              {babies.map((b) => (
                <div
                  key={b.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    border: '1px solid #A8DDB8',
                    background: '#EDF9F3',
                    borderRadius: 18,
                    padding: '14px 18px',
                  }}
                >
                  <div style={{ display: 'grid', gap: 2 }}>
                    <div style={{ fontSize: 17, fontWeight: 800, color: '#1A3328' }}>{b.name}</div>
                    <div style={{ fontSize: 14, color: '#4A6B55' }}>
                      {b.birth_date ? ageLabel(monthsBetween(b.birth_date)) : 'No birth date'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => startEdit(b)}
                      style={{
                        padding: '8px 14px', borderRadius: 12, border: '1.5px solid #A8DDB8',
                        background: '#fff', color: '#1E5E3A', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(b.id)}
                      style={{
                        padding: '8px 14px', borderRadius: 12, border: '1.5px solid #F3B8B8',
                        background: '#fff', color: '#B3261E', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!showForm && (
            <button
              onClick={startAdd}
              className="save-btn"
              style={{
                padding: '15px 22px',
                background: 'linear-gradient(135deg, #4CAF7D 0%, #3D9A6D 100%)',
                color: '#ffffff',
                borderRadius: 16,
                border: 'none',
                cursor: 'pointer',
                fontWeight: 800,
                fontSize: 16,
                fontFamily: 'inherit',
                boxShadow: '0 10px 28px rgba(76, 175, 125, 0.35)',
              }}
            >
              + Add a baby
            </button>
          )}

          {showForm && (
            <form onSubmit={onSave} style={{ display: 'grid', gap: 20, marginTop: 4 }}>
              <label style={{ display: 'grid', gap: 8, fontSize: 15, color: '#2D3436', fontWeight: 600 }}>
                Baby's name
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Daisy"
                  style={fieldBase}
                />
              </label>

              <label style={{ display: 'grid', gap: 8, fontSize: 15, color: '#2D3436', fontWeight: 600 }}>
                Date of birth
                <input
                  type="date"
                  value={form.birth_date}
                  onChange={(e) => setForm((f) => ({ ...f, birth_date: e.target.value }))}
                  style={fieldBase}
                  required
                />
              </label>

              <label style={{ display: 'grid', gap: 8, fontSize: 15, color: '#2D3436', fontWeight: 600 }}>
                Sex (optional)
                <select
                  value={form.sex}
                  onChange={(e) => setForm((f) => ({ ...f, sex: e.target.value as Baby['sex'] }))}
                  style={fieldBase}
                >
                  <option value="unknown">Prefer not to say</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                </select>
              </label>

              {form.birth_date && (
                <div
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#1E5E3A',
                    background: '#EDF9F3', border: '1px solid #A8DDB8', borderRadius: 14,
                    padding: '11px 14px', fontWeight: 600,
                  }}
                >
                  <span style={{ fontSize: 18 }}>🌱</span>
                  <span>Calculated age: <strong>{monthsBetween(form.birth_date)} months</strong></span>
                </div>
              )}

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  type="submit"
                  className="save-btn"
                  style={{
                    padding: '15px 22px',
                    background: 'linear-gradient(135deg, #4CAF7D 0%, #3D9A6D 100%)',
                    color: '#ffffff', borderRadius: 16, border: 'none', cursor: 'pointer',
                    fontWeight: 800, fontSize: 16, fontFamily: 'inherit',
                    boxShadow: '0 10px 28px rgba(76, 175, 125, 0.35)',
                  }}
                >
                  {editingId ? 'Save changes' : 'Add baby'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditingId(null); }}
                  style={{
                    padding: '15px 22px', background: '#fff', color: '#4A6B55',
                    borderRadius: 16, border: '1.5px solid #C8E2D4', cursor: 'pointer',
                    fontWeight: 700, fontSize: 16, fontFamily: 'inherit',
                  }}
                >
                  Cancel
                </button>
              </div>

              {saved && <div style={{ color: '#27AE60', fontWeight: 700, fontSize: 15 }}>✓ Saved!</div>}
            </form>
          )}

          <p style={{ marginTop: 4, fontSize: 13, color: '#636E72', lineHeight: 1.6 }}>
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
        .save-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 32px rgba(76, 175, 125, 0.42) !important;
        }
        .save-btn:active {
          transform: translateY(0);
        }
      `}</style>
    </main>
  );
}
