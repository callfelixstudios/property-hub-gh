ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS views_count integer DEFAULT 0 NOT NULL;

CREATE OR REPLACE FUNCTION increment_listing_views(row_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.listings
  SET views_count = views_count + 1
  WHERE id = row_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
