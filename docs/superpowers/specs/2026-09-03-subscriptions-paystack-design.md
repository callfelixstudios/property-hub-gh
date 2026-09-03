# Subscriptions: Packages Page + PayStack Integration — Design

- **Date:** 2026-09-03
- **Status:** Approved (user: "Everything else looks great. You can proceed"; bulk upload/API removed per user)
- **Repo:** property-hub-gh (Next.js 16 App Router, Tailwind v4, Supabase, Vitest)

## 1. Goal

Ship a public `/pricing` page listing the three subscription packages with a deliberately **wide gap** between Free and paid tiers, plus a **fully working test-mode PayStack payment flow**: initialize → Paystack Inline popup (hosted page fallback) → webhook/verify → DB write-back (`payment_transactions` + `user_subscriptions` + `profiles.membership_tier`).

Phase B (soft-lock enforcement, dashboard tier UI, boost/pin mechanics, staleness worker) is explicitly out of scope for this build.

## 2. User decisions (locked)

- Checkout: server-side `transaction/initialize` → client opens **Paystack Inline popup**; `authorization_url` kept as fallback.
- Scope: packages page + **working test-mode flow** (not stubs).
- Channels: Cards + Mobile Money, currency **GHS**.
- Inline popup lib: **`@paystack/inline-js`** (npm).
- Webhook: **HMAC-SHA512 signature + amount reconciliation** before DB write.
- Pricing data source: **static typed constant in code** (`src/lib/plans.ts`), mirroring DB seed.
- **Removed:** Bulk upload (CSV) and API access — no plans for them.

## 3. Wide-gap tier matrix

| Feature | Free (GHS 0) | Pro (GHS 99.99/mo) | Developer (GHS 299.99/mo) |
|---|---|---|---|
| Active listings | 2 | 15 | 50 |
| Verified badge | — | Verified Agent (gold, profile + listings) | Verified Developer + company branding |
| Search placement | Standard (below paid) | Ranked above free | Top placement / featured rotation |
| Moderation | Standard queue | Priority (jump queue) | Instant priority |
| Analytics | — | Per-listing views + WhatsApp lead clicks | Pro + portfolio dashboard |
| Matching leads | — | Space-request matches forwarded | Same + bulk export |
| Boost/Pin credits | — | 1/mo (7-day top placement) | 3/mo |
| Listing refresh window | 30-day archive applies | 60-day | 90-day |
| Support | Standard email | Priority email | Dedicated WhatsApp line |

The gap is the selling point: Free = 2 listings, no badge, bottom of feed, 30-day archive, no analytics/leads. Pro unlocks trust + data + capacity; Developer is agency-scale branding + priority.

## 4. File layout

### New files
- `src/lib/plans.ts` — typed plans constant
- `src/utils/paystack.ts` — Paystack API helpers (server-only)
- `src/app/api/paystack/initialize/route.ts` — POST
- `src/app/api/paystack/webhook/route.ts` — POST (raw body HMAC)
- `src/app/api/paystack/verify/route.ts` — GET (client polling after payment)
- `src/app/pricing/page.tsx` — public server component
- `src/components/PricingClient.tsx` — client checkout buttons + Inline popup
- `supabase/migrations/20260903000000_align_subscription_plan_seed.sql` — align seed `features` JSON with matrix (Free "2 active listings")

### Modified
- `package.json` — add `@paystack/inline-js`
- `.env.local` — add `PAYSTACK_SECRET_KEY`, `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`, `PAYSTACK_MODE=test` (user supplies actual test keys)
- `src/components/Footer.tsx` — add `/pricing` link under Resources (do NOT touch header nav)

## 5. Contracts

