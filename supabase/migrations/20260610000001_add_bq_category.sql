-- 20260610000001_add_bq_category.sql
-- Add "Boys Quarters (BQ)" to the public.property_category ENUM.

ALTER TYPE public.property_category ADD VALUE IF NOT EXISTS 'Boys Quarters (BQ)' AFTER 'Chamber and Hall';
