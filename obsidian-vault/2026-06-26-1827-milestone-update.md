# Milestone Update: Timeframe Analytics Dashboard

**Executed on:** 2026-06-26 at 18:27:00 GMT

## Milestone Summary
- Built a time-series analytics engine with a dedicated `property_analytics` event log table and dual-write RPCs for both views and WhatsApp leads
- Created `TimeframeSelector` dropdown component supporting 7 time ranges (24h, 7d, 30d, 3m, 6m, 1y, all)
- Created `fetchTimeframeAnalytics` server action querying the event log with date threshold filtering
- Refactored `DashboardTabs` Overview tab with 3-card summary layout (Total Views, WhatsApp Leads, Lead Conversion Rate), a 5-column performance table with conversion percentages, and empty state handling
- Applied the `property_analytics` SQL migration manually via Supabase SQL Editor

## Files Modified
- `src/components/dashboard/DashboardTabs.tsx` — major refactor of Overview tab with timeframe selector, 3-card summary, performance table with conversion column, `useTransition` for responsive UI
- `src/app/actions/analytics.ts` — **new** server action for timeframe-aware event log queries
- `src/components/dashboard/TimeframeSelector.tsx` — **new** timeframe dropdown component
- `supabase/migrations/20260626000002_add_property_analytics_event_log.sql` — **new** event log table + dual-write RPCs

## Data/UI Architecture State
- `property_analytics` table: `id UUID PK`, `listing_id UUID FK→listings`, `event_type VARCHAR(20) CHECK('view','whatsapp')`, `created_at TIMESTAMPTZ`
- Composite index on `(listing_id, event_type, created_at)` for fast timeframe scans
- `increment_listing_views(row_id UUID)` — INSERT into `property_analytics` + UPDATE `listings.views_count`
- `increment_whatsapp_leads(row_id UUID)` — INSERT into `property_analytics` + UPDATE `listings.whatsapp_leads_count`
- Dashboard Overview: lazily computes initial analytics from `initialListings` server prop, uses `useTransition` on timeframe changes, shows spinner via `isPending`

## Next Immediate Steps
- Verify that view and WhatsApp click events appear in the `property_analytics` event log after the SQL is applied
- Test timeframe selector on dashboard (24h, 7d, 30d, etc.) and confirm analytics data shifts
- Push was already completed — this milestone documents commit `1a8ae9c`