### `src/lib/plans.ts`
```ts
export interface Plan {
  slug: 'free' | 'pro' | 'developer';
  name: string;
  price_ghs: number;      // 0 | 99.99 | 299.99
  billing_cycle: 'monthly';
  features: string[];      // display strings per matrix
  highlighted?: boolean;   // true for Developer
  cta: string;
}
export const PLANS: Plan[];
export function getPlanBySlug(slug: string): Plan | undefined;
```
`price_kobo = Math.round(price_ghs * 100)` helper exported too.

### `POST /api/paystack/initialize`
Body `{ planSlug: 'pro' | 'developer' }`. Requires authenticated user (server supabase `createClient`, `getUser` → 401 if none). Rejects `free` slug.
Builds reference `ph_sub_<slug>_<uuid>` (no hyphens in uuid), calls Paystack init with email, `amount` (kobo), `currency: 'GHS'`, `channels: ['card','mobile_money','bank_transfer','ussd']`? — channels: cards + mobile money (`['card', 'mobile_money']`), `metadata: { user_id, plan_slug, plan_name }`.
Returns `{ authorization_url, access_code, reference }`. If `PAYSTACK_SECRET_KEY` missing → 503 `{ error: 'Payments not configured' }`.

### `POST /api/paystack/webhook`
- Read raw `await request.text()`; parse JSON.
- Compute `expected = crypto.createHmac('sha512', PAYSTACK_SECRET_KEY).update(rawBody).digest('hex')`; compare to `x-paystack-signature` header (timing-safe).
- Only handle `event === 'charge.success'`.
- Extract `event.data.metadata.{user_id, plan_slug}`, `event.data.reference`, `event.data.amount` (kobo, matches plan price) — reject mismatch.
- **Idempotent:** if `payment_transactions.provider_reference` exists → return 200 without re-write.
- Using **admin client** (`createAdminClient` from `@/utils/supabase/admin`):
  1. Insert `payment_transactions` (user_id, amount_ghs, provider `'paystack'`, provider_reference, status `'completed'`, metadata event object).
  2. Lookup `subscription_plans` by slug → plan_id.
  3. Insert `user_subscriptions` (user_id, plan_id, status `'active'`, starts_at now, ends_at now + 1 month).
  4. Update `profiles.membership_tier = plan_slug` for user_id (aligns with existing `adminActions` tier logic).
- Return 200 `{ received: true }`; 400 on bad signature/amount.

