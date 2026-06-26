ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS whatsapp_leads_count integer DEFAULT 0 NOT NULL;

CREATE OR REPLACE FUNCTION increment_whatsapp_leads(row_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.listings
  SET whatsapp_leads_count = COALESCE(whatsapp_leads_count, 0) + 1
  WHERE id = row_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
