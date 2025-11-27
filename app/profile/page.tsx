'use client';

import { useEffect, useMemo, useState } from 'react';

type Profile = { baby_name: string; birth_date: string };
const LS_KEY = 'babyq_profile_v1';

function monthsBetween(birthISO: string) {
  if (!birthISO) return 0;
  const b = new Date(birthISO);
  const now = new Date();
  let m = (now.getFullYear() - b.getFullYear()) * 12 + (now.getMonth() - b.getMonth());
  if (now.getDate() < b.getDate()) m -= 1;
  return Math.max(0, m);
}

export default function ProfilePage() {
  const [babyName, setBabyName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [saved, setSaved] = useState(false);

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

  function onSave(e: React.FormEvent) {
    e.preventDefault();
    const p: Profile = { baby_name: babyName.trim(), birth_date: birthDate };
    localStorage.setItem(LS_KEY, JSON.stringify(p));
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  const fieldBase = {
    width: '100%',
    padding: '13px 14px',
    borderRadius: 12,
    border: '1px solid #DED6C8',
    background: '#FBF7EE',
    color: '#111',
    outline: 'none',
    fontSize: 16,
  } as const;

  const hasProfile = babyName.trim() || birthDate;

  return (
    <main style={{ background: '#F7F0E5', minHeight: '100vh' }}>
      <div
        style={{
          maxWidth: 800,
          margin: '0 auto',
          padding: '32px 18px 48px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <section
          style={{
            border: '1px solid #EEE',
            background: '#FFF',
            borderRadius: 18,
            padding: '28px 24px',
            boxShadow: '0 8px 28px rgba(0,0,0,0.05)',
          }}
        >
          <h1 style={{ fontSize: 32, fontWeight: 800, margin: 0, color: '#0E0A05' }}>Profile</h1>
          <p style={{ opacity: 0.75, marginTop: 8, fontSize: 16 }}>
            Enter your baby’s info. <strong>Age (months)</strong> will auto-fill on the Ask page.
          </p>

          <form onSubmit={onSave} style={{ display: 'grid', gap: 16, marginTop: 18 }}>
            <label style={{ display: 'grid', gap: 8, fontSize: 15 }}>
              <span style={{ fontWeight: 700, color: '#0E0A05' }}>Baby’s name (optional)</span>
              <input
                value={babyName}
                onChange={(e) => setBabyName(e.target.value)}
                placeholder="e.g. Daisy"
                style={fieldBase}
                onFocus={(e) =>
                  (e.currentTarget.style.boxShadow = '0 0 0 3px rgba(17,17,17,0.12)')
                }
                onBlur={(e) => (e.currentTarget.style.boxShadow = 'none')}
              />
            </label>

            <label style={{ display: 'grid', gap: 8, fontSize: 15 }}>
              <span style={{ fontWeight: 700, color: '#0E0A05' }}>Date of birth</span>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                style={fieldBase}
                onFocus={(e) =>
                  (e.currentTarget.style.boxShadow = '0 0 0 3px rgba(17,17,17,0.12)')
                }
                onBlur={(e) => (e.currentTarget.style.boxShadow = 'none')}
                required
              />
            </label>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#514730' }}>
              <span style={{ padding: '6px 10px', borderRadius: 10, background: '#F4EBDD', border: '1px solid #E4D9C5' }}>
                ℹ️
              </span>
              <span>
                Calculated age: <strong>{ageMonths}</strong> months
              </span>
            </div>

            <button
              type="submit"
              className="primary-btn"
              style={{
                padding: '14px 18px',
                background: '#111',
                color: '#FAF7F0',
                borderRadius: 14,
                border: '1px solid #0E0A05',
                cursor: 'pointer',
                fontWeight: 700,
                letterSpacing: 0.1,
                boxShadow: '0 6px 14px rgba(0,0,0,0.08)',
              }}
            >
              Save
            </button>

            {saved && <div style={{ color: 'green', fontWeight: 600 }}>Saved ✓</div>}
          </form>

          <p style={{ marginTop: 16, fontSize: 14, color: '#6B6250' }}>
            Profile data is stored locally on this device and used to pre-fill the Ask page.
          </p>
        </section>

        {hasProfile && (
          <section
            aria-label="Saved profile"
            style={{
              border: '1px solid #EAE2D4',
              background: '#FFFEFA',
              borderRadius: 14,
              padding: 18,
              boxShadow: '0 6px 16px rgba(0,0,0,0.05)',
              display: 'grid',
              gap: 6,
            }}
          >
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: '#0E0A05' }}>Saved profile</h2>
            <div style={{ fontSize: 15, color: '#1C1A17' }}>Name: {babyName || '—'}</div>
            <div style={{ fontSize: 15, color: '#1C1A17' }}>Date of birth: {birthDate || '—'}</div>
            <div style={{ fontSize: 15, color: '#1C1A17' }}>Calculated age: {ageMonths} months</div>
          </section>
        )}
      </div>

      <style jsx>{`
        @media (min-width: 768px) {
          .primary-btn {
            width: auto;
            min-width: 220px;
            align-self: flex-start;
          }
        }

        @media (max-width: 767px) {
          .primary-btn {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}
