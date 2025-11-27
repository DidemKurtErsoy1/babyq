import { createClient, SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

export function getSupabaseBrowser() {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  try {
    client = createClient(url, key, { auth: { persistSession: true } });
    return client;
  } catch (err) {
    console.error('Supabase browser client init failed', err);
    return null;
  }
}
