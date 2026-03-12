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
  category     text not null default 'PERSONAL',  -- PERSONAL | FAMILY | CELL | CHURCH | MISSION | SOCIAL
  visibility   text not null default 'PUBLIC',    -- PUBLIC | CELL | PRIVATE
  answered_at  timestamptz,
  answer_note  text,
  created_at   timestamptz not null default now()
);

-- intercessions: who prayed for each request
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
  status         text not null default 'ACTIVE',   -- ACTIVE | PAUSED | COMPLETED
  created_at     timestamptz not null default now()
);

-- Reports posted by the missionary on a project
create table if not exists public.missionary_reports (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.missionary_projects(id) on delete cascade,
  content     text not null,
  created_at  timestamptz not null default now()
);

-- Supporters: prayer or financial
create table if not exists public.missionary_supporters (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references public.missionary_projects(id) on delete cascade,
  user_id      uuid not null references public.users(id) on delete cascade,
  support_type text not null default 'PRAYER',   -- PRAYER | FINANCIAL
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
create policy if not exists "pr_select"
  on public.prayer_requests for select to authenticated
  using (visibility = 'PUBLIC' or user_id = auth.uid());

create policy if not exists "pr_insert"
  on public.prayer_requests for insert to authenticated
  with check (user_id = auth.uid());

create policy if not exists "pr_update"
  on public.prayer_requests for update to authenticated
  using (user_id = auth.uid());

create policy if not exists "pr_delete"
  on public.prayer_requests for delete to authenticated
  using (user_id = auth.uid());

-- prayer_intercessions
create policy if not exists "pi_select"
  on public.prayer_intercessions for select to authenticated using (true);

create policy if not exists "pi_insert"
  on public.prayer_intercessions for insert to authenticated
  with check (user_id = auth.uid());

create policy if not exists "pi_delete"
  on public.prayer_intercessions for delete to authenticated
  using (user_id = auth.uid());

-- missionary_projects
create policy if not exists "mp_select"
  on public.missionary_projects for select to authenticated using (true);

create policy if not exists "mp_insert"
  on public.missionary_projects for insert to authenticated
  with check (missionary_id = auth.uid());

create policy if not exists "mp_update"
  on public.missionary_projects for update to authenticated
  using (missionary_id = auth.uid());

-- missionary_reports
create policy if not exists "mr_select"
  on public.missionary_reports for select to authenticated using (true);

create policy if not exists "mr_insert"
  on public.missionary_reports for insert to authenticated
  with check (
    exists (
      select 1 from public.missionary_projects p
      where p.id = project_id and p.missionary_id = auth.uid()
    )
  );

-- missionary_supporters
create policy if not exists "ms_select"
  on public.missionary_supporters for select to authenticated using (true);

create policy if not exists "ms_insert"
  on public.missionary_supporters for insert to authenticated
  with check (user_id = auth.uid());

create policy if not exists "ms_delete"
  on public.missionary_supporters for delete to authenticated
  using (user_id = auth.uid());
