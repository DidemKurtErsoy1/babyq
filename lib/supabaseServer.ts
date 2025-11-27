import { createClient, SupabaseClient } from '@supabase/supabase-js';

let adminClient: SupabaseClient | null = null;

export function getSupabaseServer() {
  if (adminClient) return adminClient;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.warn('Supabase server env vars missing: expected SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
    return null;
  }

  try {
    adminClient = createClient(url, key, { auth: { persistSession: false } });
    return adminClient;
  } catch (err) {
    console.error('Supabase server client init failed', err);
    return null;
  }
}
