-- 20260807000003_fix_matching_engine_enum_lower.sql
-- Pre-existing bug found during H3 verification: match_request_to_agents called
-- LOWER() on enum columns (property_category, transaction_type), which Postgres
-- cannot do. The AFTER INSERT trigger (on_space_request_created) therefore
-- failed on EVERY space_requests insert, rolling back the submission.
-- Fix: cast enums to text before LOWER().

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

REVOKE EXECUTE ON FUNCTION public.match_request_to_agents(uuid) FROM PUBLIC, anon;
-- authenticated callers need this? Only the internal trigger invokes it. The
-- app never calls this RPC directly; the trigger runs as the function owner.
REVOKE EXECUTE ON FUNCTION public.match_request_to_agents(uuid) FROM authenticated;
-- The trigger wrapper is trigger-only; not callable as a public RPC either.
REVOKE EXECUTE ON FUNCTION public.handle_new_space_request() FROM PUBLIC, anon, authenticated;