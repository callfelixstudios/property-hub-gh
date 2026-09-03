# Subscriptions Build B: Boost/Pin + Credit Purchase + Dynamic Config — Design

- **Date:** 2026-09-03
- **Status:** Approved (user: "execute"); supersedes spec `2026-09-03-subscriptions-paystack-design.md` §11 for Build B deliverables
- **Repo:** property-hub-gh (Next.js 16 App Router, Tailwind v4, Supabase, Vitest)

## 1. Goal

Complete the subscription monetization loop: users can **purchase Boost credits** (PayStack test-mode), **spend credits to boost listings** for a fixed duration (top of feed + gold badge, stackable), and a **Vercel Cron backstop** sweeps staleness (tier-aware archive), expired boosts, expiry/downgrade, and monthly grants.

Additionally, **all monetary amounts become admin-editable** from the dashboard: plan prices, credit price, credit qty limits, boost duration, listing caps, archive windows, features copy, billing cycle. Single source of truth moves to the database.

## 2. User decisions (locked 2026-09-03)

- **Credit price:** GHS 20/credit, qty selector 1–10, one Paystack transaction per purchase.
- **Boost mechanics:** gold badge + top placement (ordered ABOVE `tier_rank`); boosting the same listing again stacks +7 days; only `status='active'` + `moderation_status='approved'` listings can be boosted.
- **Cron:** tier-aware auto-archive (Free 30d / Pro 60d / Dev 90d) in Vercel Cron; admin Listing Health page stays for manual overrides.
- **Config scope:** FULL — prices, caps, archive windows, features, billing cycle, credit price/limits, boost duration all admin-editable from `/admin/config` panel (tabbed beside existing Amenities manager).
- **Cap lowering:** NON-retroactive — blocks new activations only; existing over-cap actives stay until archived; admin UI warns.
- **Webhook reconciles against `expected_amount_kobo` stamped at init** — never a live DB re-read (immune to mid-transaction price edits).
- `CREDIT_PRICE_GHS` = 20 confirmed.

## 3. Dynamic config — single source of truth

| Knob | Stored in | Default seed |
|---|---|---|
| Plan price | `subscription_plans.price_ghs` (exists) | 0 / 99.99 / 299.99 |
| Listing cap | `subscription_plans.active_listing_cap` (new) | 2 / 15 / 50 |
| Archive window | `subscription_plans.archive_after_days` (new) | 30 / 60 / 90 |
| Features copy | `subscription_plans.features` (exists) | current matrix |
| Billing cycle | `subscription_plans.billing_cycle` (exists, enum) | monthly |
| Credit price | `platform_config` (new key/value) | `credit_price_ghs` = 20 |
| Credit qty limits | `platform_config` | `credit_min_qty`=1, `credit_max_qty`=10 |
| Boost duration | `platform_config` | `boost_duration_days` = 7 |

**Code keeps (identity, not money):** slug, plan name (read-only), cta, highlighted flag, kobo math (`priceToKobo`). `src/lib/plans.ts` and `src/lib/tiers.ts` become **fallback defaults** only (used if a DB row is missing).

### `platform_config` table (new)

```sql
CREATE TABLE public.platform_config (
  key text PRIMARY KEY,
  value numeric NOT NULL,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id)
);
```
- RLS: anon/authenticated SELECT, admin-only write via `is_platform_admin()` (role-based, NOT the legacy email-domain policy).
- Seeded: `credit_price_ghs=20`, `credit_min_qty=1`, `credit_max_qty=10`, `boost_duration_days=7`.

## 4. Database migration (`supabase/migrations/20260905000000_build_b_credits_config.sql`)

