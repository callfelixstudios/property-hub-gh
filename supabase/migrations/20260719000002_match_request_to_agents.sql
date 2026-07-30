-- 20260719000002_match_request_to_agents.sql
-- Phase 4: Smart weighted matching engine (set-based, no loop)
-- Score categories: Region (max 40) + Category (max 30) + Budget (max 20) + Intent (max 10) = 100
-- Threshold: >= 30 points to insert notification
-- Rewrote from loop → set-based CTE for scalability (O(1) queries, not O(n) rows)

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
BEGIN
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
      -- Region (0-40)
      COALESCE(
        CASE
          WHEN LOWER(l.region) = LOWER(sr.location) THEN 40
          WHEN LOWER(l.neighborhood) = LOWER(sr.location) THEN 20
          ELSE 0
        END, 0
      ) +
      -- Category (0-30)
      COALESCE(
        CASE WHEN LOWER(l.category) = LOWER(sr.property_type) THEN 30 ELSE 0 END, 0
      ) +
      -- Budget (0-20)
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
      -- Intent (0-10)
      COALESCE(
        CASE WHEN LOWER(l.transaction_type) = LOWER(sr.purpose) THEN 10 ELSE 0 END, 0
      ) AS score
    FROM public.listings l
    CROSS JOIN public.space_requests sr
    WHERE sr.id = p_request_id
      AND l.status = 'active'
      AND l.poster_role = 'agent'
  ) scored
  WHERE scored.score >= 30
  GROUP BY scored.poster_id;

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
