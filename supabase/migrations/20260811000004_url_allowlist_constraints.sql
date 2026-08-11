-- migration file: supabase/migrations/20260811000004_url_allowlist_constraints.sql
-- M1 fix: whatsapp_link (profiles) and floor_plan_url (listings) are free-text
-- URL columns rendered as href= in the client. Without a server-side allowlist
-- they carry stored-XSS vectors: a value of `javascript:...` or `data:...` is a
-- valid string but renders as an executable link in the browser. This closes it:
--  1. Data cleanup: NULL out any existing rows that fail the allowlist before
--     the constraints are applied (otherwise ADD CONSTRAINT would fail on the
--     live DB).
--  2. CHECK constraints enforce the allowlist for all future writes:
--     - whatsapp_link must be NULL or `https://wa.me/<digits>` (only the
--       wa.me deep-link form is a legitimate WhatsApp contact link).
--     - floor_plan_url must be NULL or start with http:// or https://
--       (http(s) scheme only — everything else is rejected).
--  Constraint creation is wrapped in DO blocks keyed on pg_constraint.conname
--  so re-running the migration is a no-op (idempotent).

-- ── 1. Data cleanup before constraints ───────────────────────────────────────
UPDATE public.profiles
SET whatsapp_link = NULL
WHERE whatsapp_link IS NOT NULL
  AND whatsapp_link !~ '^https://wa\.me/[0-9]+$';

UPDATE public.listings
SET floor_plan_url = NULL
WHERE floor_plan_url IS NOT NULL
  AND floor_plan_url !~ '^https?://';

-- ── 2. Allowlist CHECK constraints (idempotent) ─────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_profiles_whatsapp_link'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT chk_profiles_whatsapp_link
      CHECK (whatsapp_link IS NULL OR whatsapp_link ~ '^https://wa\.me/[0-9]+$');
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_listings_floor_plan_url'
  ) THEN
    ALTER TABLE public.listings
      ADD CONSTRAINT chk_listings_floor_plan_url
      CHECK (floor_plan_url IS NULL OR floor_plan_url ~ '^https?://');
  END IF;
END;
$$;
