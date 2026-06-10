-- 20260610000000_update_property_category.sql
-- Update property_category ENUM to use exact strings matching the tailored taxonomy.

-- 1. Temporarily change the column to TEXT to allow dropping the ENUM
ALTER TABLE public.listings ALTER COLUMN category TYPE text;

-- 2. Update existing rows to match the new format
UPDATE public.listings SET category = 'Apartment' WHERE category = 'apartment';
UPDATE public.listings SET category = 'House' WHERE category = 'house';
UPDATE public.listings SET category = 'Single Room Self-Contain' WHERE category = 'single_room';
UPDATE public.listings SET category = 'Plot of Land' WHERE category = 'land';
UPDATE public.listings SET category = 'Chamber and Hall' WHERE category = 'chamber_hall';

-- 3. Drop the old type
DROP TYPE public.property_category CASCADE;

-- 4. Recreate the type with the new values
CREATE TYPE public.property_category AS ENUM (
  'Apartment', 
  'House', 
  'Townhouse / Terrace', 
  'Single Room Self-Contain', 
  'Chamber and Hall', 
  'Studio Apartment', 
  'Penthouse', 
  'Villa / Mansion', 
  'Bungalow', 
  'Shared Apartment', 
  'Block of Flats', 
  'Farm House', 
  'Plot of Land', 
  'Commercial Property / Office'
);

-- 5. Cast the column back to the new ENUM
ALTER TABLE public.listings ALTER COLUMN category TYPE public.property_category USING category::public.property_category;
