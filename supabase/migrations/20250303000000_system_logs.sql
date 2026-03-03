-- Phase 7-2: System logs for observability (server action errors, realtime, global, edge).

create table if not exists public.system_logs (
  id uuid primary key default gen_random_uuid(),
  level text not null check (level in ('INFO', 'WARN', 'ERROR')),
  source text not null,
  message text not null,
  metadata jsonb default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_system_logs_created_at on public.system_logs(created_at desc);
create index if not exists idx_system_logs_level on public.system_logs(level);
create index if not exists idx_system_logs_source on public.system_logs(source);

alter table public.system_logs enable row level security;

-- Only ADMIN can select. Service role (server inserts) bypasses RLS.
create policy "system_logs_select_admin"
  on public.system_logs for select to authenticated
  using (
    (select role from public.users where id = auth.uid()) = 'ADMIN'
  );

-- No insert policy for authenticated: app uses service role to insert.
