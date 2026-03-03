'use client';

import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { getSupabaseBrowser } from './supabaseBrowser';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supa = getSupabaseBrowser();
    if (!supa) {
      setLoading(false);
      return;
    }

    supa.auth.getSession()
      .then(({ data }) => {
        setUser(data?.session?.user ?? null);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });

    let subscription: { unsubscribe: () => void } | null = null;
    try {
      const result = supa.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
      });
      subscription = result.data.subscription;
    } catch {
      setLoading(false);
      return;
    }

    return () => subscription?.unsubscribe();
  }, []);

  async function signIn(email: string, password: string) {
    const supa = getSupabaseBrowser();
    if (!supa) throw new Error('Supabase not configured');
    const { error } = await supa.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signUp(email: string, password: string) {
    const supa = getSupabaseBrowser();
    if (!supa) throw new Error('Supabase not configured');
    const { error } = await supa.auth.signUp({ email, password });
    if (error) throw error;
  }

  async function signOut() {
    const supa = getSupabaseBrowser();
    if (!supa) return;
    await supa.auth.signOut();
  }

  return { user, loading, signIn, signUp, signOut };
}
