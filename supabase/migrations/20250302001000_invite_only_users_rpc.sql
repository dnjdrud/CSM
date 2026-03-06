-- (A) Invite-only onboarding: enforce profile creation only via valid invite code.
-- 1) Extend invite_codes with expires_at, max_uses, uses_count
-- 2) Add users.invite_code_id and backfill existing users
-- 3) Harden RLS: no direct INSERT on users; UPDATE cannot change invite_code_id
-- 4) SECURITY DEFINER RPC create_user_with_invite to consume code and create user

-- 1) invite_codes: add columns if missing
alter table public.invite_codes
  add column if not exists expires_at timestamptz,
  add column if not exists max_uses int not null default 1,
  add column if not exists uses_count int not null default 0;

-- 2a) users: add invite_code_id (nullable first for backfill)
alter table public.users
  add column if not exists invite_code_id uuid references public.invite_codes(id);

-- 2b) Allow role check to include all app roles (for RPC and existing inserts)
alter table public.users drop constraint if exists users_role_check;
alter table public.users add constraint users_role_check
  check (role in ('LAY', 'MINISTRY_WORKER', 'PASTOR', 'MISSIONARY', 'SEMINARIAN', 'ADMIN'));

-- 2c) Backfill existing users: one LEGACY invite code, then set invite_code_id
do $$
declare
  leg_id uuid;
  first_user_id uuid;
  user_count int;
begin
  select id into first_user_id from public.users order by created_at asc limit 1;
  if first_user_id is not null then
    select count(*) into user_count from public.users;
    insert into public.invite_codes (id, code, created_by, max_uses, uses_count)
    values (gen_random_uuid(), 'LEGACY', first_user_id, 999999, greatest(user_count, 0))
    returning id into leg_id;
    update public.users set invite_code_id = leg_id where invite_code_id is null;
  end if;
end $$;

-- 2d) Now require invite_code_id
alter table public.users alter column invite_code_id set not null;

-- 3) RLS: remove direct INSERT for authenticated clients
drop policy if exists "Users can insert own profile" on public.users;

-- 3b) UPDATE: own row only, and must not change invite_code_id
drop policy if exists "Users can update own profile" on public.users;
create policy "Users can update own profile"
  on public.users for update to authenticated
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and invite_code_id = (select u.invite_code_id from public.users u where u.id = auth.uid())
  );

-- 4) SECURITY DEFINER RPC: consume invite and create user (id = auth.uid())
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
  v_uses_count int;
  v_row public.users;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  -- Validate and consume invite in one step
  update public.invite_codes ic
  set
    uses_count = ic.uses_count + 1,
    used_by = case when ic.max_uses = 1 then v_uid else ic.used_by end,
    used_at = case when ic.max_uses = 1 then now() else ic.used_at end
  where ic.code = trim(p_invite_code)
    and (ic.expires_at is null or ic.expires_at > now())
    and ic.uses_count < ic.max_uses
  returning id, max_uses into v_invite_id, v_max_uses;

  if v_invite_id is null then
    raise exception 'That invite code is not valid.';
  end if;

  -- Insert user (id = auth.uid(), invite_code_id set)
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

grant execute on function public.create_user_with_invite(text, text, text, text, text) to authenticated;

comment on function public.create_user_with_invite is 'Creates a public.users row for the current auth.uid() using a valid invite code. Invite code is consumed atomically.';
