-- Personal assistant: initial schema.
--
-- Design notes:
--   * Every user-facing table is RLS-protected and scoped by user_id = auth.uid().
--   * `connections` holds OAuth tokens and deliberately has NO policies at all:
--     RLS is on, nothing matches, so the anon/authenticated keys can never read
--     it. Only the server (service role, which bypasses RLS) touches that table.
--   * `activity_log` is append-only from the user's point of view: they can read
--     their own history but never insert, update or delete it. The agent writes
--     it server-side. An audit trail the subject can edit is not an audit trail.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- profiles: who the assistant is working for, and how to reach them
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  -- IANA zone. Every "today" the agent reasons about is a local day in this zone.
  timezone text not null default 'Europe/Istanbul',
  locale text not null default 'tr',
  -- E.164, e.g. +905321234567. Null until the user verifies a number.
  whatsapp_phone text,
  whatsapp_verified boolean not null default false,
  -- Local hour-of-day for the morning brief, 0-23.
  brief_hour smallint not null default 7 check (brief_hour between 0 and 23),
  brief_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy profiles_select_own on public.profiles
  for select using (id = auth.uid());
create policy profiles_insert_own on public.profiles
  for insert with check (id = auth.uid());
create policy profiles_update_own on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- ---------------------------------------------------------------------------
-- connections: OAuth connectors (Google Calendar today, more later)
-- No RLS policies on purpose — see header note.
-- ---------------------------------------------------------------------------
create table if not exists public.connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('google_calendar', 'notion')),
  status text not null default 'connected'
    check (status in ('connected', 'revoked', 'error')),
  account_email text,
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  scope text,
  last_synced_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);

alter table public.connections enable row level security;

-- ---------------------------------------------------------------------------
-- items: everything the assistant can put in a brief.
-- Manual records (therapy session, doctor, bill) and synced calendar events
-- share one table so the brief has a single thing to rank.
-- ---------------------------------------------------------------------------
create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null default 'reminder'
    check (kind in ('appointment', 'reminder', 'bill', 'note', 'event', 'task', 'goal')),
  title text not null,
  notes text,
  location text,
  starts_at timestamptz,
  ends_at timestamptz,
  all_day boolean not null default false,
  -- 0 = normal, 1 = important, 2 = critical. Drives the "şu önemli" section.
  importance smallint not null default 0 check (importance between 0 and 2),
  -- Null, or one of the simple rules understood by lib/recurrence.ts.
  recurrence text,
  source text not null default 'manual'
    check (source in ('manual', 'google_calendar', 'notion')),
  -- Provider-side id, so a re-sync updates rather than duplicates.
  external_id text,
  status text not null default 'active'
    check (status in ('active', 'done', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists items_external_unique
  on public.items (user_id, source, external_id)
  where external_id is not null;

create index if not exists items_user_starts_at
  on public.items (user_id, starts_at)
  where status = 'active';

alter table public.items enable row level security;

create policy items_select_own on public.items
  for select using (user_id = auth.uid());
create policy items_insert_own on public.items
  for insert with check (user_id = auth.uid());
create policy items_update_own on public.items
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy items_delete_own on public.items
  for delete using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- briefs: one composed daily message per user per local day
-- ---------------------------------------------------------------------------
create table if not exists public.briefs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  -- The user's LOCAL date, not a UTC date.
  brief_date date not null,
  body text not null,
  -- Structured version of the same brief, for rendering in the web UI.
  payload jsonb not null default '{}'::jsonb,
  channel text not null default 'console'
    check (channel in ('whatsapp', 'console', 'email')),
  delivery_status text not null default 'pending'
    check (delivery_status in ('pending', 'sent', 'failed', 'skipped')),
  delivered_at timestamptz,
  delivery_error text,
  created_at timestamptz not null default now(),
  unique (user_id, brief_date)
);

alter table public.briefs enable row level security;

create policy briefs_select_own on public.briefs
  for select using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- approvals: nothing outward-facing happens without an explicit yes
-- ---------------------------------------------------------------------------
create table if not exists public.approvals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  action_type text not null,
  title text not null,
  description text,
  -- Exactly what would be executed, so the user approves a concrete thing.
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'expired', 'executed', 'failed')),
  requested_at timestamptz not null default now(),
  decided_at timestamptz,
  executed_at timestamptz,
  expires_at timestamptz,
  result jsonb,
  created_at timestamptz not null default now()
);

create index if not exists approvals_user_pending
  on public.approvals (user_id, requested_at desc)
  where status = 'pending';

alter table public.approvals enable row level security;

create policy approvals_select_own on public.approvals
  for select using (user_id = auth.uid());
-- The user may decide, but may not invent an approval or rewrite its payload.
create policy approvals_decide_own on public.approvals
  for update using (user_id = auth.uid() and status = 'pending')
  with check (user_id = auth.uid() and status in ('approved', 'rejected'));

-- ---------------------------------------------------------------------------
-- activity_log: the full record of what the agent did, read-only to the user
-- ---------------------------------------------------------------------------
create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  at timestamptz not null default now(),
  actor text not null default 'agent' check (actor in ('agent', 'user', 'system')),
  -- Dotted event name, e.g. 'brief.generated', 'calendar.synced'.
  action text not null,
  summary text not null,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists activity_log_user_at
  on public.activity_log (user_id, at desc);

alter table public.activity_log enable row level security;

create policy activity_select_own on public.activity_log
  for select using (user_id = auth.uid());
