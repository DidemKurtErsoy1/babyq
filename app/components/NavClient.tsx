'use client';

import Link from 'next/link';
import { useAuth } from '../../lib/useAuth';

export default function NavClient() {
  const { user, loading, signOut } = useAuth();

  if (loading) return null;

  if (user) {
    return (
      <>
        <Link className="nav-btn" href="/history">History</Link>
        <button
          onClick={signOut}
          className="nav-btn"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: 14,
            padding: '8px 14px',
          }}
        >
          Sign Out
        </button>
      </>
    );
  }

  return (
    <Link className="nav-btn nav-btn-signin" href="/login">
      Sign In
    </Link>
  );
}
