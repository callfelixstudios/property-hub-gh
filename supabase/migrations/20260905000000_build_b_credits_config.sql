-- 20260905000000_build_b_credits_config.sql
-- Build B: boost credits + dynamic config (credit spend RPC, cron maintenance,
-- plan-driven caps/archive windows, platform_config, RLS consolidation).
-- All DDL below is idempotent (IF NOT EXISTS / CREATE OR REPLACE / DROP ... IF EXISTS).

-- ── 1. subscription_plans: listing cap + archive window knobs ───────────────
ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS active_listing_cap INT NOT NULL DEFAULT 2;

ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS archive_after_days INT NOT NULL DEFAULT 30;

-- Backfill by slug; reruns are no-ops (columns already carry the values).
UPDATE public.subscription_plans
SET active_listing_cap = CASE slug WHEN 'pro' THEN 15 WHEN 'developer' THEN 50 ELSE active_listing_cap END,
    archive_after_days = CASE slug WHEN 'pro' THEN 60 WHEN 'developer' THEN 90 ELSE archive_after_days END;

-- ── 2. platform_config: single source of truth for credit pricing ───────────
CREATE TABLE IF NOT EXISTS public.platform_config (
  key text PRIMARY KEY,
  value numeric NOT NULL,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id)
);

INSERT INTO public.platform_config (key, value) VALUES
  ('credit_price_ghs', 20),
  ('credit_min_qty', 1),
  ('credit_max_qty', 10),
  ('boost_duration_days', 7)
ON CONFLICT (key) DO NOTHING;

GRANT SELECT ON public.platform_config TO anon, authenticated;

ALTER TABLE public.platform_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read platform config" ON public.platform_config;

CREATE POLICY "Anyone can read platform config"
  ON public.platform_config FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Platform admins can manage platform config" ON public.platform_config;

CREATE POLICY "Platform admins can manage platform config"
  ON public.platform_config FOR ALL TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

-- ── 3. check_free_tier_listing_limit(): plan-driven cap ─────────────────────
CREATE OR REPLACE FUNCTION public.check_free_tier_listing_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_tier text := 'free';
  v_cap integer;
  v_fallback integer := 2;
  v_active_count integer;
BEGIN
  SELECT sp.slug, sp.active_listing_cap INTO v_tier, v_cap
  FROM public.user_subscriptions us
  JOIN public.subscription_plans sp ON sp.id = us.plan_id
  WHERE us.user_id = NEW.poster_id
    AND us.status = 'active'
    AND (us.ends_at IS NULL OR us.ends_at > now())
  ORDER BY us.ends_at DESC NULLS FIRST
  LIMIT 1;

  v_tier := COALESCE(v_tier, 'free');

  IF v_tier = 'pro' THEN
    v_fallback := 15;
  ELSIF v_tier = 'developer' THEN
    v_fallback := 50;
  ELSE
    -- Unknown/legacy slugs fail closed to the free cap.
    v_tier := 'free';
    v_fallback := 2;
  END IF;

  v_cap := COALESCE(NULLIF(v_cap, 0), v_fallback);
  IF v_cap IS NULL OR v_cap <= 0 THEN
    v_cap := v_fallback;
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

  -- Cap checks fire ONLY on becoming-active transitions: archive/soft-delete and
  -- moderation-only updates on over-cap posters pass (non-retroactive cap lowering).
  IF v_active_count > v_cap
     AND NEW.status = 'active'
     AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'active') THEN
    IF v_tier = 'pro' THEN
      RAISE EXCEPTION 'Pro tier users are limited to % active listings.', v_cap;
    ELSIF v_tier = 'developer' THEN
      RAISE EXCEPTION 'Developer tier users are limited to % active listings.', v_cap;
    ELSE
      RAISE EXCEPTION 'Free tier users are limited to % active listings.', v_cap;
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

-- ── 4. listings.boosted_until + privileged-column guard ─────────────────────
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS boosted_until timestamptz;

CREATE OR REPLACE FUNCTION public.guard_boosted_until()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF NEW.boosted_until IS DISTINCT FROM OLD.boosted_until
     AND current_user NOT IN ('postgres', 'service_role')
     AND NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Privileged listing columns require admin';
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS guard_boosted_until ON public.listings;

CREATE TRIGGER guard_boosted_until
  BEFORE UPDATE ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_boosted_until();