1. `ALTER subscription_plans` ADD `active_listing_cap INT NOT NULL DEFAULT 2`, `archive_after_days INT NOT NULL DEFAULT 30`; backfill pro=15/60, developer=50/90. Extend billing_cycle CHECK if needed to keep `monthly`.
2. Create `platform_config` + seed + RLS (above).
3. Rewrite `check_free_tier_listing_limit()`: read `active_listing_cap` via the existing `user_subscriptions→subscription_plans` join; fallback per-slug 2/15/50 if NULL or ≤ 0; keep the distinct per-tier error messages; cap lowering is non-retroactive by construction (counts checked against current cap only for NEW activations).
4. `listings.boosted_until timestamptz NULL` + `guard_boosted_until` BEFORE UPDATE trigger (privileged-column guard pattern, same as `guard_profile_privileged_columns`; service_role/postgres/admin exempt).
5. `spend_credits(p_user_id uuid, p_listing_id uuid)` SECURITY DEFINER RPC:
   - caller guard (self unless service_role)
   - ownership check on listing (poster_id = p_user_id) + `status='active'` + `moderation_status='approved'`
   - atomic: `SELECT credit_balance FROM profiles WHERE id=… FOR UPDATE` → `RAISE EXCEPTION 'Insufficient credits'` if < 1
   - INSERT `credit_ledger` `{delta:-1, reason:'spend_boost', reference:p_listing_id}` (balance trigger applies)
   - `boosted_until = GREATEST(COALESCE(boosted_until, now()), now()) + boost_duration_days` (read from platform_config)
   - revoke from PUBLIC/anon; grant to authenticated
6. `cron_maintenance()` SECURITY DEFINER RPC, **service_role-only** caller guard, returns JSON/counts:
   - tier-aware staleness + auto-archive: per poster plan `archive_after_days`, set `listing_health='archived'`, `status='archived'`
   - clear expired boosts (`boosted_until <= now() → NULL`)
   - expiry/downgrade sweep: `downgrade_expired_subscriber` for users with active-but-expired subs
   - monthly grant sweep: `ensure_monthly_grant(user, 'YYYY-MM')` for active paid subs
7. Rewrite `fn_update_stale_listings()` to tier-aware windows (admin manual path).
8. **RLS bundle (fixes legacy email-domain landmine):** replace email-domain admin policies with `is_platform_admin()` on `subscription_plans`, `user_subscriptions`, `payment_transactions`, `config_regions`, `config_neighborhoods`, `config_amenities`. Add anon SELECT on `subscription_plans` (public pricing page) and `platform_config`.

## 5. Backend

### `src/lib` changes
- `plans.ts` → fallback-only: structure, default features, default caps, name/cta/highlighted. **No prices.**
- `src/lib/plansPricing.ts` (new, server-only): reads `subscription_plans` (+ `platform_config`) via server client → typed `PlanPricing { slug, name, price_ghs, billing_cycle, features, active_listing_cap, archive_after_days, is_active }` + `getCreditConfig()` → `{ credit_price_ghs, credit_min_qty, credit_max_qty, boost_duration_days }`. Falls back to plans.ts defaults on DB miss.
- `tiers.ts`: cap defaults match fallback (2/15/50) — untouched otherwise.

### Paystack routes
- `POST /api/paystack/initialize`: read price from DB (`plansPricing`) instead of code constant; stamp `metadata.expected_amount_kobo` + `metadata.kind='subscription'`.
- `POST /api/paystack/credits/initialize` (new): `{ qty }` validated 1–10 via `getCreditConfig()`; amount = qty × credit_price × 100 kobo; reference `ph_credits_<uuid>`; metadata `{ kind:'credits', user_id, qty, expected_amount_kobo }`; 503 guard if keys missing.
- `POST /api/paystack/webhook`: branch on `metadata.kind`:
  - `credits`: validate amount vs `expected_amount_kobo`, idempotency by `provider_reference`, insert `payment_transactions`, then `grant_credits(user_id, reason='purchase', amount=qty, reference=tx ref)` via admin client
  - `subscription`/undefined: existing subscription flow unchanged
- `GET /api/paystack/verify`: resolve both kinds (DB row exists by reference → success).

