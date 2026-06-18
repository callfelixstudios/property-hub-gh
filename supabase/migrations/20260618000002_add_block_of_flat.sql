-- 20260618000002_add_block_of_flat.sql
-- Adds 'Block of Flat' to property_category ENUM

ALTER TYPE public.property_category ADD VALUE IF NOT EXISTS 'Block of Flat';
