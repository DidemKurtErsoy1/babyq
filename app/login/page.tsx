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
    <main className="page-shell">
      <div
        style={{
          maxWidth: 460,
          margin: '0 auto',
          padding: '64px 20px 72px',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        <section className="premium-card" style={{ padding: '34px 32px' }}>
          <h1 style={{ fontSize: 27, fontWeight: 800, margin: '0 0 22px', color: 'var(--brand)', letterSpacing: '-0.02em' }}>
            {tab === 'signin' ? 'Sign In' : 'Sign Up'}
          </h1>

          {/* Tabs */}
          <div
            style={{
              display: 'flex',
              gap: 0,
              borderRadius: 'var(--radius-sm)',
              background: 'var(--surface-sunken)',
              border: '1px solid var(--border)',
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
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontWeight: 700,
                  fontSize: 15,
                  background: tab === t ? 'var(--accent)' : 'transparent',
                  color: tab === t ? '#fff' : 'var(--ink-secondary)',
                  boxShadow: tab === t ? '0 4px 12px rgba(47,122,87,0.28)' : 'none',
                  transition: 'background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease',
                }}
              >
                {t === 'signin' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          {signUpConfirm ? (
            <div className="alert alert-ok">
              Sign up successful! Please verify your email address, then you can sign in.
            </div>
          ) : (
            <form onSubmit={onSubmit} style={{ display: 'grid', gap: 18 }}>
              {error && (
                <div role="alert" className="alert alert-danger">{error}</div>
              )}

              <label>
                <span className="field-label">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="input"
                  required
                  autoComplete="email"
                />
              </label>

              <label>
                <span className="field-label">Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="input"
                  required
                  minLength={6}
                  autoComplete={tab === 'signin' ? 'current-password' : 'new-password'}
                />
              </label>

              <button type="submit" disabled={loading} className="btn" style={{ fontSize: 15.5, opacity: loading ? 0.75 : 1 }}>
                {loading ? 'Please wait…' : tab === 'signin' ? 'Sign In' : 'Sign Up'}
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
