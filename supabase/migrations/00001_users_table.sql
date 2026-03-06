-- Run in Supabase SQL editor. Required for Phase 4-2 Supabase Auth.
-- In Supabase Dashboard: Authentication → Providers → enable "Anonymous sign-in".

-- Table: public.users (profile per auth.users id)

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  role text not null check (role in ('LAY', 'MISSIONARY', 'PASTOR', 'ADMIN')),
  bio text,
  affiliation text,
  created_at timestamptz not null default now()
);

-- RLS: allow read for authenticated, insert/update own row only
alter table public.users enable row level security;

create policy "Users are viewable by authenticated users"
  on public.users for select
  to authenticated
  using (true);

create policy "Users can insert own profile"
  on public.users for insert
  to authenticated
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.users for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);
