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

  const hasProfile = babyName.trim() || birthDate;

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
            <h1 style={{ fontSize: 32, fontWeight: 900, margin: 0, color: '#1A3328' }}>Baby Profile</h1>
            <p style={{ marginTop: 4, fontSize: 16, color: '#4A6B55', lineHeight: 1.6 }}>
              Enter your baby's info. <strong>Age (months)</strong> will auto-fill on the Ask page.
            </p>
          </div>

          <form onSubmit={onSave} style={{ display: 'grid', gap: 20, marginTop: 4 }}>
            <label style={{ display: 'grid', gap: 8, fontSize: 15, color: '#2D3436', fontWeight: 600 }}>
              Baby's name (optional)
              <input
                value={babyName}
                onChange={(e) => setBabyName(e.target.value)}
                placeholder="e.g. Daisy"
                style={fieldBase}
                onFocus={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(76,175,125,0.25)';
                  e.currentTarget.style.borderColor = '#4CAF7D';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = '#C8E2D4';
                }}
              />
            </label>

            <label style={{ display: 'grid', gap: 8, fontSize: 15, color: '#2D3436', fontWeight: 600 }}>
              Date of birth
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                style={fieldBase}
                onFocus={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(76,175,125,0.25)';
                  e.currentTarget.style.borderColor = '#4CAF7D';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = '#C8E2D4';
                }}
                required
              />
            </label>

            {birthDate && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontSize: 14,
                  color: '#1E5E3A',
                  background: '#EDF9F3',
                  border: '1px solid #A8DDB8',
                  borderRadius: 14,
                  padding: '11px 14px',
                  fontWeight: 600,
                }}
              >
                <span style={{ fontSize: 18 }}>🌱</span>
                <span>
                  Calculated age: <strong>{ageMonths} months</strong>
                </span>
              </div>
            )}

            <button
              type="submit"
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
                transition: 'transform 0.15s ease, box-shadow 0.2s ease',
              }}
            >
              Save profile
            </button>

            {saved && (
              <div style={{ color: '#27AE60', fontWeight: 700, fontSize: 15 }}>
                ✓ Profile saved!
              </div>
            )}
          </form>

          <p style={{ marginTop: 4, fontSize: 13, color: '#636E72', lineHeight: 1.6 }}>
            Profile data is stored locally on this device and used to pre-fill the Ask page.
          </p>
        </section>

        {hasProfile && (
          <section
            aria-label="Saved profile"
            style={{
              border: '1px solid #A8DDB8',
              background: '#EDF9F3',
              borderRadius: 22,
              padding: '22px 26px',
              boxShadow: '0 8px 28px rgba(44, 122, 86, 0.1)',
              display: 'grid',
              gap: 10,
            }}
          >
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: '#1A3328' }}>Saved profile</h2>
            <div style={{ fontSize: 15, color: '#2D3436' }}>Name: {babyName || '—'}</div>
            <div style={{ fontSize: 15, color: '#2D3436' }}>Date of birth: {birthDate || '—'}</div>
            <div style={{ fontSize: 15, color: '#2D3436' }}>Calculated age: {ageMonths} months</div>
          </section>
        )}
      </div>

      <style jsx>{`
        @media (min-width: 640px) {
          .save-btn {
            width: auto;
            min-width: 220px;
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
