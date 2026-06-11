-- Add advance_period column for rental advance payment duration
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS advance_period TEXT;

-- Add image_url column for primary listing image (legacy support)
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS image_url TEXT;
