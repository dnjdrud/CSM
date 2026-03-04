-- Fix: record "new" has no field "updated_at" (Supabase or project trigger expects this column).
-- Add updated_at so INSERT/UPDATE on signup_requests and approval_tokens no longer fail.

alter table public.signup_requests
  add column if not exists updated_at timestamptz not null default now();

alter table public.approval_tokens
  add column if not exists updated_at timestamptz not null default now();
