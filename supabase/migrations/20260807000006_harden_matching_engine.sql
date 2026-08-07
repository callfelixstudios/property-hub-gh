-- 20260807000006_harden_matching_engine.sql
-- M3: Public SECURITY DEFINER matching functions = notification-spam/DoS + info leak
-- Grants were already revoked from anon/authenticated by 20260807000003; this
-- migration adds defense-in-depth:
--   1. Ownership check in the trigger function (skip matching unless the
--      inserting session owns the request).
--   2. Idempotency in match_request_to_agents (re-invoking an already-processed
--      request_id replays existing rows instead of re-inserting notifications).
--   3. Per-user rate limit (max 5 matching requests per rolling hour).

-- Trigger wrapper: only match when the request belongs to the calling session.
CREATE OR REPLACE FUNCTION public.handle_new_space_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NEW.user_id IS DISTINCT FROM auth.uid() THEN
    RETURN NEW;
  END IF;
  PERFORM public.match_request_to_agents(NEW.id);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.match_request_to_agents(p_request_id UUID)
RETURNS TABLE(
  agent_id UUID,
  match_score NUMERIC,
  matched_listing_ids UUID[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_already_matched BOOLEAN;
  v_rate_limited BOOLEAN;
BEGIN
  -- Idempotency: if this request has already produced match notifications,
  -- never re-insert them (prevents double-flood on retry / re-fire).
  SELECT EXISTS (
    SELECT 1
    FROM public.notifications n
    WHERE n.metadata ->> 'request_id' = p_request_id::TEXT
  ) INTO v_already_matched;

  -- Per-user rate limit: max 5 matching requests per rolling hour.
  -- Runs in the trigger session, so auth.uid() identifies the seeker.
  -- Internal callers (postgres / service_role, auth.uid() IS NULL) are exempt.
  v_rate_limited := FALSE;
  IF auth.uid() IS NOT NULL THEN
    SELECT COUNT(*) > 5
    INTO v_rate_limited
    FROM public.space_requests sr
    WHERE sr.user_id = auth.uid()
      AND sr.created_at > now() - interval '1 hour';
  END IF;

  IF NOT v_already_matched AND NOT v_rate_limited THEN
    -- Single set-based insert: CROSS JOIN request with all active agent listings,
    -- compute weighted score per (listing x request) pair, group by agent
    INSERT INTO public.notifications (user_id, type, title, body, metadata)
    SELECT
      scored.poster_id,
      'new_match',
      'New Matching Request',
      CASE
        WHEN MAX(scored.score) >= 70
          THEN 'Strong match found for a seeker request on the Notice Board. Review the details and reach out.'
        WHEN MAX(scored.score) >= 50
          THEN 'A seeker request partially matches your listings. Check the details to see if it is a fit.'
        ELSE 'A new seeker request may be relevant to your listings. Review and decide.'
      END,
      jsonb_build_object(
        'request_id', p_request_id,
        'score', MAX(scored.score),
        'matching_listing_ids', ARRAY_AGG(scored.listing_id ORDER BY scored.listing_id)
      )
    FROM (
      SELECT
        l.poster_id,
        l.id AS listing_id,
        COALESCE(
          CASE
            WHEN LOWER(l.region) = LOWER(sr.location) THEN 40
            WHEN LOWER(l.neighborhood) = LOWER(sr.location) THEN 20
            ELSE 0
          END, 0
        ) +
        COALESCE(
          CASE WHEN LOWER(l.category::text) = LOWER(sr.property_type) THEN 30 ELSE 0 END, 0
        ) +
        COALESCE(
          CASE
            WHEN sr.budget > 0 AND l.transaction_type = 'rent'
              AND l.base_rent > 0 AND l.base_rent <= sr.budget THEN 20
            WHEN sr.budget > 0 AND l.transaction_type = 'rent'
              AND l.base_rent > 0 AND l.base_rent <= sr.budget * 1.2 THEN 10
            WHEN sr.budget > 0 AND l.transaction_type = 'sale'
              AND l.outright_price > 0 AND l.outright_price <= sr.budget THEN 20
            WHEN sr.budget > 0 AND l.transaction_type = 'sale'
              AND l.outright_price > 0 AND l.outright_price <= sr.budget * 1.2 THEN 10
            ELSE 0
          END, 0
        ) +
        COALESCE(
          CASE WHEN LOWER(l.transaction_type::text) = LOWER(sr.purpose) THEN 10 ELSE 0 END, 0
        ) AS score
      FROM public.listings l
      CROSS JOIN public.space_requests sr
      WHERE sr.id = p_request_id
        AND l.status = 'active'
        AND l.poster_role = 'agent'
    ) scored
    WHERE scored.score >= 30
    GROUP BY scored.poster_id;
  END IF;

  RETURN QUERY
  SELECT
    n.user_id,
    (n.metadata ->> 'score')::NUMERIC,
    ARRAY(SELECT jsonb_array_elements_text(n.metadata -> 'matching_listing_ids'))::UUID[]
  FROM public.notifications n
  WHERE n.metadata ->> 'request_id' = p_request_id::TEXT
  ORDER BY (n.metadata ->> 'score')::NUMERIC DESC;
END;
$$;

-- Re-assert: neither function is callable by anon or authenticated.
REVOKE ALL ON FUNCTION public.match_request_to_agents(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_space_request() FROM PUBLIC, anon, authenticated;
