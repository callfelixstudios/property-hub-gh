-- 20260903000000_align_subscription_plan_seed.sql
-- Align subscription plan features JSON with the subscription matrix.
-- Does not touch prices, billing cycles, or triggers.

UPDATE public.subscription_plans
SET features = '["2 active listings", "Standard search visibility", "Standard support"]'::jsonb
WHERE slug = 'free';

UPDATE public.subscription_plans
SET features = '["15 active listings", "Verified Agent badge", "Priority moderation", "Per-listing analytics", "Matching leads", "1 Boost credit per month", "Priority email support"]'::jsonb
WHERE slug = 'pro';

UPDATE public.subscription_plans
SET features = '["50 active listings", "Verified Developer badge", "Company branding", "Featured placement", "Instant priority moderation", "Portfolio dashboard", "Leads + bulk export", "3 Boost credits per month", "Dedicated WhatsApp support"]'::jsonb
WHERE slug = 'developer';