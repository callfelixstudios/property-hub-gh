-- 20260904000000_build_a_tier_truth.sql
-- Build A (backend half): subscription tier truth + soft-lock + credit ledger foundation.
-- All DDL below is idempotent (IF NOT EXISTS / CREATE OR REPLACE / DROP ... IF EXISTS).

-- ── 1. Provider CHECK: allow 'paystack' on payment_transactions.provider ─────
-- The inline CHECK from 20260702000001 got an auto-generated name
-- (payment_transactions_provider_check). Drop by name lookup, then re-add.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.payment_transactions'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%provider%IN%'
  LOOP
    EXECUTE format('ALTER TABLE public.payment_transactions DROP CONSTRAINT %I', r.conname);
  END LOOP;
END
$$;

ALTER TABLE public.payment_transactions
  DROP CONSTRAINT IF EXISTS payment_transactions_provider_check;

ALTER TABLE public.payment_transactions
  ADD CONSTRAINT payment_transactions_provider_check
  CHECK (provider IN ('momo', 'card', 'bank_transfer', 'manual', 'paystack'));

-- ── 2. Tier truth: rewrite check_free_tier_listing_limit() ───────────────────
-- Resolves the poster's tier from user_subscriptions (active, unexpired) joined
-- to subscription_plans.slug; defaults to 'free' when no row exists.
-- Caps: free 2 / pro 15 / developer 50, each with a distinct message.
-- NOTE: the blanket is_platform_admin() early-return is intentionally REMOVED.
-- Admin suspend/unsuspend/delete paths set status away from 'active' so they
-- are unaffected; approval/restore paths that flip a row TO active MUST count.
CREATE OR REPLACE FUNCTION public.check_free_tier_listing_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_tier text := 'free';
  v_cap integer := 2;
  v_active_count integer;
BEGIN
  SELECT sp.slug INTO v_tier
  FROM public.user_subscriptions us
  JOIN public.subscription_plans sp ON sp.id = us.plan_id
  WHERE us.user_id = NEW.poster_id
    AND us.status = 'active'
    AND (us.ends_at IS NULL OR us.ends_at > now())
  ORDER BY us.ends_at DESC NULLS FIRST
  LIMIT 1;

  v_tier := COALESCE(v_tier, 'free');

  IF v_tier = 'pro' THEN
    v_cap := 15;
  ELSIF v_tier = 'developer' THEN
    v_cap := 50;
  ELSE
    -- Unknown/legacy slugs fail closed to the free cap.
    v_tier := 'free';
    v_cap := 2;
  END IF;

  -- Count currently stored active rows for this poster.
  SELECT count(*) INTO v_active_count
  FROM public.listings
  WHERE poster_id = NEW.poster_id AND status = 'active';

  -- This row itself becomes active via INSERT('active') or UPDATE status -> 'active'.
  IF NEW.status = 'active'
     AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'active') THEN
    v_active_count := v_active_count + 1;
  END IF;

  IF v_active_count > v_cap THEN
    IF v_tier = 'pro' THEN
      RAISE EXCEPTION 'Pro tier users are limited to 15 active listings.';
    ELSIF v_tier = 'developer' THEN
      RAISE EXCEPTION 'Developer tier users are limited to 50 active listings.';
    ELSE
      RAISE EXCEPTION 'Free tier users are limited to 2 active listings.';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS enforce_free_tier_limit ON public.listings;

CREATE TRIGGER enforce_free_tier_limit
  BEFORE INSERT OR UPDATE OF status, moderation_status ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION public.check_free_tier_listing_limit();

-- Internal trigger-only guard: not callable as a public function.
REVOKE ALL ON FUNCTION public.check_free_tier_listing_limit() FROM PUBLIC, anon, authenticated;

-- ── 3. listings.tier_rank (search-ranking signal, no extra JOIN at read time) ─
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS tier_rank INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS listings_tier_rank_created_idx
  ON public.listings (tier_rank DESC, created_at DESC);

-- Backfill from each poster's effective rank (active sub join plan slug).
UPDATE public.listings l
SET tier_rank = COALESCE(sub.rank, 0)
FROM (
  SELECT DISTINCT ON (us.user_id)
    us.user_id,
    CASE sp.slug WHEN 'developer' THEN 2 WHEN 'pro' THEN 1 ELSE 0 END AS rank
  FROM public.user_subscriptions us
  JOIN public.subscription_plans sp ON sp.id = us.plan_id
  WHERE us.status = 'active'
    AND (us.ends_at IS NULL OR us.ends_at > now())
  ORDER BY us.user_id, us.ends_at DESC NULLS FIRST
) sub
WHERE sub.user_id = l.poster_id;

