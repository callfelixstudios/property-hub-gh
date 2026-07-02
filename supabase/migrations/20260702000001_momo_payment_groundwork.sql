-- 20260702000001_momo_payment_groundwork.sql
-- Schema groundwork for MoMo payment integration (no API integration yet)

-- 1. Subscription Plans — defines available tiers and pricing
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,             -- e.g. 'Free', 'Pro', 'Developer'
    slug TEXT NOT NULL UNIQUE,             -- e.g. 'free', 'pro', 'developer'
    price_ghs NUMERIC(10,2) NOT NULL DEFAULT 0,
    billing_cycle TEXT NOT NULL DEFAULT 'monthly'
      CHECK (billing_cycle IN ('monthly', 'quarterly', 'yearly', 'one_time')),
    features JSONB DEFAULT '[]'::jsonb,    -- Array of feature strings
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. User Subscriptions — links a user to a plan
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
    status TEXT NOT NULL DEFAULT 'active'
      CHECK (status IN ('active', 'cancelled', 'expired', 'past_due')),
    starts_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
    ends_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Payment Transactions — individual MoMo payment attempts
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.user_subscriptions(id),
    amount_ghs NUMERIC(10,2) NOT NULL,
    provider TEXT NOT NULL DEFAULT 'momo'
      CHECK (provider IN ('momo', 'card', 'bank_transfer', 'manual')),
    provider_reference TEXT,               -- External transaction ID from provider
    phone_number TEXT,                     -- MoMo phone number used
    status TEXT NOT NULL DEFAULT 'pending'
      CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    metadata JSONB DEFAULT '{}'::jsonb,    -- Provider-specific response data
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON public.payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON public.payment_transactions(status);

-- RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- Subscription plans: public read, admin write
CREATE POLICY "Anyone can view active plans"
  ON public.subscription_plans FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage plans"
  ON public.subscription_plans FOR ALL TO authenticated
  USING (LOWER(split_part(auth.jwt() ->> 'email', '@', 2)) = 'propertyhubgh.com')
  WITH CHECK (LOWER(split_part(auth.jwt() ->> 'email', '@', 2)) = 'propertyhubgh.com');

-- User subscriptions: user reads own, admin reads/writes all
CREATE POLICY "Users can view own subscriptions"
  ON public.user_subscriptions FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage subscriptions"
  ON public.user_subscriptions FOR ALL TO authenticated
  USING (LOWER(split_part(auth.jwt() ->> 'email', '@', 2)) = 'propertyhubgh.com')
  WITH CHECK (LOWER(split_part(auth.jwt() ->> 'email', '@', 2)) = 'propertyhubgh.com');

-- Payment transactions: user reads own, admin reads/writes all
CREATE POLICY "Users can view own transactions"
  ON public.payment_transactions FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage transactions"
  ON public.payment_transactions FOR ALL TO authenticated
  USING (LOWER(split_part(auth.jwt() ->> 'email', '@', 2)) = 'propertyhubgh.com')
  WITH CHECK (LOWER(split_part(auth.jwt() ->> 'email', '@', 2)) = 'propertyhubgh.com');

-- Seed default plans
INSERT INTO public.subscription_plans (name, slug, price_ghs, billing_cycle, features, sort_order) VALUES
  ('Free', 'free', 0, 'monthly', '["3 active listings", "Basic analytics", "Standard support"]'::jsonb, 1),
  ('Pro', 'pro', 99.99, 'monthly', '["Unlimited listings", "Priority moderation", "Advanced analytics", "Verified badge", "Featured placement"]'::jsonb, 2),
  ('Developer', 'developer', 299.99, 'monthly', '["Unlimited listings", "Bulk upload", "API access", "Dedicated support", "Custom branding", "Priority placement"]'::jsonb, 3)
ON CONFLICT (slug) DO NOTHING;
