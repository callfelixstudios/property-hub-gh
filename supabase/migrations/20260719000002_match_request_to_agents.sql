-- 20260719000002_match_request_to_agents.sql
-- Phase 4: Smart weighted matching engine with de-duplication
-- Score categories: Region (max 40) + Category (max 30) + Budget (max 20) + Intent (max 10) = 100
-- Threshold: >= 30 points to qualify as a match

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
  v_request RECORD;
  v_listing RECORD;
  v_score NUMERIC;
  v_region_score NUMERIC;
  v_category_score NUMERIC;
  v_budget_score NUMERIC;
  v_intent_score NUMERIC;
  v_threshold CONSTANT NUMERIC := 30;
BEGIN
  -- Fetch the space request
  SELECT * INTO v_request
  FROM public.space_requests
  WHERE id = p_request_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Temp table: one row per agent, tracks best score + all matching listing IDs
  CREATE TEMP TABLE temp_matches (
    agent_id UUID PRIMARY KEY,
    best_score NUMERIC DEFAULT 0,
    listing_ids UUID[] DEFAULT '{}'
  ) ON COMMIT DROP;

  -- Scan all active agent-posted listings
  FOR v_listing IN
    SELECT l.*
    FROM public.listings l
    WHERE l.status = 'active'
      AND l.poster_role = 'agent'
  LOOP
    v_score := 0;

    -- ════════════════════════════════════════════════════════════════
    -- 1. Region / Location match  (weight: 0.40 — max 40 pts)
    -- ════════════════════════════════════════════════════════════════
    v_region_score := 0;
    IF v_listing.region IS NOT NULL AND v_request.location IS NOT NULL THEN
      IF LOWER(v_listing.region) = LOWER(v_request.location) THEN
        v_region_score := 40;
      ELSIF v_listing.neighborhood IS NOT NULL
        AND LOWER(v_listing.neighborhood) = LOWER(v_request.location) THEN
        v_region_score := 20;
      END IF;
    END IF;
    v_score := v_score + v_region_score;

    -- ════════════════════════════════════════════════════════════════
    -- 2. Property type / Category match  (weight: 0.30 — max 30 pts)
    -- ════════════════════════════════════════════════════════════════
    v_category_score := 0;
    IF v_listing.category IS NOT NULL AND v_request.property_type IS NOT NULL THEN
      IF LOWER(v_listing.category) = LOWER(v_request.property_type) THEN
        v_category_score := 30;
      END IF;
    END IF;
    v_score := v_score + v_category_score;

    -- ════════════════════════════════════════════════════════════════
    -- 3. Budget overlap  (weight: 0.20 — max 20 pts)
    -- ════════════════════════════════════════════════════════════════
    v_budget_score := 0;
    IF v_request.budget IS NOT NULL AND v_request.budget > 0 THEN
      IF v_listing.transaction_type = 'rent' AND (v_listing.base_rent IS NOT NULL AND v_listing.base_rent > 0) THEN
        IF v_listing.base_rent <= v_request.budget THEN
          v_budget_score := 20;
        ELSIF v_listing.base_rent <= v_request.budget * 1.2 THEN
          v_budget_score := 10;
        END IF;
      ELSIF v_listing.transaction_type = 'sale' AND (v_listing.outright_price IS NOT NULL AND v_listing.outright_price > 0) THEN
        IF v_listing.outright_price <= v_request.budget THEN
          v_budget_score := 20;
        ELSIF v_listing.outright_price <= v_request.budget * 1.2 THEN
          v_budget_score := 10;
        END IF;
      END IF;
    END IF;
    v_score := v_score + v_budget_score;

    -- ════════════════════════════════════════════════════════════════
    -- 4. Intent alignment bonus  (weight: 0.10 — max 10 pts)
    --    Strict check: listing transaction_type must match request purpose
    -- ════════════════════════════════════════════════════════════════
    v_intent_score := 0;
    IF v_request.purpose IS NOT NULL AND v_listing.transaction_type IS NOT NULL THEN
      IF LOWER(v_listing.transaction_type) = LOWER(v_request.purpose) THEN
        v_intent_score := 10;
      END IF;
    END IF;
    v_score := v_score + v_intent_score;

    -- ── Threshold gate ─────────────────────────────────────────────
    IF v_score >= v_threshold THEN
      INSERT INTO temp_matches (agent_id, best_score, listing_ids)
      VALUES (v_listing.poster_id, v_score, ARRAY[v_listing.id])
      ON CONFLICT (agent_id) DO UPDATE SET
        best_score = CASE
          WHEN v_score > temp_matches.best_score THEN v_score
          ELSE temp_matches.best_score
        END,
        listing_ids = temp_matches.listing_ids || v_listing.id;
    END IF;
  END LOOP;

  -- Insert one notification per matched agent
  INSERT INTO public.notifications (user_id, type, title, body, metadata)
  SELECT
    m.agent_id,
    'new_match',
    'New Matching Request',
    CASE
      WHEN m.best_score >= 70
        THEN 'Strong match found for a seeker request on the Notice Board. Review the details and reach out.'
      WHEN m.best_score >= 50
        THEN 'A seeker request partially matches your listings. Check the details to see if it is a fit.'
      ELSE 'A new seeker request may be relevant to your listings. Review and decide.'
    END,
    jsonb_build_object(
      'request_id', p_request_id,
      'score', m.best_score,
      'matching_listing_ids', m.listing_ids
    )
  FROM temp_matches m;

  RETURN QUERY
  SELECT m.agent_id, m.best_score, m.listing_ids
  FROM temp_matches m
  ORDER BY m.best_score DESC;
END;
$$;
