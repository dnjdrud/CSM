-- =============================================================
-- 1. Notification preferences (JSONB column on users)
-- =============================================================
alter table public.users
  add column if not exists notification_prefs jsonb not null default '{}';

-- =============================================================
-- 2. Prayer requests (community-visible prayer board)
-- =============================================================
create table if not exists public.prayer_requests (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.users(id) on delete cascade,
  content      text not null,
  category     text not null default 'PERSONAL',
  visibility   text not null default 'PUBLIC',
  answered_at  timestamptz,
  answer_note  text,
  created_at   timestamptz not null default now()
);

create table if not exists public.prayer_intercessions (
  id                uuid primary key default gen_random_uuid(),
  prayer_request_id uuid not null references public.prayer_requests(id) on delete cascade,
  user_id           uuid not null references public.users(id) on delete cascade,
  message           text,
  created_at        timestamptz not null default now(),
  unique (prayer_request_id, user_id)
);

-- =============================================================
-- 3. Missionary projects
-- =============================================================
create table if not exists public.missionary_projects (
  id             uuid primary key default gen_random_uuid(),
  missionary_id  uuid not null references public.users(id) on delete cascade,
  title          text not null,
  country        text,
  field          text,
  description    text,
  status         text not null default 'ACTIVE',
  created_at     timestamptz not null default now()
);

create table if not exists public.missionary_reports (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.missionary_projects(id) on delete cascade,
  content     text not null,
  created_at  timestamptz not null default now()
);

create table if not exists public.missionary_supporters (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references public.missionary_projects(id) on delete cascade,
  user_id      uuid not null references public.users(id) on delete cascade,
  support_type text not null default 'PRAYER',
  created_at   timestamptz not null default now(),
  unique (project_id, user_id)
);

-- =============================================================
-- 4. RLS
-- =============================================================
alter table public.prayer_requests       enable row level security;
alter table public.prayer_intercessions  enable row level security;
alter table public.missionary_projects   enable row level security;
alter table public.missionary_reports    enable row level security;
alter table public.missionary_supporters enable row level security;

-- prayer_requests
drop policy if exists "pr_select" on public.prayer_requests;
create policy "pr_select"
  on public.prayer_requests for select to authenticated
  using (visibility = 'PUBLIC' or user_id = auth.uid());

drop policy if exists "pr_insert" on public.prayer_requests;
create policy "pr_insert"
  on public.prayer_requests for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "pr_update" on public.prayer_requests;
create policy "pr_update"
  on public.prayer_requests for update to authenticated
  using (user_id = auth.uid());

drop policy if exists "pr_delete" on public.prayer_requests;
create policy "pr_delete"
  on public.prayer_requests for delete to authenticated
  using (user_id = auth.uid());

-- prayer_intercessions
drop policy if exists "pi_select" on public.prayer_intercessions;
create policy "pi_select"
  on public.prayer_intercessions for select to authenticated using (true);

drop policy if exists "pi_insert" on public.prayer_intercessions;
create policy "pi_insert"
  on public.prayer_intercessions for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "pi_delete" on public.prayer_intercessions;
create policy "pi_delete"
  on public.prayer_intercessions for delete to authenticated
  using (user_id = auth.uid());

-- missionary_projects
drop policy if exists "mp_select" on public.missionary_projects;
create policy "mp_select"
  on public.missionary_projects for select to authenticated using (true);

drop policy if exists "mp_insert" on public.missionary_projects;
create policy "mp_insert"
  on public.missionary_projects for insert to authenticated
  with check (missionary_id = auth.uid());

drop policy if exists "mp_update" on public.missionary_projects;
create policy "mp_update"
  on public.missionary_projects for update to authenticated
  using (missionary_id = auth.uid());

-- missionary_reports
drop policy if exists "mr_select" on public.missionary_reports;
create policy "mr_select"
  on public.missionary_reports for select to authenticated using (true);

drop policy if exists "mr_insert" on public.missionary_reports;
create policy "mr_insert"
  on public.missionary_reports for insert to authenticated
  with check (
    exists (
      select 1 from public.missionary_projects p
      where p.id = project_id and p.missionary_id = auth.uid()
    )
  );

-- missionary_supporters
drop policy if exists "ms_select" on public.missionary_supporters;
create policy "ms_select"
  on public.missionary_supporters for select to authenticated using (true);

drop policy if exists "ms_insert" on public.missionary_supporters;
create policy "ms_insert"
  on public.missionary_supporters for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "ms_delete" on public.missionary_supporters;
create policy "ms_delete"
  on public.missionary_supporters for delete to authenticated
  using (user_id = auth.uid());
