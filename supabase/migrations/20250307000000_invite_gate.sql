-- Invite gate: optional used_email for audit. Indexes already exist from prior migrations.

alter table public.invite_codes
  add column if not exists used_email text;

create index if not exists idx_invite_codes_revoked_at on public.invite_codes(revoked_at) where revoked_at is not null;
