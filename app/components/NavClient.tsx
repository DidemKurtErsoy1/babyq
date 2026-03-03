'use client';

import Link from 'next/link';
import { useAuth } from '../../lib/useAuth';

export default function NavClient() {
  const { user, loading, signOut } = useAuth();

  if (loading) return null;

  if (user) {
    return (
      <>
        <Link className="nav-btn" href="/history">Geçmişim</Link>
        <button
          onClick={signOut}
          className="nav-btn"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: 'inherit',
            padding: 0,
          }}
        >
          Çıkış
        </button>
      </>
    );
  }

  return <Link className="nav-btn" href="/login">Giriş Yap</Link>;
}
