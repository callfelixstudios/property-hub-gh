-- Add views column to listings
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS views integer default 0;
