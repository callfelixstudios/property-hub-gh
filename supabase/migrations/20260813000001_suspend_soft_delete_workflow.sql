-- 20260813000001_suspend_soft_delete_workflow.sql
-- 1. Rewrite enforce_listing_moderation() so non-admin content edits of an
--    ACTIVE (live/approved) listing force it back to pending for re-review.
--    The trigger now also fires on UPDATE OF the editable content columns.
-- 2. Add an INSERT policy on notifications so platform admins can notify
--    listing owners about suspension / deletion / restore.

-- ── 1. Moderation guard: re-queue on content edits ─────────────────────────
CREATE OR REPLACE FUNCTION public.enforce_listing_moderation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  v_is_admin := public.is_platform_admin();

  IF TG_OP = 'INSERT' THEN
    IF NOT v_is_admin THEN
      NEW.moderation_status := 'pending';
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    -- Only platform admins may directly change the moderation status.
    IF NEW.moderation_status IS DISTINCT FROM OLD.moderation_status
       AND NOT v_is_admin THEN
      RAISE EXCEPTION 'Only platform admins can change listing moderation status';
    END IF;

    -- A non-admin editing the content of a live (active) listing must have
    -- the change reviewed again: send it back to the pending queue.
    -- Covers every editable column written by the edit listing modal.
    IF NOT v_is_admin
       AND OLD.status = 'active'
       AND (
         NEW.transaction_type IS DISTINCT FROM OLD.transaction_type OR
         NEW.title IS DISTINCT FROM OLD.title OR
         NEW.description IS DISTINCT FROM OLD.description OR
         NEW.category IS DISTINCT FROM OLD.category OR
         NEW.region IS DISTINCT FROM OLD.region OR
         NEW.neighborhood IS DISTINCT FROM OLD.neighborhood OR
         NEW.gps_address IS DISTINCT FROM OLD.gps_address OR
         NEW.base_rent IS DISTINCT FROM OLD.base_rent OR
         NEW.service_charge IS DISTINCT FROM OLD.service_charge OR
         NEW.outright_price IS DISTINCT FROM OLD.outright_price OR
         NEW.legal_status IS DISTINCT FROM OLD.legal_status OR
         NEW.advance_period IS DISTINCT FROM OLD.advance_period OR
         NEW.rent_advance_months IS DISTINCT FROM OLD.rent_advance_months OR
         NEW.currency IS DISTINCT FROM OLD.currency OR
         NEW.safemove_active IS DISTINCT FROM OLD.safemove_active OR
         NEW.media_urls IS DISTINCT FROM OLD.media_urls OR
         NEW.video_url IS DISTINCT FROM OLD.video_url OR
         NEW.bedrooms IS DISTINCT FROM OLD.bedrooms OR
         NEW.bathrooms IS DISTINCT FROM OLD.bathrooms OR
         NEW.furnishing_status IS DISTINCT FROM OLD.furnishing_status OR
         NEW.land_size IS DISTINCT FROM OLD.land_size OR
         NEW.land_use IS DISTINCT FROM OLD.land_use OR
         NEW.square_meters IS DISTINCT FROM OLD.square_meters OR
         NEW.parking_capacity IS DISTINCT FROM OLD.parking_capacity OR
         NEW.amenities IS DISTINCT FROM OLD.amenities OR
         NEW.poster_role IS DISTINCT FROM OLD.poster_role OR
         NEW.listing_category_type IS DISTINCT FROM OLD.listing_category_type OR
         NEW.condition IS DISTINCT FROM OLD.condition OR
         NEW.parking_space IS DISTINCT FROM OLD.parking_space
       ) THEN
      NEW.moderation_status := 'pending';
      NEW.status := 'pending';
      NEW.moderated_by := NULL;
      NEW.moderated_at := NULL;
      NEW.rejection_reason := NULL;
      NEW.moderation_note := NULL;
    END IF;

    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_listing_moderation_guard ON public.listings;

CREATE TRIGGER trg_listing_moderation_guard
  BEFORE INSERT OR UPDATE OF moderation_status,
    transaction_type, title, description, category, region, neighborhood,
    gps_address, base_rent, service_charge, outright_price, legal_status,
    advance_period, rent_advance_months, currency, safemove_active,
    media_urls, video_url, bedrooms, bathrooms, furnishing_status,
    land_size, land_use, square_meters, parking_capacity, amenities,
    poster_role, listing_category_type, condition, parking_space
  ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION enforce_listing_moderation();

-- ── 2. Notifications: allow admins to notify listing owners ─────────────────
CREATE POLICY "Platform admins can insert notifications"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_platform_admin());
