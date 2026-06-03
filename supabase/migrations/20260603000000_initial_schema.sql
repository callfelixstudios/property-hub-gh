-- 20260603000000_initial_schema.sql

CREATE TABLE public.profiles (
  id uuid references auth.users(id) on delete cascade not null primary key,
  name text,
  phone text,
  subscription_tier text default 'free',
  is_verified boolean default false
);

CREATE TYPE public.transaction_type AS ENUM ('RENT', 'SALE');
CREATE TYPE public.property_type AS ENUM ('single_room', 'chamber_hall', 'apartment', 'hostel', 'land', 'house');

CREATE TABLE public.listings (
  id uuid default gen_random_uuid() primary key,
  transaction_type public.transaction_type not null,
  property_type public.property_type not null,
  price numeric not null,
  currency text default 'GHS',
  advance_period text,
  region text,
  city text,
  neighborhood text,
  landmark text,
  images_array text[],
  status text default 'active',
  allows_escrow boolean default false,
  transaction_lock_status text default 'open',
  poster_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

-- Profiles Policies

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Admin policy for profiles
CREATE POLICY "Admin full access on profiles"
  ON public.profiles
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' LIKE '%@propertyhubgh.com');

-- Listings Policies

-- Anyone can view active listings
CREATE POLICY "Anyone can view active listings"
  ON public.listings
  FOR SELECT
  USING (status = 'active');

-- Users can update their own listings
CREATE POLICY "Users can update own listings"
  ON public.listings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = poster_id);

-- Free tier limitation on inserts
CREATE POLICY "Enforce listing limit for free tier"
  ON public.listings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = poster_id 
    AND (
      (SELECT subscription_tier FROM public.profiles WHERE id = auth.uid()) != 'free'
      OR
      (SELECT count(*) FROM public.listings WHERE poster_id = auth.uid()) < 2
    )
  );

-- Admin policy for listings
CREATE POLICY "Admin full access on listings"
  ON public.listings
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' LIKE '%@propertyhubgh.com');