CREATE OR REPLACE FUNCTION public.set_tier_rank_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_slug text;
BEGIN
  SELECT sp.slug INTO v_slug
  FROM public.user_subscriptions us
  JOIN public.subscription_plans sp ON sp.id = us.plan_id
  WHERE us.user_id = NEW.poster_id
    AND us.status = 'active'
    AND (us.ends_at IS NULL OR us.ends_at > now())
  ORDER BY us.ends_at DESC NULLS FIRST
  LIMIT 1;

  NEW.tier_rank := CASE COALESCE(v_slug, 'free')
    WHEN 'developer' THEN 2
    WHEN 'pro' THEN 1
    ELSE 0
  END;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS set_tier_rank_on_insert ON public.listings;

CREATE TRIGGER set_tier_rank_on_insert
  BEFORE INSERT ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_tier_rank_on_insert();

-- Internal trigger-only guard: not callable as a public function.
REVOKE ALL ON FUNCTION public.set_tier_rank_on_insert() FROM PUBLIC, anon, authenticated;

-- ── 4. Credit ledger foundation ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.credit_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  delta int NOT NULL CHECK (delta <> 0),
  reason text NOT NULL CHECK (reason IN ('grant', 'purchase', 'spend_boost', 'expire', 'admin_adjust')),
  reference text,
  cycle_key text,
  created_at timestamptz DEFAULT now()
);

-- One monthly grant per user per cycle (partial unique index).
CREATE UNIQUE INDEX IF NOT EXISTS credit_ledger_grant_cycle_uidx
  ON public.credit_ledger (user_id, cycle_key)
  WHERE reason = 'grant';

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS credit_balance INT NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.sync_credit_balance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  UPDATE public.profiles
  SET credit_balance = credit_balance + NEW.delta
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS sync_credit_balance ON public.credit_ledger;

CREATE TRIGGER sync_credit_balance
  AFTER INSERT ON public.credit_ledger
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_credit_balance();

-- Internal trigger-only guard: not callable as a public function.
REVOKE ALL ON FUNCTION public.sync_credit_balance() FROM PUBLIC, anon, authenticated;

ALTER TABLE public.credit_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own credit ledger" ON public.credit_ledger;

CREATE POLICY "Users can read own credit ledger"
  ON public.credit_ledger FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- NOTE: deliberately NO insert/update/delete policies — writes happen only via
-- the SECURITY DEFINER functions below (service_role bypasses RLS anyway).

