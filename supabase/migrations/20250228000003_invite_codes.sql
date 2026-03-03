-- Phase 5-1: Invite-only beta. Single-use invite codes; ADMIN generates, users consume at onboarding.

create table if not exists public.invite_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  created_by uuid not null references public.users(id) on delete cascade,
  used_by uuid references public.users(id) on delete set null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_invite_codes_code on public.invite_codes(code);
create index if not exists idx_invite_codes_created_at on public.invite_codes(created_at desc);

alter table public.invite_codes enable row level security;

-- Only ADMIN can insert (and must set created_by = auth.uid())
create policy "invite_codes_insert_admin"
  on public.invite_codes for insert to authenticated
  with check (
    created_by = auth.uid()
    and (select role from public.users where id = auth.uid()) = 'ADMIN'
  );

-- Only ADMIN can select (list codes)
create policy "invite_codes_select_admin"
  on public.invite_codes for select to authenticated
  using (
    (select role from public.users where id = auth.uid()) = 'ADMIN'
  );

-- Any authenticated user can update rows where used_by is null (consume): set used_by = auth.uid(), used_at = now()
create policy "invite_codes_consume"
  on public.invite_codes for update to authenticated
  using (used_by is null)
  with check (used_by = auth.uid() and used_at is not null);
