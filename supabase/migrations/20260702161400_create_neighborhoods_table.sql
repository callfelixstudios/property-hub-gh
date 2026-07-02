-- Create neighborhoods table with region as plain text (no FK to config_regions)
-- Regions are hardcoded in the frontend as immutable constants.

CREATE TABLE IF NOT EXISTS public.neighborhoods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  region TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(region, name)
);

ALTER TABLE public.neighborhoods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read neighborhoods"
  ON public.neighborhoods FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage neighborhoods"
  ON public.neighborhoods FOR ALL TO authenticated
  USING (LOWER(split_part(auth.jwt() ->> 'email', '@', 2)) = 'propertyhubgh.com')
  WITH CHECK (LOWER(split_part(auth.jwt() ->> 'email', '@', 2)) = 'propertyhubgh.com');

CREATE INDEX IF NOT EXISTS idx_neighborhoods_region ON public.neighborhoods(region);

-- Seed from existing config_neighborhoods
INSERT INTO public.neighborhoods (region, name)
SELECT r.name AS region, n.name
FROM public.config_neighborhoods n
JOIN public.config_regions r ON n.region_id = r.id
ON CONFLICT (region, name) DO NOTHING;
