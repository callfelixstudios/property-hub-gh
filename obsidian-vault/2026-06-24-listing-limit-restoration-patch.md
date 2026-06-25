# 2026-06-24 — Listing Limit Restoration Patch

> **Branch:** `main` | **Date:** 2026-06-24 | **Type:** Security / Bug Fix

---

## 1. Milestone Summary

The listing restoration bypass exploit was patched. Previously, a free user could circumvent the 2-active-listing limit by archiving listings (bypassing the creation-time check) and then freely restoring them to active status without any count validation. The `handleRestoreListing` function in `DashboardTabs.tsx` now queries Supabase for the user's current active listing count before performing any database write. If the count is already at or above the limit of 2, the restore is blocked client-side and a contextual inline error banner is displayed.

---

## 2. Files Modified

- `src/components/dashboard/DashboardTabs.tsx`

---

## 3. Data/UI Architecture State

- **Exploit Pattern Closed**: The creation wizard (`post-space/page.tsx`) previously enforced the listing limit only at the point of new listing submission. The `handleRestoreListing` path had no equivalent check, creating a bypass route via archive → restore cycles.
- **Guard Implementation**: `handleRestoreListing` now performs a pre-write query: `supabase.from('listings').select('id').eq('poster_id', userId).in('status', ['active'])`. If `activeListings.length >= ACTIVE_LISTING_LIMIT (2)`, the DB update is skipped entirely.
- **Error State**: Replaced `alert()` with a `restoreError` React state variable (`useState<string | null>(null)`). The error is surfaced as a dismissable inline banner at the top of the Archived Listings tab — styled with a red background, an icon, and a dismiss (×) button.
- **Constants**: `ACTIVE_LISTING_LIMIT = 2` is defined as a named constant at the top of the function for easy future adjustment.

---

## 4. Next Immediate Steps

Await next user instructions. Potential next steps include:

- Enforcing the same limit guard in any future admin-level status restore flows.
- Upgrading the tier system to allow paid users to have more than 2 active listings.
