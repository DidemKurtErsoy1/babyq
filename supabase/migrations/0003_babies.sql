-- BabyQ multi-baby support
-- Adds a babies table (a user can have more than one child) and links
-- questions to the baby they were asked about.
-- Run after 0001_init_schema.sql / 0002_seed_faqs.sql, in Supabase Dashboard -> SQL Editor.

create table if not exists public.babies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  birth_date date,
  sex text,
  created_at timestamptz not null default now()
);

alter table public.babies enable row level security;

create policy babies_select_own
  on public.babies for select
  using (user_id = auth.uid());

create policy babies_insert_own
  on public.babies for insert
  with check (user_id = auth.uid());

create policy babies_update_own
  on public.babies for update
  using (user_id = auth.uid());

create policy babies_delete_own
  on public.babies for delete
  using (user_id = auth.uid());

alter table public.questions
  add column if not exists baby_id uuid references public.babies(id) on delete set null;
