-- 20260618000004_create_space_requests.sql

CREATE TABLE public.space_requests (
  id uuid default gen_random_uuid() primary key,
  seeker_name text not null,
  whatsapp_number text not null,
  location text not null,
  property_type text not null,
  budget numeric not null,
  purpose text not null,
  additional_details text,
  created_at timestamp with time zone default now()
);

-- Enable RLS
ALTER TABLE public.space_requests ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view space requests
CREATE POLICY "Anyone can view space requests"
  ON public.space_requests
  FOR SELECT
  USING (true);

-- Allow anyone to insert space requests (anon and authenticated)
CREATE POLICY "Anyone can insert space requests"
  ON public.space_requests
  FOR INSERT
  WITH CHECK (true);

-- Seed some sample data
INSERT INTO public.space_requests (seeker_name, whatsapp_number, location, property_type, budget, purpose, additional_details)
VALUES 
  ('Kwame Mensah', '+233541234567', 'East Legon or Spintex', 'apartment', 2000, 'Residential', 'Looking for a 2-bedroom apartment with consistent water flow and secure parking.'),
  ('Abena Osei', '+233209876543', 'Osu or Cantonments', 'single_room', 800, 'Residential', 'Needs to be close to the main road for easy commute.'),
  ('Tech Hub GH', '+233245558888', 'Dzorwulu', 'house', 5000, 'Commercial', 'We need a 4+ bedroom house that can be converted into office space for a startup. Reliable internet access is a must.');
