# Implementation Plan — Subscriptions Build B: Boost/Pin + Credit Purchase + Dynamic Config

**Branch:** `feat/subscriptions-build-b` (off `main` @ `949d0fc`)
**Spec:** `docs/superpowers/specs/2026-09-03-subscriptions-build-b-credits-config-design.md` (read first; exact values live there)
**Stack:** Next.js 16 App Router, Supabase (migrations via repo SQL + MCP apply), Vitest, Tailwind v4. Lint script: `npm run lint`; typecheck: `npx tsc --noEmit`; tests: `npm test`; build: `npm run build`. Repo convention: commits go on the feature branch; DB schema changes go through `supabase/migrations/` raw SQL, applied via MCP `apply_migration` (NO drizzle in this repo, NO `drizzle push`).

## Global constraints

- DESIGN.md UI system (navy/gold, white cards, 8px radius, 1280px container, Plus Jakarta Sans) for all UI.
- Security posture (Build A / security wave): SECURITY DEFINER RPCs with caller guards, `is_platform_admin()` role-based admin checks, revoke from PUBLIC/anon where internal, privileged-column guard triggers, RLS on all tables. Legacy email-domain policies must be REPLACED by role-based ones.
- No comments in code unless asked.
- Never hardcode monetary values in client code; single source of truth = DB after this build (code fallbacks only).
- Webhook amount reconciliation against `expected_amount_kobo` stamp — never a live DB read.
- Cap lowering is non-retroactive.

## Task 1 — DB migration

File: `supabase/migrations/20260905000000_build_b_credits_config.sql` (single file; spec §4). Apply via MCP `apply_migration` after subagent completes and I review.

1. `subscription_plans`: ADD `active_listing_cap INT NOT NULL DEFAULT 2`, `archive_after_days INT NOT NULL DEFAULT 30`; backfill pro (15/60), developer (50/90) by slug. Ensure billing_cycle CHECK still allows all existing values.
2. New `platform_config` table (key text PK, value numeric, updated_at, updated_by FK profiles), seed 4 rows (spec §3 exact keys/values), RLS: SELECT anon+authenticated, admin ALL via `is_platform_admin()`.
3. Rewrite `check_free_tier_listing_limit()`: cap from plan joined row's `active_listing_cap` (fallback 2/15/50 when NULL/≤0); keep per-tier free/pro/developer error messages; revokes unchanged.
4. `listings.boosted_until timestamptz NULL` + `guard_boosted_until` BEFORE UPDATE trigger (privileged-column pattern; exempt current_user in ('postgres','service_role') or `is_platform_admin()`).
5. `spend_credits(p_user_id, p_listing_id)` SECURITY DEFINER: guards per spec §4.5; reads `boost_duration_days` from platform_config; atomic FOR UPDATE balance; credit_ledger −1 reason `spend_boost` reference=listing_id; `boosted_until = GREATEST(COALESCE(boosted_until, now()), now()) + (duration || ' days')::interval`; revoke PUBLIC/anon + grant authenticated.
6. `cron_maintenance()` SECURITY DEFINER, service_role-only caller guard, returns `json` counts `{archived, boosts_cleared, downgraded, granted}`; logic per spec §4.6 (archive per poster plan archive_after_days; clear expired boosts; foreach active-but-expired sub → `downgrade_expired_subscriber`; foreach active paid sub → `ensure_monthly_grant` with cycle `to_char(now(),'YYYY-MM')`).
7. Rewrite `fn_update_stale_listings()` tier-aware (admin manual path).
8. RLS bundle per spec §4.8: replace email-domain admin policies with `is_platform_admin()` on `subscription_plans`, `user_subscriptions`, `payment_transactions`, `config_regions`, `config_neighborhoods`, `config_amenities`; add anon SELECT on `subscription_plans` + `platform_config`.

Deliver: the SQL file only (no apply). Report: file path, list of objects created/altered, any idempotency notes.

## Task 2 — Backend: lib + Paystack routes + actions + cron

