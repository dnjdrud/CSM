-- spiritual_notes: private personal journal entries (prayer notes + life notes).
-- Completely separate from public posts — zero feed exposure possible.
-- RLS: owner-only. No public visibility column needed; the table itself is private.

CREATE TABLE IF NOT EXISTS public.spiritual_notes (
  id          uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  -- 'prayer' = 기도제목, 'life' = 삶 기록/일기
  type        text        NOT NULL CHECK (type IN ('prayer', 'life')),
  title       text,
  content     text        NOT NULL,
  -- prayer-specific: mark when the prayer was answered
  is_answered boolean     NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Fast per-user, per-type queries sorted newest first
CREATE INDEX IF NOT EXISTS spiritual_notes_user_type_idx
  ON public.spiritual_notes (user_id, type, created_at DESC);

ALTER TABLE public.spiritual_notes ENABLE ROW LEVEL SECURITY;

-- Only the owner can read or modify their own notes
DROP POLICY IF EXISTS "spiritual_notes_owner_all" ON public.spiritual_notes;
CREATE POLICY "spiritual_notes_owner_all" ON public.spiritual_notes
  FOR ALL
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
