-- Phase 6-1: Fully-approved signup flow.
-- Tables signup_requests and approval_tokens already exist (see 20250308000000_signup_approval.sql).
-- This migration ensures compatibility: no schema change; requested_at is represented by created_at.

-- Optional: add requested_at as alias for created_at if you want explicit column name in UI.
-- ALTER TABLE public.signup_requests ADD COLUMN IF NOT EXISTS requested_at timestamptz GENERATED ALWAYS AS (created_at) STORED;
-- Skipped: use created_at as "requested at" in admin table.
