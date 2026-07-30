-- 20260719000003_attach_matching_trigger.sql
-- Phase 4: Attach trigger to space_requests
-- MUST run AFTER 20260719000001_create_notifications.sql (notifications table + RLS)
-- and AFTER 20260719000002_match_request_to_agents.sql (matching RPC)
-- to avoid circular dependency

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
