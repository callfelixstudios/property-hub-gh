-- 20260604_initial_schema.sql
-- Refined schema capturing all data points from the Property Submission Wizard

-- Drop existing tables and types if they exist to prevent conflicts on initialization
DROP TABLE IF EXISTS public.listings CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TYPE IF EXISTS public.transaction_type CASCADE;
DROP TYPE IF EXISTS public.property_category CASCADE;

-- 1. Core Schemas
CREATE TABLE public.profiles (
  id uuid references auth.users(id) on delete cascade not null primary key,
  full_name text,
  company_name text,
  account_tier text default 'free',
  is_verified_agent boolean default false,
  created_at timestamp with time zone default now()
);

CREATE TYPE public.transaction_type AS ENUM ('rent', 'sale');
CREATE TYPE public.property_category AS ENUM ('apartment', 'house', 'single_room', 'land');

CREATE TABLE public.listings (
  id uuid default gen_random_uuid() primary key,
  poster_id uuid references public.profiles(id) on delete cascade not null,
  
  -- Step 1: Essentials
  transaction_type public.transaction_type not null,
  category public.property_category not null,
  region text,
  neighborhood text,
  gps_address text,
  
  -- Step 2: Pricing Transparency
  base_rent numeric,
  service_charge numeric,
  outright_price numeric,
  legal_status text, -- e.g., 'titled', 'indenture', 'unregistered'
  
  -- Step 3: Utilities & Escrow
  generator_backup boolean default false,
  solar_ready boolean default false,
  safemove_active boolean default false,
  
  -- Media
  media_urls text[],
  
  -- Metadata
  status text default 'active',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

-- 2. Free-Tier Guardrail (Trigger Function)
CREATE OR REPLACE FUNCTION public.check_free_tier_listing_limit()
RETURNS TRIGGER AS $$
DECLARE
  v_account_tier text;
  v_active_count integer;
BEGIN
  -- Get account_tier for the listing's poster
  SELECT account_tier INTO v_account_tier FROM public.profiles WHERE id = NEW.poster_id;
  
  -- Enforce limit if tier is 'free'
  IF v_account_tier = 'free' THEN
    SELECT count(*) INTO v_active_count 
    FROM public.listings 
    WHERE poster_id = NEW.poster_id AND status = 'active';
    
    IF v_active_count >= 2 THEN
      RAISE EXCEPTION 'Free tier users cannot have 2 or more active listings.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER enforce_free_tier_limit
BEFORE INSERT ON public.listings
FOR EACH ROW
EXECUTE FUNCTION public.check_free_tier_listing_limit();

-- 3. RLS Policies & Admin Gate

-- Profiles Policies
CREATE POLICY "Users can view their own profile" 
  ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Admins can manage all profiles" 
  ON public.profiles FOR ALL TO authenticated 
  USING (auth.jwt() ->> 'email' LIKE '%@propertyhubgh.com');

-- Listings Policies
CREATE POLICY "Anyone can view active listings" 
  ON public.listings FOR SELECT USING (status = 'active');

CREATE POLICY "Users can insert their own listings" 
  ON public.listings FOR INSERT TO authenticated WITH CHECK (auth.uid() = poster_id);

CREATE POLICY "Users can update their own listings" 
  ON public.listings FOR UPDATE TO authenticated USING (auth.uid() = poster_id);

CREATE POLICY "Admins can manage all listings" 
  ON public.listings FOR ALL TO authenticated 
  USING (auth.jwt() ->> 'email' LIKE '%@propertyhubgh.com');
