-- 20260618000003_add_is_verified_to_listings.sql

ALTER TABLE public.listings 
ADD COLUMN is_verified boolean DEFAULT false;
