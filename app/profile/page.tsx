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
    borderRadius: 14,
    border: '1px solid #E4D3BF',
    background: '#FFF9EF',
    color: '#18110B',
    outline: 'none',
    fontSize: 16,
    transition: 'box-shadow 0.15s ease',
  } as const;

  const hasProfile = babyName.trim() || birthDate;

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #FFF7EC 0%, #FFEFD9 28%, #FFF7EC 100%)',
      }}
    >
      <div
        style={{
          maxWidth: 820,
          margin: '0 auto',
          padding: '36px 20px 54px',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
        }}
      >
        <section
          style={{
            border: '1px solid #F0DED0',
            background: '#FFFFFF',
            borderRadius: 22,
            padding: '30px 26px',
            boxShadow: '0 14px 36px rgba(0,0,0,0.06)',
            display: 'grid',
            gap: 14,
          }}
        >
          <div style={{ display: 'grid', gap: 6 }}>
            <h1 style={{ fontSize: 33, fontWeight: 800, margin: 0, color: '#18110B' }}>Profile</h1>
            <p style={{ opacity: 0.82, marginTop: 2, fontSize: 16, color: '#6F665D' }}>
              Enter your baby’s info. <strong>Age (months)</strong> will auto-fill on the Ask page.
            </p>
          </div>

          <form onSubmit={onSave} style={{ display: 'grid', gap: 18, marginTop: 4 }}>
            <label style={{ display: 'grid', gap: 8, fontSize: 15, color: '#18110B' }}>
              <span style={{ fontWeight: 700 }}>Baby’s name (optional)</span>
              <input
                value={babyName}
                onChange={(e) => setBabyName(e.target.value)}
                placeholder="e.g. Daisy"
                style={fieldBase}
                onFocus={(e) =>
                  (e.currentTarget.style.boxShadow = '0 0 0 3px rgba(75,166,181,0.3)')
                }
                onBlur={(e) => (e.currentTarget.style.boxShadow = 'none')}
              />
            </label>

            <label style={{ display: 'grid', gap: 8, fontSize: 15, color: '#18110B' }}>
              <span style={{ fontWeight: 700 }}>Date of birth</span>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                style={fieldBase}
                onFocus={(e) =>
                  (e.currentTarget.style.boxShadow = '0 0 0 3px rgba(75,166,181,0.3)')
                }
                onBlur={(e) => (e.currentTarget.style.boxShadow = 'none')}
                required
              />
            </label>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontSize: 14,
                color: '#514730',
                background: '#FFF3DC',
                border: '1px solid #F0DED0',
                borderRadius: 14,
                padding: '10px 12px',
              }}
            >
              <span
                style={{
                  padding: '6px 10px',
                  borderRadius: 10,
                  background: '#FFEDD1',
                  border: '1px solid #E8CFA3',
                  display: 'inline-flex',
                }}
              >
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
                padding: '15px 18px',
                background: '#FFB545',
                color: '#ffffff',
                borderRadius: 14,
                border: '1px solid #E5A03A',
                cursor: 'pointer',
                fontWeight: 750,
                letterSpacing: 0.1,
                boxShadow: '0 10px 24px rgba(255,181,69,0.35)',
                transition: 'transform 0.15s ease, box-shadow 0.2s ease, background 0.15s ease',
              }}
            >
              Save
            </button>

            {saved && <div style={{ color: '#2F8D46', fontWeight: 650 }}>Saved ✓</div>}
          </form>

          <p style={{ marginTop: 4, fontSize: 14, color: '#6F665D', lineHeight: 1.6 }}>
            Profile data is stored locally on this device and used to pre-fill the Ask page.
          </p>
        </section>

        {hasProfile && (
          <section
            aria-label="Saved profile"
            style={{
              border: '1px solid #F0DED0',
              background: '#FFF5E3',
              borderRadius: 18,
              padding: 20,
              boxShadow: '0 12px 26px rgba(0,0,0,0.07)',
              display: 'grid',
              gap: 8,
            }}
          >
            <h2 style={{ fontSize: 21, fontWeight: 750, margin: 0, color: '#18110B' }}>Saved profile</h2>
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

        .primary-btn:hover {
          background: #d6800f;
          box-shadow: 0 12px 26px rgba(214, 128, 15, 0.35);
          transform: translateY(-1px);
        }
      `}</style>
    </main>
  );
}
