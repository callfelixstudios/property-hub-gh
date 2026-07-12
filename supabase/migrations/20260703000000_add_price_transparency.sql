-- 20260703000000_add_price_transparency.sql
-- Phase 1: Total Price Transparency
-- viewing_fee: NULL = undisclosed, 0 = free viewing, >0 = fee amount
-- agency_commission_percentage: NULL = undisclosed, >0 = commission %

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS viewing_fee NUMERIC DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS agency_commission_percentage NUMERIC DEFAULT NULL;