-- ── 5. grant_credits(): idempotent monthly-grant writer ──────────────────────
CREATE OR REPLACE FUNCTION public.grant_credits(
  p_user_id uuid,
  p_cycle_key text,
  p_amount int,
  p_reason text DEFAULT 'grant'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_caller_role text := auth.role();
  v_slug text;
BEGIN
  -- Caller guard: service_role (webhooks/admin) may act on anyone.
  -- Authenticated users may only grant to themselves, with tier-derived amounts;
  -- 'purchase' grants are webhook-only.
  IF v_caller_role IS DISTINCT FROM 'service_role' THEN
    IF p_user_id IS DISTINCT FROM auth.uid() THEN
      RAISE EXCEPTION 'Not authorized';
    END IF;
    IF p_reason <> 'grant' THEN
      RAISE EXCEPTION 'Not authorized';
    END IF;
    SELECT sp.slug INTO v_slug
    FROM public.user_subscriptions us
    JOIN public.subscription_plans sp ON sp.id = us.plan_id
    WHERE us.user_id = auth.uid()
      AND us.status = 'active'
      AND (us.ends_at IS NULL OR us.ends_at > now())
    ORDER BY us.ends_at DESC NULLS FIRST
    LIMIT 1;
    IF v_slug = 'developer' THEN
      p_amount := 3;
    ELSIF v_slug = 'pro' THEN
      p_amount := 1;
    ELSE
      RETURN;
    END IF;
    p_user_id := auth.uid();
  END IF;

  -- delta has a CHECK (delta <> 0): zero-amount calls are no-ops, not errors.
  IF p_amount IS NULL OR p_amount = 0 THEN
    RETURN;
  END IF;

  IF p_reason = 'grant' THEN
    -- Idempotency guard backed by the partial unique index above
    -- (IF NOT EXISTS check; duplicate monthly grants insert nothing).
    IF NOT EXISTS (
      SELECT 1 FROM public.credit_ledger
      WHERE user_id = p_user_id
        AND cycle_key = p_cycle_key
        AND reason = 'grant'
    ) THEN
      INSERT INTO public.credit_ledger (user_id, delta, reason, cycle_key)
      VALUES (p_user_id, p_amount, 'grant', p_cycle_key);
    END IF;
  ELSE
    INSERT INTO public.credit_ledger (user_id, delta, reason, cycle_key)
    VALUES (p_user_id, p_amount, p_reason, p_cycle_key);
  END IF;
END;
$function$;

REVOKE ALL ON FUNCTION public.grant_credits(uuid, text, integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.grant_credits(uuid, text, integer, text) TO authenticated;

-- ── 6. downgrade_expired_subscriber(): lazy tier-cache reconciler ────────────
-- Expires stale active rows, then demotes the profiles.membership_tier cache to
-- 'free' when no active subscription remains. Returns true iff a downgrade ran.
-- Runs as SECURITY DEFINER (owner postgres), so the privileged-column guard
-- trigger (section 9) exempts it via the current_user check.
CREATE OR REPLACE FUNCTION public.downgrade_expired_subscriber(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_has_active boolean;
BEGIN
  -- Caller guard: service_role may reconcile anyone; users only themselves.
  IF auth.role() IS DISTINCT FROM 'service_role'
     AND p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE public.user_subscriptions
  SET status = 'expired'
  WHERE user_id = p_user_id
    AND status = 'active'
    AND ends_at IS NOT NULL
    AND ends_at <= now();

  SELECT EXISTS (
    SELECT 1 FROM public.user_subscriptions
    WHERE user_id = p_user_id
      AND status = 'active'
      AND (ends_at IS NULL OR ends_at > now())
  ) INTO v_has_active;

  IF NOT v_has_active THEN
    UPDATE public.profiles
    SET membership_tier = 'free',
        is_verified_agent = false
    WHERE id = p_user_id
      AND membership_tier <> 'free';
    IF FOUND THEN
      RETURN true;
    END IF;
  END IF;

  RETURN false;
END;
$function$;

REVOKE ALL ON FUNCTION public.downgrade_expired_subscriber(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.downgrade_expired_subscriber(uuid) TO authenticated;

-- ── 7. ensure_monthly_grant(): monthly Boost/Pin credit drip ─────────────────
CREATE OR REPLACE FUNCTION public.ensure_monthly_grant(p_user_id uuid, p_cycle_key text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_slug text;
BEGIN
  -- Caller guard: service_role may grant for anyone; users only themselves.
  IF auth.role() IS DISTINCT FROM 'service_role'
     AND p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT sp.slug INTO v_slug
  FROM public.user_subscriptions us
  JOIN public.subscription_plans sp ON sp.id = us.plan_id
  WHERE us.user_id = p_user_id
    AND us.status = 'active'
    AND (us.ends_at IS NULL OR us.ends_at > now())
  ORDER BY us.ends_at DESC NULLS FIRST
  LIMIT 1;

  IF v_slug = 'pro' THEN
    PERFORM public.grant_credits(p_user_id, p_cycle_key, 1, 'grant');
  ELSIF v_slug = 'developer' THEN
    PERFORM public.grant_credits(p_user_id, p_cycle_key, 3, 'grant');
  END IF;
END;
$function$;

REVOKE ALL ON FUNCTION public.ensure_monthly_grant(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_monthly_grant(uuid, text) TO authenticated;

-- ── 8. Poster public read: least-privilege column exposure via owner view ────
-- avatar_url does not exist yet — add it so the view compiles.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url text;

DROP VIEW IF EXISTS public.poster_public;

CREATE VIEW public.poster_public AS
SELECT id, membership_tier, is_verified_agent, full_name, company_name, avatar_url
FROM public.profiles;

GRANT SELECT ON public.poster_public TO anon, authenticated;

-- ── 9. Harden own-profile UPDATE + privileged-column guard ───────────────────
-- The existing policy has USING but no WITH CHECK; recreate with both.
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = id AND public.is_active_user())
WITH CHECK (auth.uid() = id AND public.is_active_user());

CREATE OR REPLACE FUNCTION public.guard_profile_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF (NEW.membership_tier IS DISTINCT FROM OLD.membership_tier
      OR NEW.account_tier IS DISTINCT FROM OLD.account_tier
      OR NEW.is_verified_agent IS DISTINCT FROM OLD.is_verified_agent
      OR NEW.verification_status IS DISTINCT FROM OLD.verification_status)
     AND current_user NOT IN ('postgres', 'service_role')
     AND NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Privileged profile columns require admin';
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS guard_profile_privileged_columns ON public.profiles;

CREATE TRIGGER guard_profile_privileged_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_profile_privileged_columns();

-- Internal trigger-only guard: not callable as a public function.
REVOKE ALL ON FUNCTION public.guard_profile_privileged_columns() FROM PUBLIC, anon, authenticated;

-- ── 10. Seed reconcile: free-plan features copy ──────────────────────────────
UPDATE public.subscription_plans
SET features = '["2 active listings", "Standard search visibility", "Standard support"]'::jsonb
WHERE slug = 'free';
