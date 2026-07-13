-- 20260719000001_create_notifications.sql
-- Phase 4: Intent-Driven Agent Lead Engine
-- Notifications table (foundation for future internal messaging) + trigger

-- ── 1. Ensure space_requests has required columns ──────────────────────────
ALTER TABLE public.space_requests
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- ── 2. Notifications table ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = false;

-- ── 3. Strict RLS — NO public INSERT policy ────────────────────────────────
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users select own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- NO INSERT policy — the SECURITY DEFINER trigger bypasses RLS internally

-- ── 4. Trigger function: call matching engine on new space request ─────────
CREATE OR REPLACE FUNCTION public.handle_new_space_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  PERFORM public.match_request_to_agents(NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_space_request_created
  AFTER INSERT ON public.space_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_space_request();
