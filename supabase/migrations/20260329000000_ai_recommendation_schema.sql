-- ============================================================
-- AI Content + Recommendation + Interaction Schema
-- Extends posts, adds clip_recommendations, user_interactions,
-- user_interest_tags. All changes are additive and idempotent.
-- ============================================================

-- 1. Extend posts with AI-generated fields ──────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='posts' AND column_name='youtube_id') THEN
    ALTER TABLE public.posts ADD COLUMN youtube_id text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='posts' AND column_name='ai_summary') THEN
    ALTER TABLE public.posts ADD COLUMN ai_summary text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='posts' AND column_name='ai_description') THEN
    ALTER TABLE public.posts ADD COLUMN ai_description text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='posts' AND column_name='ai_tags') THEN
    ALTER TABLE public.posts ADD COLUMN ai_tags text[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='posts' AND column_name='has_ai_generated') THEN
    ALTER TABLE public.posts ADD COLUMN has_ai_generated boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- Index for efficient lookup of AI-enriched posts
CREATE INDEX IF NOT EXISTS posts_has_ai_generated_idx
  ON public.posts (has_ai_generated)
  WHERE has_ai_generated = true;

CREATE INDEX IF NOT EXISTS posts_youtube_id_idx
  ON public.posts (youtube_id)
  WHERE youtube_id IS NOT NULL;

-- 2. Clip recommendations ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.post_clip_recommendations (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id          uuid        NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  start_time_seconds integer   NOT NULL CHECK (start_time_seconds >= 0),
  end_time_seconds   integer   NOT NULL CHECK (end_time_seconds > start_time_seconds),
  summary          text,
  sort_order       integer     NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS clip_recommendations_post_id_idx
  ON public.post_clip_recommendations (post_id, sort_order);

-- RLS: readable by all authenticated users, writable only by service role
ALTER TABLE public.post_clip_recommendations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clips_select" ON public.post_clip_recommendations;
CREATE POLICY "clips_select"
  ON public.post_clip_recommendations FOR SELECT
  TO authenticated
  USING (true);

-- 3. User interaction tracking ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_interactions (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id             uuid        NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  interaction_type    text        NOT NULL CHECK (interaction_type IN ('view','like','bookmark','subscribe')),
  watch_time_seconds  integer     CHECK (watch_time_seconds IS NULL OR watch_time_seconds >= 0),
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- One view row per user+post deduplicated by upsert; other types can repeat
CREATE INDEX IF NOT EXISTS user_interactions_user_post_idx
  ON public.user_interactions (user_id, post_id, interaction_type);

CREATE INDEX IF NOT EXISTS user_interactions_post_idx
  ON public.user_interactions (post_id, interaction_type);

ALTER TABLE public.user_interactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "interactions_own_select" ON public.user_interactions;
CREATE POLICY "interactions_own_select"
  ON public.user_interactions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "interactions_own_insert" ON public.user_interactions;
CREATE POLICY "interactions_own_insert"
  ON public.user_interactions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 4. User interest tags ─────────────────────────────────────
-- weight is a float in [0,∞); higher = stronger interest.
-- Updated via upsert; decays over time in application logic.
CREATE TABLE IF NOT EXISTS public.user_interest_tags (
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tag        text        NOT NULL,
  weight     numeric     NOT NULL DEFAULT 1.0 CHECK (weight >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, tag)
);

CREATE INDEX IF NOT EXISTS user_interest_tags_user_idx
  ON public.user_interest_tags (user_id, weight DESC);

ALTER TABLE public.user_interest_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "interest_tags_own" ON public.user_interest_tags;
CREATE POLICY "interest_tags_own"
  ON public.user_interest_tags FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