### Server actions
- `src/app/actions/boostActions.ts` (new): `boostListing(listingId)` → `spend_credits` RPC → revalidate paths; surfaces RPC error ("Insufficient credits — buy more from /pricing#credits").
- `src/app/actions/configActions.ts` (extend): `updatePlanConfig(planId, {price_ghs, billing_cycle, active_listing_cap, archive_after_days, features[], is_active})` and `updateCreditConfig({credit_price_ghs, credit_min_qty, credit_max_qty, boost_duration_days})` — `assertAdmin`, validation (price ≥ 0, cap ≥ 1, windows ≥ 1, min≤max qty), `logAdminAction` audit, revalidate.

### Cron
- `vercel.json` (new root): `{ "crons": [{ "path": "/api/cron/maintenance", "schedule": "0 3 * * *" }] }`
- `src/app/api/cron/maintenance/route.ts` (new): `Authorization: Bearer ${CRON_SECRET}` guard (constant-time compare) → admin client `rpc('cron_maintenance')` → JSON counts. New env `CRON_SECRET`.

## 6. UI

### Admin — `/admin/config` tabbed
- Existing Amenities tab (ConfigManager) + new **"Pricing & packages"** tab (`PricingManager`).
- Per-plan card: price (GH₵), billing cycle dropdown, active-listing cap, archive-after-days, features textarea (one per line), active toggle; save via `updatePlanConfig`.
- Credit block: credit price, min/max qty, boost duration days; save via `updateCreditConfig`.
- Disclaimer copy: "Changes apply to new purchases only."
- Cap-lowering warning: "Lowering a cap blocks new activations; existing listings over the cap stay active until archived."
- DESIGN.md styling (navy/gold, white cards, 8px radius, 1280px container, Plus Jakarta Sans).

### Public
- `src/components/CreditPurchaseButton.tsx` (new, shared client): qty selector (1–10 from config), POST `/api/paystack/credits/initialize`, Paystack Inline popup (`@paystack/inline-js`), `authorization_url` fallback, `verify` poll on success, success banner, "Payments not configured" disabled state on 503, login CTA when logged out.
- `SidebarProfile.tsx`: replace disabled "Buy credits — coming soon" with `CreditPurchaseButton` (compact).
- `pricing/page.tsx`: server component reads prices/features from DB via `plansPricing`; replace "top-ups coming soon" copy in `#credits` section with `CreditPurchaseButton` + live credit price; keep `Product` JSON-LD (prices from DB, currency GHS).

### Listings
- `PropertyCard`: `badge` prop gains `'boosted'` variant → gold "Boosted" pill.
- `listingsQuery.ts` + `locationPage.ts`: order `boosted_until DESC NULLS LAST` → `tier_rank DESC` → existing sort; pass `isBoosted` flag to card.
- Dashboard listing management (`DashboardTabs.tsx` + `boostActions`): "Boost" button on active/approved rows, "Boosted until <date>" state, gold badge on boosted rows.

## 7. Env

New: `CRON_SECRET` (Vercel Cron bearer). Existing: `PAYSTACK_SECRET_KEY`, `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`, `PAYSTACK_MODE=test` unchanged.

## 8. Testing

- New/extended vitest: `plansPricing` fallback logic, kobo math (`qty × credit_price`), webhook kind-branching + stamp reconcile, reference format `ph_credits_<uuid>`, config action validation (price/cap/window bounds).
- Existing 105 tests must stay green (plan slug lookups still work via fallback).

## 9. Verification

`npm run lint` (0 new errors) · `npx tsc --noEmit` · `npm test` · `npm run build` PASS. Apply migration via MCP `apply_migration`; verify with `list_tables` + SQL: triggers, RPCs (spend_credits, cron_maintenance), RLS policies (role-based, anon reads), revokes. End-to-end against Supabase test mode: credit purchase → webhook → balance increment → boost spend → ledger −1 + boosted_until + feed order + badge.

## 10. Out of scope

Admin credit-adjustment UI (RPC exists; console/SQL only), recurring billing, live PayStack keys, effective-dated price history (audit log + manual edit covers rare changes), retroactive cap enforcement.