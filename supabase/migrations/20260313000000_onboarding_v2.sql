-- Onboarding v2: denomination and faith_years fields
-- Adds new profile fields to users and signup_requests tables.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS denomination text,
  ADD COLUMN IF NOT EXISTS faith_years smallint;

ALTER TABLE public.signup_requests
  ADD COLUMN IF NOT EXISTS denomination text,
  ADD COLUMN IF NOT EXISTS faith_years smallint;
