'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/useAuth';

export default function LoginPage() {
  const { signIn, signUp } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signUpConfirm, setSignUpConfirm] = useState(false);

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
    boxSizing: 'border-box' as const,
    transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (tab === 'signin') {
        await signIn(email, password);
        router.push('/');
      } else {
        await signUp(email, password);
        setSignUpConfirm(true);
      }
    } catch (err: any) {
      setError(err?.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #FFF8F0 0%, #F0FAF4 40%, #FFF8F0 100%)' }}>
      <div
        style={{
          maxWidth: 480,
          margin: '0 auto',
          padding: '48px 20px 64px',
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
          }}
        >
          <h1 style={{ fontSize: 28, fontWeight: 900, margin: '0 0 24px', color: '#1A3328' }}>
            {tab === 'signin' ? 'Giriş Yap' : 'Kayıt Ol'}
          </h1>

          {/* Tabs */}
          <div
            style={{
              display: 'flex',
              gap: 0,
              borderRadius: 12,
              background: '#F0FAF4',
              border: '1px solid #C8E2D4',
              padding: 4,
              marginBottom: 24,
            }}
          >
            {(['signin', 'signup'] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(null); setSignUpConfirm(false); }}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  borderRadius: 9,
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontWeight: 700,
                  fontSize: 15,
                  background: tab === t ? '#4CAF7D' : 'transparent',
                  color: tab === t ? '#fff' : '#3D6B52',
                  transition: 'background 0.15s ease, color 0.15s ease',
                }}
              >
                {t === 'signin' ? 'Giriş Yap' : 'Kayıt Ol'}
              </button>
            ))}
          </div>

          {signUpConfirm ? (
            <div
              style={{
                padding: 16,
                border: '1px solid #A8DDB8',
                background: '#EDF9F3',
                borderRadius: 14,
                color: '#1E5E3A',
                fontWeight: 600,
                lineHeight: 1.6,
              }}
            >
              Kayıt başarılı! Lütfen e-posta adresinizi doğrulayın, ardından giriş yapabilirsiniz.
            </div>
          ) : (
            <form onSubmit={onSubmit} style={{ display: 'grid', gap: 18 }}>
              {error && (
                <div
                  role="alert"
                  style={{
                    padding: 13,
                    border: '1px solid #F5B8B8',
                    background: '#FFF5F5',
                    color: '#8C1F1F',
                    borderRadius: 14,
                    fontSize: 14,
                  }}
                >
                  {error}
                </div>
              )}

              <label style={{ display: 'grid', gap: 8, fontSize: 15, color: '#2D3436', fontWeight: 600 }}>
                E-posta
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ornek@email.com"
                  style={fieldBase}
                  required
                  autoComplete="email"
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
                Şifre
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="En az 6 karakter"
                  style={fieldBase}
                  required
                  minLength={6}
                  autoComplete={tab === 'signin' ? 'current-password' : 'new-password'}
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

              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '15px 22px',
                  background: loading
                    ? '#A8D9BE'
                    : 'linear-gradient(135deg, #4CAF7D 0%, #3D9A6D 100%)',
                  color: '#ffffff',
                  borderRadius: 16,
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: 800,
                  fontSize: 16,
                  fontFamily: 'inherit',
                  boxShadow: loading ? 'none' : '0 10px 28px rgba(76, 175, 125, 0.35)',
                  opacity: loading ? 0.75 : 1,
                  transition: 'transform 0.15s ease, box-shadow 0.2s ease',
                }}
              >
                {loading ? 'Bekleyin…' : tab === 'signin' ? 'Giriş Yap' : 'Kayıt Ol'}
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
