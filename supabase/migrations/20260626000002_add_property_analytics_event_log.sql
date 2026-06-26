CREATE TABLE IF NOT EXISTS public.property_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE,
  event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('view', 'whatsapp')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_query 
ON public.property_analytics (listing_id, event_type, created_at);

CREATE OR REPLACE FUNCTION public.increment_listing_views(row_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO public.property_analytics (listing_id, event_type) 
  VALUES (row_id, 'view');
  
  UPDATE public.listings 
  SET views_count = COALESCE(views_count, 0) + 1 
  WHERE id = row_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.increment_whatsapp_leads(row_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO public.property_analytics (listing_id, event_type) 
  VALUES (row_id, 'whatsapp');
  
  UPDATE public.listings 
  SET whatsapp_leads_count = COALESCE(whatsapp_leads_count, 0) + 1 
  WHERE id = row_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
