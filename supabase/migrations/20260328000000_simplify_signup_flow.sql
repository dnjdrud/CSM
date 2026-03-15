-- Simplify signup flow: PENDING → COMPLETED directly (no APPROVED intermediate state).
-- Admin approval now immediately creates the auth user and sends a magic link login email.
-- Convert any lingering APPROVED records back to PENDING so admins re-approve them with the new flow.

UPDATE public.signup_requests
SET
  status = 'PENDING',
  reviewed_at = NULL,
  reviewed_by = NULL,
  review_note = NULL
WHERE status = 'APPROVED';