1. `src/lib/plans.ts` → fallback-only (structure/name/cta/features/caps; remove price from any runtime read path — keep `getPlanBySlug` working for fallback). Add `active_listing_cap` + `archive_after_days` to the Plan type defaults.
2. New `src/lib/plansPricing.ts` (server-only, imports `createClient` from `@/utils/supabase/server`): `getPlansPricing()` → typed array (spec §5: slug, name, price_ghs, billing_cycle, features, active_listing_cap, archive_after_days, is_active) ordered by sort_order, fallback per slug from plans.ts; `getCreditConfig()` → `{credit_price_ghs, credit_min_qty, credit_max_qty, boost_duration_days}` with defaults (20, 1, 10, 7) on DB miss. Add `getPriceKobo(price_ghs)` reuse of `priceToKobo`.
3. `src/app/api/paystack/initialize/route.ts`: read plan price from DB via `getPlansPricing()` (fallback constant if missing); stamp `metadata.expected_amount_kobo` + `metadata.kind='subscription'`; rest unchanged.
4. New `src/app/api/paystack/credits/initialize/route.ts`: auth required; validate qty int within min/max from `getCreditConfig()`; amount kobo = qty × credit_price_ghs × 100; reference `ph_credits_<uuid>` (uuid without hyphens); metadata `{kind:'credits', user_id, qty, expected_amount_kobo}`; 503 when `PAYSTACK_SECRET_KEY` missing.
5. `src/app/api/paystack/webhook/route.ts`: branch on `metadata.kind === 'credits'` → validate amount === expected_amount_kobo, idempotency on provider_reference, insert payment_transactions (provider 'paystack', status 'completed', metadata full event), then admin rpc `grant_credits` with `p_reason='purchase'`, `p_amount=qty`, `p_cycle_key=null` and `reference`=transaction id; subscription path unchanged. Return 200 `{received:true}`; 400 on bad amount.
6. `src/app/api/paystack/verify/route.ts`: reference DB lookup covers both kinds (no change needed beyond confirming query is generic by provider_reference).
7. New `src/app/actions/boostActions.ts`: `boostListing(listingId)` server action — user tier+subscription-neutral; `rpc('spend_credits', {...})`; on error map 'Insufficient credits' message nicely; revalidate dashboard listing paths.
8. Extend `src/app/actions/configActions.ts`: `updatePlanConfig(planId, patch)` and `updateCreditConfig(patch)` with `assertAdmin`, validation (price ≥ 0; cap ≥ 1; archive ≥ 1; credit_price > 0; min ≥ 1; max ≥ min; boost ≥ 1), `logAdminAction`, revalidate `/admin/config` + `/pricing`.
9. New `src/app/api/cron/maintenance/route.ts`: bearer check `crypto.timingSafeEqual`-style compare of `CRON_SECRET`; admin client `rpc('cron_maintenance')`; JSON response with counts; 401 on mismatch/no secret.
10. New root `vercel.json`: cron `0 3 * * *` → `/api/cron/maintenance`.
11. Tests: extend/add vitest for plansPricing fallback, credits kobo math, reference format, webhook credits branch, config validation bounds. Keep existing 105 green.

## Task 3 — UI: admin PricingManager + public purchase + listings boost UI

1. `src/components/admin/PricingManager.tsx` (new client): per-plan card (price, billing cycle select from enum, active_listing_cap, archive_after_days, features textarea one-per-line, is_active toggle), save → `updatePlanConfig`; credit block (price, min/max qty, boost days) → `updateCreditConfig`; "applies to new purchases" disclaimer + cap-lowering warning; DISIGN.md styling; loading/error states.
2. `src/app/admin/config/page.tsx` → tabbed layout: "Amenities & Features" (existing ConfigManager) + "Pricing & packages" (PricingManager); server component fetches `getPlansPricing()` + `getCreditConfig()` and passes props.
3. `src/components/CreditPurchaseButton.tsx` (new client): props `{creditPriceGhs, minQty, maxQty, compact?}`; qty stepper; disabled "Payments not configured" (503) state; logged-out → Link to /login; Paystack Inline popup via `@paystack/inline-js` with access_code, authorization_url fallback; onSuccess → GET `/api/paystack/verify?reference=` → success banner or "pending — we'll confirm shortly"; onCancel silent.
4. `src/components/dashboard/SidebarProfile.tsx`: replace disabled Buy-credits button with compact `CreditPurchaseButton`.
5. `src/app/pricing/page.tsx` (server): read plans + credit config from DB (`getPlansPricing`, `getCreditConfig`), pass to `PricingClient`; `#credits` section: live credit price + `CreditPurchaseButton` replacing "coming soon" copy; keep JSON-LD products (prices from DB).
6. `src/components/PricingClient.tsx`: accept plans/creditConfig props; render prices/features from props (not hardcoded).
7. `src/components/PropertyCard.tsx`: `badge` prop accepts `'boosted'` → gold "Boosted" pill variant (keep existing safemove).
8. `src/utils/listingsQuery.ts` + `src/utils/locationPage.ts`: order `.order('boosted_until', { ascending: false, nullsFirst: true })` before tier_rank/sort; map `isBoosted: !!boosted_until && boosted_until > now` into card props; select `boosted_until`.
9. Dashboard listing management (`src/components/dashboard/DashboardTabs.tsx`): "Boost" button per active+approved listing → `boostListing`; "Boosted until <date>" + gold badge when boosted; credit balance hint; revalidate after boost.

## Task 4 — Verification (coordinator, after Tasks 1–3)

- Apply migration via MCP `apply_migration`; verify via `supabase list_tables` + SQL: new columns/table, spend_credits + cron_maintenance exist + grants/revokes, RLS policies count + no email-domain remnants, triggers present.
- Run `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build`; fix via subagent if failures.
- Test-mode end-to-end check against Supabase (credit purchase → webhook → balance; boost → ledger −1 → boosted_until → feed order) if keys present.

## Exit criteria

All lint/typecheck/test/build gates pass; migration applied and verified; UI reflects DB-driven values; Push branch + Obsidian milestone update + To Do.md per AGENTS.md.