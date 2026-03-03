// lib/supabaseBrowser.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

export function getSupabaseBrowser(): SupabaseClient | null {
  // 1) SSR / Edge tarafında çalışıyorsak hiç oluşturma
  if (typeof window === 'undefined') {
    return null;
  }

  // 2) Daha önce oluşturduysak aynı instance'ı kullan
  if (client) return client;

  // 3) Env değişkenlerini oku (esas önemli olan NEXT_PUBLIC olanlar)
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error(
      '[BabyQ] Supabase env vars missing.',
      'NEXT_PUBLIC_SUPABASE_URL:', url ? 'SET' : 'MISSING',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY:', key ? 'SET' : 'MISSING',
    );
    return null;
  }

  // 4) Tek seferlik client oluştur
  try {
    client = createClient(url, key, {
      auth: { persistSession: true },
    });
  } catch {
    return null;
  }

  return client;
}
