-- Rate limits: one row per (user_id, action) event for write-action throttling.

create table if not exists public.rate_limits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  action text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_rate_limits_user_action_created
  on public.rate_limits(user_id, action, created_at desc);

alter table public.rate_limits enable row level security;

create policy "rate_limits_insert_own"
  on public.rate_limits for insert to authenticated
  with check (user_id = auth.uid());

create policy "rate_limits_select_own"
  on public.rate_limits for select to authenticated
  using (user_id = auth.uid());

create policy "rate_limits_select_admin"
  on public.rate_limits for select to authenticated
  using (
    (select role from public.users where id = auth.uid()) = 'ADMIN'
  );
