-- Invite, magic-link, and password-reset tokens (hash-only storage, expiry, one-time use).
-- 승인제 플로우: 관리자가 이메일로 초대 링크 발송 → auth_invites에 token_hash 저장 → 사용자가 링크로 가입 완료 시 consume.

-- 1) auth_invites: admin-invite link (e.g. /onboarding?token=...). One invite per email; re-invite revokes previous unused.
create table if not exists public.auth_invites (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  token_hash text not null,
  expires_at timestamptz not null,
  used_at timestamptz null,
  created_at timestamptz not null default now(),
  created_by uuid null references public.users(id) on delete set null
);

create index if not exists idx_auth_invites_email on public.auth_invites(email);
create index if not exists idx_auth_invites_token_hash on public.auth_invites(token_hash);
create index if not exists idx_auth_invites_expires_at on public.auth_invites(expires_at);

alter table public.auth_invites enable row level security;

-- Only service role / server-side admin flows insert/update/select (no anon policies here; use getSupabaseAdmin() in app).

-- 2) auth_magic_links: login without password (one-time link).
create table if not exists public.auth_magic_links (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  token_hash text not null,
  expires_at timestamptz not null,
  used_at timestamptz null,
  created_at timestamptz not null default now()
);

create index if not exists idx_auth_magic_links_email on public.auth_magic_links(email);
create index if not exists idx_auth_magic_links_token_hash on public.auth_magic_links(token_hash);
create index if not exists idx_auth_magic_links_expires_at on public.auth_magic_links(expires_at);

alter table public.auth_magic_links enable row level security;

-- 3) auth_password_resets: reset password link.
create table if not exists public.auth_password_resets (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  token_hash text not null,
  expires_at timestamptz not null,
  used_at timestamptz null,
  created_at timestamptz not null default now()
);

create index if not exists idx_auth_password_resets_email on public.auth_password_resets(email);
create index if not exists idx_auth_password_resets_token_hash on public.auth_password_resets(token_hash);
create index if not exists idx_auth_password_resets_expires_at on public.auth_password_resets(expires_at);

alter table public.auth_password_resets enable row level security;