-- Internal trigger-only guard: not callable as a public function.
REVOKE ALL ON FUNCTION public.guard_boosted_until() FROM PUBLIC, anon, authenticated;

-- ── 5. spend_credits(): debit-ledger boost purchase ─────────────────────────
CREATE OR REPLACE FUNCTION public.spend_credits(p_user_id uuid, p_listing_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_duration integer := 7;
  v_balance integer;
  v_poster_id uuid;
  v_status text;
  v_moderation_status text;
BEGIN
  -- Caller guard: service_role (webhook/admin) may act on anyone; users only themselves.
  IF auth.role() IS DISTINCT FROM 'service_role'
     AND p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT value::integer INTO v_duration
  FROM public.platform_config
  WHERE key = 'boost_duration_days';
  IF v_duration IS NULL OR v_duration < 1 THEN
    v_duration := 7;
  END IF;

  SELECT poster_id, status, moderation_status
  INTO v_poster_id, v_status, v_moderation_status
  FROM public.listings
  WHERE id = p_listing_id;

  IF v_poster_id IS NULL
     OR v_poster_id IS DISTINCT FROM p_user_id
     OR v_status IS DISTINCT FROM 'active'
     OR v_moderation_status IS DISTINCT FROM 'approved' THEN
    RAISE EXCEPTION 'Listing not boostable';
  END IF;

  -- Atomic: lock the balance row so concurrent spends cannot double-debit.
  SELECT credit_balance INTO v_balance
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF v_balance IS NULL OR v_balance < 1 THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;

  -- sync_credit_balance trigger applies the -1 to profiles.credit_balance.
  INSERT INTO public.credit_ledger (user_id, delta, reason, reference)
  VALUES (p_user_id, -1, 'spend_boost', p_listing_id::text);

  -- Stacks: boosting an already-boosted listing extends from its current expiry.
  UPDATE public.listings
  SET boosted_until = GREATEST(COALESCE(boosted_until, now()), now())
                     + make_interval(days => v_duration)
  WHERE id = p_listing_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.spend_credits(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.spend_credits(uuid, uuid) TO authenticated;

-- ── 6. cron_maintenance(): nightly sweep, service_role-only ─────────────────
CREATE OR REPLACE FUNCTION public.cron_maintenance()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_archived integer := 0;
  v_boosts_cleared integer := 0;
  v_downgraded integer := 0;
  v_granted integer := 0;
  v_rows integer;
  v_user_id uuid;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- a) Tier-aware archive: window = poster's best active plan's archive_after_days
  --    (NULL-or-zero knob falls back to 30); posters with no active sub default 30.
  UPDATE public.listings l
  SET listing_health = 'archived', status = 'archived'
  FROM (
    SELECT DISTINCT ON (us.user_id)
      us.user_id,
      COALESCE(NULLIF(sp.archive_after_days, 0), 30) AS days
    FROM public.user_subscriptions us
    JOIN public.subscription_plans sp ON sp.id = us.plan_id
    WHERE us.status = 'active'
      AND (us.ends_at IS NULL OR us.ends_at > now())
    ORDER BY us.user_id, us.ends_at DESC NULLS FIRST
  ) plan
  WHERE l.poster_id = plan.user_id
    AND l.status = 'active'
    AND l.moderation_status = 'approved'
    AND now() - l.created_at > make_interval(days => plan.days)
    AND (l.last_verified_at IS NULL OR now() - l.last_verified_at > make_interval(days => plan.days));

  GET DIAGNOSTICS v_archived = ROW_COUNT;

  UPDATE public.listings l
  SET listing_health = 'archived', status = 'archived'
  WHERE l.status = 'active'
    AND l.moderation_status = 'approved'
    AND NOT EXISTS (
      SELECT 1 FROM public.user_subscriptions us
      WHERE us.user_id = l.poster_id
        AND us.status = 'active'
        AND (us.ends_at IS NULL OR us.ends_at > now())
    )
    AND now() - l.created_at > make_interval(days => 30)
    AND (l.last_verified_at IS NULL OR now() - l.last_verified_at > make_interval(days => 30));

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  v_archived := v_archived + v_rows;

  -- b) Clear expired boosts; guard_boosted_until exempts the definer (postgres).
  UPDATE public.listings
  SET boosted_until = NULL
  WHERE boosted_until IS NOT NULL AND boosted_until <= now();

  GET DIAGNOSTICS v_boosts_cleared = ROW_COUNT;

  -- c) Downgrade sweep: expire stale active subs and demote when nothing remains.
  FOR v_user_id IN
    SELECT DISTINCT user_id
    FROM public.user_subscriptions
    WHERE status = 'active'
      AND ends_at IS NOT NULL
      AND ends_at <= now()
  LOOP
    IF public.downgrade_expired_subscriber(v_user_id) IS TRUE THEN
      v_downgraded := v_downgraded + 1;
    END IF;
  END LOOP;

  -- d) Monthly grant sweep: one grant per pro/developer user per cycle.
  FOR v_user_id IN
    SELECT DISTINCT us.user_id
    FROM public.user_subscriptions us
    JOIN public.subscription_plans sp ON sp.id = us.plan_id
    WHERE us.status = 'active'
      AND (us.ends_at IS NULL OR us.ends_at > now())
      AND sp.slug IN ('pro', 'developer')
  LOOP
    PERFORM public.ensure_monthly_grant(v_user_id, to_char(now(), 'YYYY-MM'));
    v_granted := v_granted + 1;
  END LOOP;

  RETURN json_build_object(
    'archived', v_archived,
    'boosts_cleared', v_boosts_cleared,
    'downgraded', v_downgraded,
    'granted', v_granted
  );
