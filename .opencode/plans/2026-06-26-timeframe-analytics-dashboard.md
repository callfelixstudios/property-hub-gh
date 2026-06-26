# Timeframe Analytics Dashboard

## Files to Create (2)

### 1. `src/components/dashboard/TimeframeSelector.tsx`
Clean dropdown component — exactly as provided. Exports `TimeframePeriod` type.

### 2. `src/app/actions/analytics.ts`
Server action with `getDateThreshold()` and `fetchTimeframeAnalytics(posterId, period)` — queries `property_analytics` event log with `.gte('created_at', dateThreshold)`.

## Files to Modify (1)

### 3. `src/components/dashboard/DashboardTabs.tsx`

**Imports** (add alongside existing imports):
- `useTransition` from `'react'` (already imports `useState, useEffect, useRef` — add `useTransition`)
- `TimeframeSelector, { TimeframePeriod }` from `'./TimeframeSelector'`
- `fetchTimeframeAnalytics` from `'@/app/actions/analytics'`

**State & handlers** (add near existing state ~line 93):
```tsx
const [period, setPeriod] = useState<TimeframePeriod>('all');
const [isAnalyticsPending, startAnalyticsTransition] = useTransition();
const [analyticsData, setAnalyticsData] = useState(() => {
  const tViews = initialListings?.reduce((sum, l) => sum + (l.views_count || 0), 0) || 0;
  const tLeads = initialListings?.reduce((sum, l) => sum + (l.whatsapp_leads_count || 0), 0) || 0;
  return {
    totalViews: tViews,
    totalLeads: tLeads,
    conversionRate: tViews > 0 ? ((tLeads / tViews) * 100).toFixed(1) : '0.0',
    listingBreakdown: initialListings?.map(l => ({
      id: l.id,
      title: l.title,
      status: l.status || 'active',
      views_count: l.views_count || 0,
      whatsapp_leads_count: l.whatsapp_leads_count || 0,
      conversion_rate: l.views_count > 0 ? ((l.whatsapp_leads_count || 0) / l.views_count * 100).toFixed(1) : '0.0'
    })) || []
  };
});

const handleTimeframeChange = (newPeriod: TimeframePeriod) => {
  setPeriod(newPeriod);
  startAnalyticsTransition(async () => {
    const updated = await fetchTimeframeAnalytics(userId, newPeriod);
    setAnalyticsData(updated);
  });
};
```

**Note on blueprint fix:** `useTransition` not currently imported — must be added. The `useEffect` is already imported, so the blueprint's `import { useEffect }` line is redundant; we can skip it.

**Overview tab replacement** — replace the contents of `{activeTab === 'overview' && (...)}` with the new layout containing:
- Header row with title/subtitle + `TimeframeSelector` with loading spinner
- 3 summary cards (Views, Leads, Conversion Rate)
- Performance table with 5 columns (Title, Status, Views, WhatsApp Clicks, Conversion %)
- Empty state message when no events exist for the timeframe

### No Changes To
- `src/app/dashboard/page.tsx` — still passes `initialListings`; the initial analytics state is derived from it
- `src/app/listings/[id]/page.tsx` — still reads fast `row.views_count` from counter column
- `src/app/actions/leads.ts` — still fires `increment_whatsapp_leads` with `{ row_id }`

### SQL (run in Supabase SQL Editor)
Same as before — the `property_analytics` table, index, and dual-write RPCs.

---

## ⚠️ Notes Before Implementing

1. **`useTransition` not imported:** The current DashboardTabs imports `useState, useEffect, useRef` but not `useTransition`. Must add it to the React import.
2. **`useEffect` already imported:** The blueprint says to add `import { useEffect }` — skip this, it's already there.
3. **`listingBreakdown` type:** The blueprint uses `.toLocaleString()` on `views_count`/`whatsapp_leads_count` in the table. Since these are numbers, this works.
4. **Compiled initial state:** Using `useState(() => {...})` with an initializer function is correct — it lazily computes from `initialListings` once on mount, avoiding re-computation on re-renders.
