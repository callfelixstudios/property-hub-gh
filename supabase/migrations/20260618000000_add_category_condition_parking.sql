-- 20260618000000_add_category_condition_parking.sql
-- Adds listing_category_type, condition, parking_space columns
-- and expands property_category ENUM with commercial types.

-- 1. Add listing_category_type column with CHECK constraint
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS listing_category_type TEXT DEFAULT 'residential';

ALTER TABLE public.listings
  ADD CONSTRAINT chk_listing_category_type
  CHECK (listing_category_type IN ('residential', 'commercial'));

-- 2. Add condition column with CHECK constraint
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS condition TEXT;

ALTER TABLE public.listings
  ADD CONSTRAINT chk_condition
  CHECK (condition IS NULL OR condition IN ('newly_built', 'fairly_used', 'old', 'uncompleted', 'under_construction'));

-- 3. Add parking_space column with CHECK constraint
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS parking_space TEXT;

ALTER TABLE public.listings
  ADD CONSTRAINT chk_parking_space
  CHECK (parking_space IS NULL OR parking_space IN ('in_house', 'street_side', 'no_parking'));

-- 4. Expand property_category ENUM with 8 commercial types
ALTER TYPE public.property_category ADD VALUE IF NOT EXISTS 'Business Center';
ALTER TYPE public.property_category ADD VALUE IF NOT EXISTS 'Hotel';
ALTER TYPE public.property_category ADD VALUE IF NOT EXISTS 'Open Space';
ALTER TYPE public.property_category ADD VALUE IF NOT EXISTS 'Shop';
ALTER TYPE public.property_category ADD VALUE IF NOT EXISTS 'Warehouse';
ALTER TYPE public.property_category ADD VALUE IF NOT EXISTS 'Hostel';
ALTER TYPE public.property_category ADD VALUE IF NOT EXISTS 'Office Space';
ALTER TYPE public.property_category ADD VALUE IF NOT EXISTS 'Farm';

-- 5. Backfill existing rows
UPDATE public.listings
  SET listing_category_type = 'commercial'
  WHERE category::text = 'Commercial Property / Office';

UPDATE public.listings
  SET listing_category_type = 'residential'
  WHERE listing_category_type IS NULL OR category::text != 'Commercial Property / Office';