END;
$function$;

-- service_role-only: no runtime role may invoke this directly.
REVOKE ALL ON FUNCTION public.cron_maintenance() FROM PUBLIC, anon, authenticated;

-- ── 7. fn_update_stale_listings(): tier-aware admin manual sweep ────────────
CREATE OR REPLACE FUNCTION public.fn_update_stale_listings()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_updated_count integer;
  v_rows integer;
BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Unauthorized: admin access only';
  END IF;

  -- Same per-plan archive_after_days window as the cron archive; no-sub defaults 30.
  UPDATE public.listings l
  SET listing_health = 'stale'
  FROM (
    SELECT DISTINCT ON (us.user_id)
      us.user_id,
      COALESCE(NULLIF(sp.archive_after_days, 0), 30) AS days
    FROM public.user_subscriptions us
    JOIN public.subscription_plans sp ON sp.id = us.plan_id
    WHERE us.status = 'active'
      AND (us.ends_at IS NULL OR us.ends_at > now())
    ORDER BY us.user_id, us.ends_at DESC NULLS FIRST
  ) plan
  WHERE l.poster_id = plan.user_id
    AND l.status = 'active'
    AND l.listing_health = 'fresh'
    AND l.moderation_status = 'approved'
    AND l.created_at < now() - make_interval(days => plan.days)
    AND (l.last_verified_at IS NULL OR l.last_verified_at < now() - make_interval(days => plan.days));

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;

  UPDATE public.listings l
  SET listing_health = 'stale'
  WHERE l.status = 'active'
    AND l.listing_health = 'fresh'
    AND l.moderation_status = 'approved'
    AND NOT EXISTS (
      SELECT 1 FROM public.user_subscriptions us
      WHERE us.user_id = l.poster_id
        AND us.status = 'active'
        AND (us.ends_at IS NULL OR us.ends_at > now())
    )
    AND l.created_at < now() - make_interval(days => 30)
    AND (l.last_verified_at IS NULL OR l.last_verified_at < now() - make_interval(days => 30));

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  v_updated_count := v_updated_count + v_rows;

  RETURN v_updated_count;
END;
$function$;

-- ── 8. RLS consolidation: last email-domain policy + public plan reads ───────
-- neighborhoods (20260702161400) was the only remaining table carrying a
-- dotted-email admin policy; replace it with the role-based helper.
DROP POLICY IF EXISTS "Admins can manage neighborhoods" ON public.neighborhoods;

DROP POLICY IF EXISTS "Platform admins can manage neighborhoods" ON public.neighborhoods;

CREATE POLICY "Platform admins can manage neighborhoods"
  ON public.neighborhoods FOR ALL TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

-- Public pricing page: plans readable by guests and signed-in users alike.
GRANT SELECT ON public.subscription_plans TO anon, authenticated;

DROP POLICY IF EXISTS "Anyone can view active plans" ON public.subscription_plans;

DROP POLICY IF EXISTS "Anyone can view active plans publicly" ON public.subscription_plans;

CREATE POLICY "Anyone can view active plans publicly"
  ON public.subscription_plans FOR SELECT TO anon, authenticated
  USING (is_active = true);