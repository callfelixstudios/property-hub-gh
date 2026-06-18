-- 20260618000001_add_missing_enum_values.sql
-- Adds 'Townhouse' and 'Room & Parlor' to property_category ENUM

ALTER TYPE public.property_category ADD VALUE IF NOT EXISTS 'Townhouse';
ALTER TYPE public.property_category ADD VALUE IF NOT EXISTS 'Room & Parlor';
