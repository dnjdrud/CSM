-- ============================================================
-- CANDLE SYSTEM: 가상화폐 "캔들" 구독 시스템
-- 100원 = 1 캔들. 플랫폼에서 캔들 팩을 구매하고,
-- 캔들을 사용하여 크리에이터를 구독함.
-- ============================================================

-- 1. Heewon Lee admin 권한 부여
UPDATE public.users SET role = 'ADMIN' WHERE name = 'Heewon Lee';

-- 2. users 테이블에 캔들 잔액 및 구독 가격 추가
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS candle_balance   integer NOT NULL DEFAULT 0 CHECK (candle_balance >= 0),
  ADD COLUMN IF NOT EXISTS subscription_candles_per_month integer
    CHECK (subscription_candles_per_month IS NULL OR subscription_candles_per_month >= 5);

-- 3. 캔들 팩 구매 테이블 (Stripe Checkout 연동)
CREATE TABLE IF NOT EXISTS public.candle_purchases (
  id                  uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id             uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  candles             integer     NOT NULL CHECK (candles > 0),
  price_krw           integer     NOT NULL CHECK (price_krw > 0),
  stripe_session_id   text        UNIQUE,
  status              text        NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'completed', 'failed')),
  created_at          timestamptz NOT NULL DEFAULT now(),
  completed_at        timestamptz
);

CREATE INDEX IF NOT EXISTS candle_purchases_user_idx
  ON public.candle_purchases (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS candle_purchases_session_idx
  ON public.candle_purchases (stripe_session_id)
  WHERE stripe_session_id IS NOT NULL;

ALTER TABLE public.candle_purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "candle_purchases_own_select" ON public.candle_purchases;
CREATE POLICY "candle_purchases_own_select" ON public.candle_purchases
  FOR SELECT USING (user_id = auth.uid());

-- 4. 캔들 거래 내역 테이블
CREATE TABLE IF NOT EXISTS public.candle_transactions (
  id              uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  delta           integer     NOT NULL,  -- 양수: 충전, 음수: 사용
  balance_after   integer     NOT NULL CHECK (balance_after >= 0),
  kind            text        NOT NULL
                  CHECK (kind IN ('purchase', 'subscribe', 'refund', 'admin')),
  ref_id          uuid,       -- candle_purchases.id 또는 subscriptions.id
  note            text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS candle_tx_user_idx
  ON public.candle_transactions (user_id, created_at DESC);

ALTER TABLE public.candle_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "candle_tx_own_select" ON public.candle_transactions;
CREATE POLICY "candle_tx_own_select" ON public.candle_transactions
  FOR SELECT USING (user_id = auth.uid());

-- 5. subscriptions 테이블에 캔들 구독 필드 추가
--    (Stripe Connect 필드는 남겨두되 새 시스템은 candle 필드 사용)
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS expires_at        timestamptz,
  ADD COLUMN IF NOT EXISTS candles_paid      integer CHECK (candles_paid IS NULL OR candles_paid > 0),
  ADD COLUMN IF NOT EXISTS renewed_at        timestamptz;

-- 만료 구독 빠른 조회를 위한 인덱스
CREATE INDEX IF NOT EXISTS subscriptions_expires_idx
  ON public.subscriptions (expires_at)
  WHERE expires_at IS NOT NULL AND status = 'active';
