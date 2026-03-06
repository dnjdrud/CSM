-- Phase 5-1.5: Audit logs for admin actions. Optional: blocks/mutes for admin user actions.

-- Audit log: who did what, when
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.users(id) on delete cascade,
  action text not null,
  target_type text not null check (target_type in ('post', 'comment', 'user', 'invite', 'report')),
  target_id text,
  metadata jsonb default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_created_at on public.audit_logs(created_at desc);
create index if not exists idx_audit_logs_actor_id on public.audit_logs(actor_id);

alter table public.audit_logs enable row level security;

create policy "audit_logs_select_admin"
  on public.audit_logs for select to authenticated
  using (
    (select role from public.users where id = auth.uid()) = 'ADMIN'
  );

create policy "audit_logs_insert_admin"
  on public.audit_logs for insert to authenticated
  with check (
    actor_id = auth.uid()
    and (select role from public.users where id = auth.uid()) = 'ADMIN'
  );

-- Blocks: blocker_id blocks blocked_id (admin or user can block)
create table if not exists public.blocks (
  blocker_id uuid not null references public.users(id) on delete cascade,
  blocked_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id != blocked_id)
);

create table if not exists public.mutes (
  muter_id uuid not null references public.users(id) on delete cascade,
  muted_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (muter_id, muted_id),
  check (muter_id != muted_id)
);

alter table public.blocks enable row level security;
alter table public.mutes enable row level security;

-- Users can manage their own blocks/mutes (for self-service); admins can insert/delete any for admin actions
create policy "blocks_select_own" on public.blocks for select to authenticated using (true);
create policy "blocks_insert_own" on public.blocks for insert to authenticated with check (blocker_id = auth.uid());
create policy "blocks_delete_own" on public.blocks for delete to authenticated using (blocker_id = auth.uid());
create policy "blocks_all_admin" on public.blocks for all to authenticated
  using ((select role from public.users where id = auth.uid()) = 'ADMIN')
  with check ((select role from public.users where id = auth.uid()) = 'ADMIN');

create policy "mutes_select_own" on public.mutes for select to authenticated using (true);
create policy "mutes_insert_own" on public.mutes for insert to authenticated with check (muter_id = auth.uid());
create policy "mutes_delete_own" on public.mutes for delete to authenticated using (muter_id = auth.uid());
create policy "mutes_all_admin" on public.mutes for all to authenticated
  using ((select role from public.users where id = auth.uid()) = 'ADMIN')
  with check ((select role from public.users where id = auth.uid()) = 'ADMIN');

-- Allow ADMIN to update any user's role
drop policy if exists "Users can update own profile" on public.users;
create policy "Users can update own profile"
  on public.users for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);
create policy "Users_update_admin"
  on public.users for update to authenticated
  using ((select role from public.users where id = auth.uid()) = 'ADMIN')
  with check (true);