### `GET /api/paystack/verify?reference=...`
Server: `verifyTransaction(reference)` → if DB row exists return `{ status: 'success' }`; else Paystack status (`success`/`abandoned`/`failed`/`pending`). Used by PricingClient after popup success to confirm write-back (works in local dev where webhooks can't reach localhost).

### `src/utils/paystack.ts` (server-only, must not be imported by client)
- `initializeTransaction({ email, amountKobo, reference, metadata, channels })` → POST `https://api.paystack.co/transaction/initialize` (Authorization Bearer secret). Returns `{ authorization_url, access_code, reference }` or throws.
- `verifyTransaction(reference)` → GET `https://api.paystack.co/transaction/verify/{reference}` → `{ status, amount }`.
- `validateWebhookSignature(rawBody, signature, secret)` → boolean (HMAC-SHA512, timing-safe compare).
- Base URL `https://api.paystack.co`; fetch via Node `fetch` (Next 16).

### `src/app/pricing/page.tsx` (server component)
- `generateMetadata`: title `Pricing & Packages | Property Hub GH`, description, canonical.
- JSON-LD: `ItemList` of `Product` offers (price, priceCurrency GHS, url `/pricing`).
- Renders `PLANS` via `PricingClient`. DESIGN.md styling (navy/gold, white cards, 8px radius, 1280px container, Plus Jakarta Sans).

### `src/components/PricingClient.tsx` (client)
- Plan cards; subscribe button on Pro/Developer → requires auth (server passes `isAuthed`; if not, button links to `/login`).
- Click Pro/Developer: POST `/api/paystack/initialize` → on success load `PaystackPop` from `@paystack/inline-js`, `new PaystackPop().newTransaction({ accessCode, onSuccess, onCancel })`. Fallback: `window.location.href = authorization_url` if no access_code.
- onSuccess → GET `/api/paystack/verify?reference=` → success banner ("Payment received — your subscription is active") or "pending — we'll confirm shortly"; onCancel → silent dismiss.
- Guard: if server says payments unconfigured (503) → button disabled with tooltip "Payments coming soon".

## 6. Env vars

```
PAYSTACK_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxx
PAYSTACK_MODE=test
```
(If `PAYSTACK_MODE=live`, no behavioral change — keys determine it. Guard against missing keys as above.)

## 7. DB

- **No schema changes.** Tables already exist (`subscription_plans`, `user_subscriptions`, `payment_transactions` — migration `20260702000001`).
- Seed alignment migration updates `features` JSON only (Free: "2 active listings"; Pro/Developer per matrix), never touches triggers/prices.
- Per AGENTS.md, DB schema changes must go through migrations (repo convention: raw SQL in `supabase/migrations/` — **no drizzle config exists in this repo**, noted discrepancy; not acted on).

## 8. Testing

- `paystack.test.ts` (vitest): `validateWebhookSignature` matches/mismatches; `getPlanBySlug` lookup; kobo conversion rounding.
- Contract tests for reference format `ph_sub_<slug>_<uuid>`.

## 9. Verification

`npm run lint` (0 new errors), `npx tsc --noEmit`, `npm test`, `npm run build` PASS. Then update `obsidian-vault/To Do.md` item 7 Phase A checkboxes.

## 10. Out of scope (Phase B)

Soft-lock enforcement, dashboard tier UI, boost/pin a-la-carte purchases, staleness worker changes, recurring billing, live keys.

## 11. Credit ledger addendum — LOCKED 2026-09-03

Supersedes §10 for Boost/credits: the credit system is split across builds as below. All decisions user-approved.

### Locked decisions
- **Unit:** 1 credit = 1 seven-day property boost.
- **Price:** `CREDIT_PRICE_GHS` placeholder (suggested GHS 20 — at ~GHS 80/mo perpetual boosting ≈ Pro price, so bank-and-lapse gaming is self-defeating). Confirm before Build B.
- **Spend scope:** boosts only. Plan upgrades stay Paystack-GHS-only (no credit-for-subscription rail).
- **Liquid on every tier, including free:** credits are spendable AND purchasable on any tier. No freeze/thaw, no expiry. Rationale: freezing confiscates paid value (trust/chargeback risk); pricing makes gaming uneconomic; lapsed-user boosting is a resubscribe funnel; PRD §5.1 promises tier-independent boost purchase.
- **Tier gap carried by:** caps (2/15/50), badge, analytics, leads, organic placement — not by withholding boosts.

### Build A (schema + grants + visibility)
- Migration: `credit_ledger` append-only (`user_id`, `delta`, `reason` CHECK `grant|purchase|spend_boost|expire|admin_adjust`, `reference`, `cycle_key` calendar-month `'YYYY-MM'`, `created_at`); unique partial index `(user_id, cycle_key)` WHERE `reason='grant'`; `profiles.credit_balance` INT DEFAULT 0 maintained by trigger; RLS read-own; all writes via `SECURITY DEFINER` functions only.
- `grant_credits()` + lazy `ensure_monthly_grant()` on tier-resolution paths (Pro 1/mo, Developer 3/mo); webhook grants on purchase.
- Dashboard balance widget ("Boost credits: N") + disabled "Buy credits" CTA ("Coming soon" tooltip); `/pricing#credits` anchor (1 credit = 1 boost explainer, included credits, top-up teaser marked coming soon).

### Build B (flows)
- Enable CTAs: Paystack credit purchase → `purchase` rows + `payment_transactions` entry; `spend_credits()` + listing boost fields + reserved feed ordering key; Vercel Cron backstop (staleness + expiry/downgrade + grant sweep).