-- 20260610000002_add_property_attributes.sql
-- Add new property attributes and amenities array

ALTER TABLE public.listings 
  ADD COLUMN IF NOT EXISTS bedrooms INT,
  ADD COLUMN IF NOT EXISTS bathrooms INT,
  ADD COLUMN IF NOT EXISTS furnishing_status TEXT,
  ADD COLUMN IF NOT EXISTS land_size TEXT,
  ADD COLUMN IF NOT EXISTS square_meters NUMERIC,
  ADD COLUMN IF NOT EXISTS amenities TEXT[];
