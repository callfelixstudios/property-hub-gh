# Analytics Tracking System

## Current State
- ✅ `views_count` column exists
- ✅ `increment_listing_views(row_id UUID)` function exists
- ✅ View tracking fires on listing detail page (line 254, fire-and-forget)
- ✅ Views count displayed on detail page (line 333)
- ✅ Dashboard "Total Views" summary card exists
- ✅ `trackWhatsAppClick` server action at `src/app/actions/leads.ts`
- ✅ WhatsAppButton component with click tracking
- ❌ `whatsapp_leads_count` column missing
- ❌ `increment_whatsapp_leads` function missing
- ❌ Dashboard missing WhatsApp leads card + per-listing table

---

## Changes Required

### SQL (2 new migrations to run in Supabase SQL Editor)

**File 1:** `supabase/migrations/20260626000001_add_whatsapp_leads_column.sql`
```sql
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS whatsapp_leads_count integer DEFAULT 0 NOT NULL;

CREATE OR REPLACE FUNCTION increment_whatsapp_leads(row_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.listings
  SET whatsapp_leads_count = COALESCE(whatsapp_leads_count, 0) + 1
  WHERE id = row_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Note: Uses `row_id UUID` param name — consistent with existing `increment_listing_views(row_id UUID)`.

---

### Code Changes

#### 1. `src/components/dashboard/DashboardTabs.tsx`
Add WhatsApp leads aggregate to the Overview tab (lines 621-624) and a per-listing breakdown table.

**Overview tab** — add a 4th summary card after the Total Views card:
```tsx
<div className="bg-emerald-50 p-6 rounded-md border border-emerald-100">
  <p className="text-sm text-emerald-700 font-medium mb-1">WhatsApp Leads</p>
  <p className="text-3xl font-bold text-emerald-600">
    {listings.reduce((sum, listing) => sum + (listing.whatsapp_leads_count || 0), 0)}
  </p>
</div>
```

**After the summary cards grid** (after `</div>` closing the 3-column grid) — add a breakdown table:
```tsx
{/* Listing Performance Breakdown */}
<div className="mt-8">
  <h3 className="text-lg font-bold text-navy-base mb-4">Listing Performance</h3>
  <div className="bg-white border border-gray-100 rounded-lg overflow-x-auto">
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="bg-slate-50 border-b border-gray-100 text-xs font-bold text-navy-base uppercase">
          <th className="p-4">Property</th>
          <th className="p-4">Status</th>
          <th className="p-4 text-center">Views</th>
          <th className="p-4 text-center">WhatsApp Leads</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50 text-sm">
        {listings.filter(l => l.status !== 'archived').map(listing => (
          <tr key={listing.id} className="hover:bg-slate-50/50 transition-colors">
            <td className="p-4 font-semibold text-navy-base max-w-xs truncate">
              {listing.title || 'Untitled Property'}
            </td>
            <td className="p-4">
              <span className={`inline-flex px-2 py-0.5 text-xs font-bold rounded-full ${
                listing.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'
              }`}>
                {listing.status}
              </span>
            </td>
            <td className="p-4 text-center font-medium text-slate-700">
              {listing.views_count || 0}
            </td>
            <td className="p-4 text-center font-bold text-emerald-600">
              {listing.whatsapp_leads_count || 0}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
```

#### 2. `src/app/actions/leads.ts` (no code change needed)
The server action already calls `supabase.rpc('increment_whatsapp_leads', { row_id: listingId })`. Once the SQL function is created, it will work.

#### 3. `src/app/listings/[id]/page.tsx` (no change needed)
View tracking already works at line 254. The parameter name is `row_id` and matches the existing function.

---

## Execution Order

1. Run the new migration SQL in Supabase SQL Editor
2. Update `DashboardTabs.tsx` with the WhatsApp leads card and breakdown table
3. Run `npm run lint`

## Verification
- Visit any listing → view count increments
- Click WhatsApp button → lead count increments
- Dashboard overview → shows total views, total WhatsApp leads, and per-listing breakdown
