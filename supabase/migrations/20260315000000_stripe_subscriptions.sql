-- Add Stripe fields to users table (creator info)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS stripe_account_id text,
  ADD COLUMN IF NOT EXISTS stripe_account_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_product_id text,
  ADD COLUMN IF NOT EXISTS stripe_price_id text,
  ADD COLUMN IF NOT EXISTS subscription_price_krw integer CHECK (subscription_price_krw IS NULL OR subscription_price_krw >= 500);

-- Add Stripe fields to subscriptions table
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS current_period_end timestamptz,
  ADD COLUMN IF NOT EXISTS plan text DEFAULT 'free' CHECK (plan IN ('free', 'supporter', 'premium'));

-- Add subscription-specific visibility to posts table
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS subscribers_only boolean DEFAULT false;

-- Index for fast subscription lookup
CREATE INDEX IF NOT EXISTS idx_subscriptions_subscriber_creator
  ON public.subscriptions(subscriber_id, creator_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_sub_id
  ON public.subscriptions(stripe_subscription_id);
