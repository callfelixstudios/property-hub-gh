-- 20260712000000_add_resiliency_metrics.sql
-- Phase 2: Hyper-Localized Resiliency Metrics
-- Structured infrastructure booleans for Ghana-specific environmental needs

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS has_flood_resilience BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_solar_backup BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_borehole_system BOOLEAN DEFAULT false;
