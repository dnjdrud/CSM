-- Approval-based signup: signup_requests, approval_tokens, users.username/church, APPROVAL invite code.

-- 1) signup_requests
create table if not exists public.signup_requests (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  name text,
  role text not null check (role in ('LAY', 'MINISTRY_WORKER', 'PASTOR', 'MISSIONARY', 'SEMINARIAN')),
  church text,
  bio text,
  affiliation text,
  status text not null check (status in ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED')) default 'PENDING',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.users(id) on delete set null,
  review_note text,
  constraint signup_requests_email_unique unique (email)
);

create index if not exists idx_signup_requests_status_created_at on public.signup_requests(status, created_at desc);

alter table public.signup_requests enable row level security;

-- Insert only via service role (Next.js server action). No anon/authenticated insert policy.

-- Only ADMIN can select/update signup_requests.
create policy "signup_requests_select_admin"
  on public.signup_requests for select
  using ((select role from public.users where id = auth.uid()) = 'ADMIN');

create policy "signup_requests_update_admin"
  on public.signup_requests for update
  using ((select role from public.users where id = auth.uid()) = 'ADMIN')
  with check (true);

-- 2) approval_tokens
create table if not exists public.approval_tokens (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.signup_requests(id) on delete cascade,
  token text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now(),
  constraint approval_tokens_token_unique unique (token)
);

create index if not exists idx_approval_tokens_token on public.approval_tokens(token);
create index if not exists idx_approval_tokens_expires_at on public.approval_tokens(expires_at);

alter table public.approval_tokens enable row level security;

-- Only ADMIN can manage approval_tokens (service role used for verify/consume from app server).
create policy "approval_tokens_select_admin"
  on public.approval_tokens for select
  using ((select role from public.users where id = auth.uid()) = 'ADMIN');

create policy "approval_tokens_insert_admin"
  on public.approval_tokens for insert
  with check ((select role from public.users where id = auth.uid()) = 'ADMIN');

create policy "approval_tokens_update_admin"
  on public.approval_tokens for update
  using ((select role from public.users where id = auth.uid()) = 'ADMIN')
  with check (true);

-- 3) users: add username (unique null), church (null)
alter table public.users
  add column if not exists username text,
  add column if not exists church text;

create unique index if not exists idx_users_username_lower on public.users(lower(username)) where username is not null;

-- 4) One APPROVAL invite code for users created via approval flow (service role inserts users with this invite_code_id)
do $$
declare
  admin_id uuid;
  approval_id uuid;
begin
  select id into admin_id from public.users where role = 'ADMIN' limit 1;
  if admin_id is not null then
    insert into public.invite_codes (id, code, created_by, max_uses, uses_count)
    values (gen_random_uuid(), 'APPROVAL', admin_id, 999999, 0)
    on conflict (code) do nothing
    returning id into approval_id;
  end if;
end $$;

-- Allow anon to read signup_requests only for their own email when submitting (we use server action with service role for create, so no anon read needed)
-- No anon SELECT on signup_requests; admin only.
