-- Phase 8-4: Invite-only Beta Ops. Add note, revoke fields; ADMIN-only RLS; RPC respects revoked_at.

alter table public.invite_codes
  add column if not exists note text,
  add column if not exists revoked_at timestamptz,
  add column if not exists revoked_by uuid references public.users(id) on delete set null;

create index if not exists idx_invite_codes_code on public.invite_codes(code);
create index if not exists idx_invite_codes_created_at on public.invite_codes(created_at desc);
create index if not exists idx_invite_codes_used_at on public.invite_codes(used_at desc nulls last);

-- RLS: ADMIN only for SELECT, INSERT, UPDATE (consume happens in SECURITY DEFINER RPC)
drop policy if exists "invite_codes_insert_admin" on public.invite_codes;
drop policy if exists "invite_codes_select_admin" on public.invite_codes;
drop policy if exists "invite_codes_consume" on public.invite_codes;

create policy "invite_codes_select_admin"
  on public.invite_codes for select to authenticated
  using ((select role from public.users where id = auth.uid()) = 'ADMIN');

create policy "invite_codes_insert_admin"
  on public.invite_codes for insert to authenticated
  with check (
    created_by = auth.uid()
    and (select role from public.users where id = auth.uid()) = 'ADMIN'
  );

create policy "invite_codes_update_admin"
  on public.invite_codes for update to authenticated
  using ((select role from public.users where id = auth.uid()) = 'ADMIN')
  with check (true);

-- Consume: authenticated user may update rows where used_by is null and revoked_at is null (set used_by, used_at, uses_count)
create policy "invite_codes_consume"
  on public.invite_codes for update to authenticated
  using (used_by is null and revoked_at is null)
  with check (used_by = auth.uid() and used_at is not null);

-- RPC: reject revoked invites
create or replace function public.create_user_with_invite(
  p_name text,
  p_role text,
  p_bio text,
  p_affiliation text,
  p_invite_code text
)
returns public.users
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_invite_id uuid;
  v_max_uses int;
  v_row public.users;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  update public.invite_codes ic
  set
    uses_count = ic.uses_count + 1,
    used_by = case when ic.max_uses = 1 then v_uid else ic.used_by end,
    used_at = case when ic.max_uses = 1 then now() else ic.used_at end
  where ic.code = trim(p_invite_code)
    and ic.revoked_at is null
    and (ic.expires_at is null or ic.expires_at > now())
    and ic.uses_count < ic.max_uses
  returning id, max_uses into v_invite_id, v_max_uses;

  if v_invite_id is null then
    raise exception 'That invite code is not valid.';
  end if;

  insert into public.users (id, name, role, bio, affiliation, invite_code_id)
  values (
    v_uid,
    nullif(trim(p_name), ''),
    case when trim(p_role) in ('LAY','MINISTRY_WORKER','PASTOR','MISSIONARY','SEMINARIAN','ADMIN')
         then trim(p_role) else 'LAY' end,
    nullif(trim(p_bio), ''),
    nullif(trim(p_affiliation), ''),
    v_invite_id
  )
  returning * into v_row;

  return v_row;
end;
$$;
