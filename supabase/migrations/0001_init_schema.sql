-- BabyQ initial schema
-- Matches the tables/columns actually used by app/api/ask/route.ts,
-- app/api/feedback/route.ts, app/profile/page.tsx and app/history/page.tsx.
-- Run in Supabase Dashboard -> SQL Editor.

create extension if not exists pgcrypto;

-- faqs: curated Q&A, read by the FAQ-scoring layer (service role, server-side)
create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  age_min integer,
  age_max integer,
  category text,
  question text,
  answer text not null,
  source text
);

alter table public.faqs enable row level security;

create policy faqs_read_all
  on public.faqs for select
  using (true);

-- questions: every asked question + resolved answer, one row per /api/ask call
create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  child_age_months integer check (child_age_months >= 0 and child_age_months <= 60),
  text text not null,
  answer text,
  source text,
  sex text,
  urgent boolean default false
);

alter table public.questions enable row level security;

create policy questions_select_own
  on public.questions for select
  using (user_id = auth.uid());

create policy questions_insert_own
  on public.questions for insert
  with check (user_id = auth.uid());

-- feedback: thumbs up/down on answers
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  question_text text,
  age_months integer,
  was_helpful boolean not null,
  created_at timestamptz default now()
);

alter table public.feedback enable row level security;

-- profiles: baby profile per authenticated user
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  baby_name text,
  birth_date date,
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy profiles_self_select
  on public.profiles for select
  using (id = auth.uid());

create policy profiles_self_insert
  on public.profiles for insert
  with check (id = auth.uid());

create policy profiles_self_update
  on public.profiles for update
  using (id = auth.uid());
