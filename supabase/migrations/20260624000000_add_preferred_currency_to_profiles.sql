-- Add preferred_currency to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_currency text DEFAULT 'GHS';
