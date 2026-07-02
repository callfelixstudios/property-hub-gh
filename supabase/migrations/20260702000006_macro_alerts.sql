-- 20260702000006_macro_alerts.sql
-- Migration for Phase 5: Macro KPIs and Actionable Alerts

-- 1. Create ENUMs for severity and categories
DO $$ BEGIN
    CREATE TYPE public.alert_severity_type AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.alert_category_type AS ENUM ('payment_gateway', 'fraud_anomaly', 'verification_bottleneck', 'audit_log_drift');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create the system_alerts table
CREATE TABLE IF NOT EXISTS public.system_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    category public.alert_category_type NOT NULL,
    severity public.alert_severity_type NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved')),
    action_taken TEXT,                           -- Description of mitigation action taken
    resolved_by UUID REFERENCES auth.users(id),  -- Admin who resolved the alert
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Indexes for faster querying of active alerts
CREATE INDEX IF NOT EXISTS idx_system_alerts_status ON public.system_alerts(status);
CREATE INDEX IF NOT EXISTS idx_system_alerts_severity ON public.system_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_system_alerts_category ON public.system_alerts(category);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.system_alerts ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies (Admins only)
CREATE POLICY "Admins can view alerts"
  ON public.system_alerts FOR SELECT TO authenticated
  USING (LOWER(split_part(auth.jwt() ->> 'email', '@', 2)) = 'propertyhubgh.com');

CREATE POLICY "Admins can manage alerts"
  ON public.system_alerts FOR ALL TO authenticated
  USING (LOWER(split_part(auth.jwt() ->> 'email', '@', 2)) = 'propertyhubgh.com')
  WITH CHECK (LOWER(split_part(auth.jwt() ->> 'email', '@', 2)) = 'propertyhubgh.com');

-- 6. Enable Realtime for system_alerts
-- Check if publication exists, if so add table to it, otherwise create publication
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
    ) THEN
        CREATE PUBLICATION supabase_realtime FOR TABLE public.system_alerts;
    ELSE
        ALTER PUBLICATION supabase_realtime ADD TABLE public.system_alerts;
    END IF;
EXCEPTION WHEN duplicate_object THEN
    -- Table is already in the publication
    NULL;
END
$$;
