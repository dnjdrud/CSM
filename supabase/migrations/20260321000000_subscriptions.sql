-- subscriptions: "까마귀(Crow)" — subscriber → creator 구독 관계.
-- User-to-user based for now; extensible to channel/plan/payment later.
--
-- Expansion hooks:
--   - plan text (free|supporter|premium) — 멤버십 등급
--   - expires_at timestamptz             — 유료 구독 만료
--   - stripe_subscription_id text        — Stripe 결제 연동
--   - channel_id uuid → channels table  — 채널 추상화 (현재는 creator_id = user_id로 대체)

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id            uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subscriber_id uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  creator_id    uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  -- 현재: 'active' only. 향후: 'paused' | 'cancelled' for payment lifecycle
  status        text        NOT NULL DEFAULT 'active'
                CHECK (status IN ('active', 'paused', 'cancelled')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  -- 자신을 구독하거나 중복 구독 방지
  CONSTRAINT subscriptions_no_self CHECK (subscriber_id <> creator_id),
  CONSTRAINT subscriptions_unique UNIQUE (subscriber_id, creator_id)
);

-- 구독자 기준 조회 (내가 구독한 크리에이터 목록)
CREATE INDEX IF NOT EXISTS subscriptions_subscriber_idx
  ON public.subscriptions (subscriber_id, status, created_at DESC);

-- 크리에이터 기준 조회 (나를 구독한 까마귀 목록 / 구독자 수)
CREATE INDEX IF NOT EXISTS subscriptions_creator_idx
  ON public.subscriptions (creator_id, status);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- 구독자: 자신의 구독 목록 조회
DROP POLICY IF EXISTS "subscriptions_subscriber_select" ON public.subscriptions;
CREATE POLICY "subscriptions_subscriber_select" ON public.subscriptions
  FOR SELECT USING (subscriber_id = auth.uid());

-- 크리에이터: 자신의 구독자 목록 조회
DROP POLICY IF EXISTS "subscriptions_creator_select" ON public.subscriptions;
CREATE POLICY "subscriptions_creator_select" ON public.subscriptions
  FOR SELECT USING (creator_id = auth.uid());

-- 구독 생성 (본인만)
DROP POLICY IF EXISTS "subscriptions_insert" ON public.subscriptions;
CREATE POLICY "subscriptions_insert" ON public.subscriptions
  FOR INSERT WITH CHECK (subscriber_id = auth.uid());

-- 구독 상태 변경 (본인만)
DROP POLICY IF EXISTS "subscriptions_update" ON public.subscriptions;
CREATE POLICY "subscriptions_update" ON public.subscriptions
  FOR UPDATE USING (subscriber_id = auth.uid());

-- 구독 삭제 (본인만)
DROP POLICY IF EXISTS "subscriptions_delete" ON public.subscriptions;
CREATE POLICY "subscriptions_delete" ON public.subscriptions
  FOR DELETE USING (subscriber_id = auth.uid());
