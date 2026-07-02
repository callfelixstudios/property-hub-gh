-- 20260702000002_config_hub_tables.sql
-- Dynamic configuration tables for regions, neighborhoods, and amenities.
-- Replaces hardcoded arrays in ghanaLocations.ts and propertyCategories.ts.

-- 1. Regions table
CREATE TABLE IF NOT EXISTS public.config_regions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Neighborhoods table
CREATE TABLE IF NOT EXISTS public.config_neighborhoods (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    region_id UUID NOT NULL REFERENCES public.config_regions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(region_id, slug)
);

-- 3. Amenities table
CREATE TABLE IF NOT EXISTS public.config_amenities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL DEFAULT 'residential'
      CHECK (category IN ('residential', 'commercial', 'land')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_config_neighborhoods_region_id ON public.config_neighborhoods(region_id);
CREATE INDEX IF NOT EXISTS idx_config_amenities_category ON public.config_amenities(category);

-- RLS
ALTER TABLE public.config_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.config_neighborhoods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.config_amenities ENABLE ROW LEVEL SECURITY;

-- Public can read active config items
CREATE POLICY "Anyone can read active regions"
  ON public.config_regions FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can read active neighborhoods"
  ON public.config_neighborhoods FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can read active amenities"
  ON public.config_amenities FOR SELECT USING (is_active = true);

-- Admins can manage all config items
CREATE POLICY "Admins can manage regions"
  ON public.config_regions FOR ALL TO authenticated
  USING (LOWER(split_part(auth.jwt() ->> 'email', '@', 2)) = 'propertyhubgh.com')
  WITH CHECK (LOWER(split_part(auth.jwt() ->> 'email', '@', 2)) = 'propertyhubgh.com');

CREATE POLICY "Admins can manage neighborhoods"
  ON public.config_neighborhoods FOR ALL TO authenticated
  USING (LOWER(split_part(auth.jwt() ->> 'email', '@', 2)) = 'propertyhubgh.com')
  WITH CHECK (LOWER(split_part(auth.jwt() ->> 'email', '@', 2)) = 'propertyhubgh.com');

CREATE POLICY "Admins can manage amenities"
  ON public.config_amenities FOR ALL TO authenticated
  USING (LOWER(split_part(auth.jwt() ->> 'email', '@', 2)) = 'propertyhubgh.com')
  WITH CHECK (LOWER(split_part(auth.jwt() ->> 'email', '@', 2)) = 'propertyhubgh.com');

-- 4. Seed current hardcoded regions
INSERT INTO public.config_regions (name, slug, sort_order) VALUES
  ('Greater Accra', 'greater_accra', 1),
  ('Ashanti', 'ashanti', 2),
  ('Central', 'central', 3),
  ('Eastern', 'eastern', 4),
  ('Northern', 'northern', 5),
  ('Western', 'western', 6),
  ('Volta', 'volta', 7),
  ('Bono', 'bono', 8),
  ('Bono East', 'bono_east', 9),
  ('Ahafo', 'ahafo', 10),
  ('Savannah', 'savannah', 11),
  ('North East', 'north_east', 12),
  ('Upper East', 'upper_east', 13),
  ('Upper West', 'upper_west', 14),
  ('Western North', 'western_north', 15),
  ('Oti', 'oti', 16)
ON CONFLICT (slug) DO NOTHING;

-- 5. Seed neighborhoods (using subqueries to resolve region_id)
INSERT INTO public.config_neighborhoods (region_id, name, slug, sort_order) VALUES
  -- Greater Accra
  ((SELECT id FROM public.config_regions WHERE slug = 'greater_accra'), 'East Legon', 'east_legon', 1),
  ((SELECT id FROM public.config_regions WHERE slug = 'greater_accra'), 'Cantonments', 'cantonments', 2),
  ((SELECT id FROM public.config_regions WHERE slug = 'greater_accra'), 'Airport Residential Area', 'airport_residential_area', 3),
  ((SELECT id FROM public.config_regions WHERE slug = 'greater_accra'), 'Labone', 'labone', 4),
  ((SELECT id FROM public.config_regions WHERE slug = 'greater_accra'), 'Spintex', 'spintex', 5),
  ((SELECT id FROM public.config_regions WHERE slug = 'greater_accra'), 'Madina', 'madina', 6),
  ((SELECT id FROM public.config_regions WHERE slug = 'greater_accra'), 'Osu', 'osu', 7),
  ((SELECT id FROM public.config_regions WHERE slug = 'greater_accra'), 'Dzorwulu', 'dzorwulu', 8),
  ((SELECT id FROM public.config_regions WHERE slug = 'greater_accra'), 'Tema', 'tema', 9),
  ((SELECT id FROM public.config_regions WHERE slug = 'greater_accra'), 'Dansoman', 'dansoman', 10),
  ((SELECT id FROM public.config_regions WHERE slug = 'greater_accra'), 'Achimota', 'achimota', 11),
  -- Ashanti
  ((SELECT id FROM public.config_regions WHERE slug = 'ashanti'), 'Kumasi', 'kumasi', 1),
  ((SELECT id FROM public.config_regions WHERE slug = 'ashanti'), 'Nhyiaeso', 'nhyiaeso', 2),
  ((SELECT id FROM public.config_regions WHERE slug = 'ashanti'), 'Ahodwo', 'ahodwo', 3),
  ((SELECT id FROM public.config_regions WHERE slug = 'ashanti'), 'Asokwa', 'asokwa', 4),
  ((SELECT id FROM public.config_regions WHERE slug = 'ashanti'), 'Bantama', 'bantama', 5),
  ((SELECT id FROM public.config_regions WHERE slug = 'ashanti'), 'Adum', 'adum', 6),
  ((SELECT id FROM public.config_regions WHERE slug = 'ashanti'), 'Tafo', 'tafo', 7),
  -- Central
  ((SELECT id FROM public.config_regions WHERE slug = 'central'), 'Cape Coast', 'cape_coast', 1),
  ((SELECT id FROM public.config_regions WHERE slug = 'central'), 'Kasoa', 'kasoa', 2),
  ((SELECT id FROM public.config_regions WHERE slug = 'central'), 'Winneba', 'winneba', 3),
  ((SELECT id FROM public.config_regions WHERE slug = 'central'), 'Elmina', 'elmina', 4),
  ((SELECT id FROM public.config_regions WHERE slug = 'central'), 'Saltpond', 'saltpond', 5),
  -- Eastern
  ((SELECT id FROM public.config_regions WHERE slug = 'eastern'), 'Koforidua', 'koforidua', 1),
  ((SELECT id FROM public.config_regions WHERE slug = 'eastern'), 'Aburi', 'aburi', 2),
  ((SELECT id FROM public.config_regions WHERE slug = 'eastern'), 'Nsawam', 'nsawam', 3),
  ((SELECT id FROM public.config_regions WHERE slug = 'eastern'), 'Nkawkaw', 'nkawkaw', 4),
  ((SELECT id FROM public.config_regions WHERE slug = 'eastern'), 'Akropong', 'akropong', 5),
  -- Northern
  ((SELECT id FROM public.config_regions WHERE slug = 'northern'), 'Tamale', 'tamale', 1),
  ((SELECT id FROM public.config_regions WHERE slug = 'northern'), 'Sagnarigu', 'sagnarigu', 2),
  ((SELECT id FROM public.config_regions WHERE slug = 'northern'), 'Yendi', 'yendi', 3),
  -- Western
  ((SELECT id FROM public.config_regions WHERE slug = 'western'), 'Takoradi', 'takoradi', 1),
  ((SELECT id FROM public.config_regions WHERE slug = 'western'), 'Sekondi', 'sekondi', 2),
  ((SELECT id FROM public.config_regions WHERE slug = 'western'), 'Tarkwa', 'tarkwa', 3),
  ((SELECT id FROM public.config_regions WHERE slug = 'western'), 'Axim', 'axim', 4),
  -- Volta
  ((SELECT id FROM public.config_regions WHERE slug = 'volta'), 'Ho', 'ho', 1),
  ((SELECT id FROM public.config_regions WHERE slug = 'volta'), 'Keta', 'keta', 2),
  ((SELECT id FROM public.config_regions WHERE slug = 'volta'), 'Aflao', 'aflao', 3),
  ((SELECT id FROM public.config_regions WHERE slug = 'volta'), 'Hohoe', 'hohoe', 4),
  ((SELECT id FROM public.config_regions WHERE slug = 'volta'), 'Sogakope', 'sogakope', 5),
  -- Bono
  ((SELECT id FROM public.config_regions WHERE slug = 'bono'), 'Sunyani', 'sunyani', 1),
  ((SELECT id FROM public.config_regions WHERE slug = 'bono'), 'Berekum', 'berekum', 2),
  ((SELECT id FROM public.config_regions WHERE slug = 'bono'), 'Dormaa Ahenkro', 'dormaa_ahenkro', 3),
  -- Bono East
  ((SELECT id FROM public.config_regions WHERE slug = 'bono_east'), 'Techiman', 'techiman', 1),
  ((SELECT id FROM public.config_regions WHERE slug = 'bono_east'), 'Kintampo', 'kintampo', 2),
  ((SELECT id FROM public.config_regions WHERE slug = 'bono_east'), 'Nkoranza', 'nkoranza', 3),
  -- Ahafo
  ((SELECT id FROM public.config_regions WHERE slug = 'ahafo'), 'Goaso', 'goaso', 1),
  ((SELECT id FROM public.config_regions WHERE slug = 'ahafo'), 'Bechem', 'bechem', 2),
  ((SELECT id FROM public.config_regions WHERE slug = 'ahafo'), 'Duayaw Nkwanta', 'duayaw_nkwanta', 3),
  -- Savannah
  ((SELECT id FROM public.config_regions WHERE slug = 'savannah'), 'Damongo', 'damongo', 1),
  ((SELECT id FROM public.config_regions WHERE slug = 'savannah'), 'Salaga', 'salaga', 2),
  ((SELECT id FROM public.config_regions WHERE slug = 'savannah'), 'Bole', 'bole', 3),
  -- North East
  ((SELECT id FROM public.config_regions WHERE slug = 'north_east'), 'Nalerigu', 'nalerigu', 1),
  ((SELECT id FROM public.config_regions WHERE slug = 'north_east'), 'Walewale', 'walewale', 2),
  ((SELECT id FROM public.config_regions WHERE slug = 'north_east'), 'Gambaga', 'gambaga', 3),
  -- Upper East
  ((SELECT id FROM public.config_regions WHERE slug = 'upper_east'), 'Bolgatanga', 'bolgatanga', 1),
  ((SELECT id FROM public.config_regions WHERE slug = 'upper_east'), 'Navrongo', 'navrongo', 2),
  ((SELECT id FROM public.config_regions WHERE slug = 'upper_east'), 'Bawku', 'bawku', 3),
  -- Upper West
  ((SELECT id FROM public.config_regions WHERE slug = 'upper_west'), 'Wa', 'wa', 1),
  ((SELECT id FROM public.config_regions WHERE slug = 'upper_west'), 'Tumu', 'tumu', 2),
  ((SELECT id FROM public.config_regions WHERE slug = 'upper_west'), 'Lawra', 'lawra', 3),
  -- Western North
  ((SELECT id FROM public.config_regions WHERE slug = 'western_north'), 'Sefwi Wiawso', 'sefwi_wiawso', 1),
  ((SELECT id FROM public.config_regions WHERE slug = 'western_north'), 'Bibiani', 'bibiani', 2),
  ((SELECT id FROM public.config_regions WHERE slug = 'western_north'), 'Enchi', 'enchi', 3),
  -- Oti
  ((SELECT id FROM public.config_regions WHERE slug = 'oti'), 'Dambai', 'dambai', 1),
  ((SELECT id FROM public.config_regions WHERE slug = 'oti'), 'Jasikan', 'jasikan', 2),
  ((SELECT id FROM public.config_regions WHERE slug = 'oti'), 'Kadjebi', 'kadjebi', 3)
ON CONFLICT (region_id, slug) DO NOTHING;

-- 6. Seed amenities
INSERT INTO public.config_amenities (name, slug, category, sort_order) VALUES
  -- Residential & Commercial amenities
  ('Air Conditioning', 'air_conditioning', 'residential', 1),
  ('Standby Generator / Plant', 'standby_generator', 'residential', 2),
  ('Solar Power System', 'solar_power', 'residential', 3),
  ('Water Reservoir (Polytank)', 'water_reservoir', 'residential', 4),
  ('24/7 Security', 'security_24_7', 'residential', 5),
  ('Fitted Kitchen Cabinets', 'fitted_kitchen', 'residential', 6),
  ('Prepaid Meter', 'prepaid_meter', 'residential', 7),
  ('Walled & Gated', 'walled_gated', 'residential', 8),
  -- Commercial (same amenities apply, duplicated under commercial category)
  ('Air Conditioning', 'air_conditioning_commercial', 'commercial', 1),
  ('Standby Generator / Plant', 'standby_generator_commercial', 'commercial', 2),
  ('Solar Power System', 'solar_power_commercial', 'commercial', 3),
  ('Water Reservoir (Polytank)', 'water_reservoir_commercial', 'commercial', 4),
  ('24/7 Security', 'security_24_7_commercial', 'commercial', 5),
  ('Fitted Kitchen Cabinets', 'fitted_kitchen_commercial', 'commercial', 6),
  ('Prepaid Meter', 'prepaid_meter_commercial', 'commercial', 7),
  ('Walled & Gated', 'walled_gated_commercial', 'commercial', 8),
  -- Land amenities
  ('Fenced / Walled Compound', 'fenced_walled', 'land', 1),
  ('Tarred / Graded Road Access', 'tarred_road', 'land', 2),
  ('Electricity Grid Connected', 'electricity_grid', 'land', 3),
  ('Water Pipe Connected', 'water_pipe', 'land', 4),
  ('Registered Indenture / Title Docs', 'registered_indenture', 'land', 5),
  ('Non-Waterlogged Area', 'non_waterlogged', 'land', 6)
ON CONFLICT (slug) DO NOTHING;
