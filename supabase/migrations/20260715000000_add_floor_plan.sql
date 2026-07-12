-- 20260715000000_add_floor_plan.sql
-- Phase 3: Verified Immersive Media
-- Floor plan URL for structural layout transparency

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS floor_plan_url TEXT DEFAULT NULL;
