-- 20260610000003_add_commercial_land_attributes.sql
-- Add new property attributes for commercial and land properties

ALTER TABLE public.listings 
  ADD COLUMN IF NOT EXISTS parking_capacity INT,
  ADD COLUMN IF NOT EXISTS land_use TEXT;
