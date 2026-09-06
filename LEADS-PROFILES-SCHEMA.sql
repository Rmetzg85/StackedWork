-- Optional schema hardening for Settings profile + /l/[id] lead form
-- Run on the active Supabase project if columns/tables are missing.

alter table public.leads add column if not exists name text;
alter table public.leads add column if not exists phone text;
alter table public.leads add column if not exists email text;
alter table public.leads add column if not exists message text;
alter table public.leads add column if not exists job_type text;
alter table public.leads add column if not exists urgent boolean default false;
alter table public.leads add column if not exists source text;
alter table public.leads add column if not exists read boolean default false;
alter table public.leads add column if not exists contractor_id uuid;
alter table public.leads add column if not exists created_at timestamptz default now();

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  trade text,
  service_area text,
  phone text,
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;
-- Basic owner policies (safe to re-run if names differ — adjust as needed)
do $$ begin
  create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "profiles_upsert_own" on public.profiles for insert with check (auth.uid() = id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
exception when duplicate_object then null; end $$;
