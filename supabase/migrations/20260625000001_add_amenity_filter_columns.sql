-- 20260625000001_add_amenity_filter_columns.sql
-- Add missing amenity columns referenced by the property filter query builders

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS has_generator BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_water_reservoir BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_independent_meter BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_walled_gated BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_litigation_free BOOLEAN DEFAULT false;
