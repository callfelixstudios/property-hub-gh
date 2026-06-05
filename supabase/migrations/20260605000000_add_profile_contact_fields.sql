-- Add contact fields to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS contact_phone text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS whatsapp_link text;
