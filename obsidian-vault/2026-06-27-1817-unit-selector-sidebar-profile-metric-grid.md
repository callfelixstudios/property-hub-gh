# Milestone Update

**Executed on:** 2026-06-27 at 18:17 GMT

## Summary

Interactive unit selector for property/land sizes, sidebar profile card, full metric normalization across the site, and redesigned detail page specs grid.

## Files Modified

- `src/components/listings/EditListingModal.tsx` — Added interactive unit dropdown (m²/Acres/Plots) to Property Size and Land Size inputs; added `extractLandData` parser for edit persistence; renamed `squareMeters` state to `propertySize`
- `src/app/post-space/page.tsx` — Added interactive unit dropdowns to residential, commercial, and land property size inputs; renamed state to `propertySize` + `sizeUnit` + `landUnit`
- `src/components/dashboard/SidebarProfile.tsx` — **New file.** Avatar display with hover-to-upload overlay, name display, wired to existing file input ref
- `src/components/dashboard/DashboardTabs.tsx` — Integrated SidebarProfile above nav rail; moved hidden file input outside tab content for cross-tab avatar upload
- `src/app/dashboard/saved/page.tsx` — Now fetches profile and passes `initialProfile` + `userEmail` to DashboardTabs (fixes disappearing sidebar profile on saved tab)
- `src/app/dashboard/layout.tsx` — Removed redundant `<h1>Dashboard</h1>` heading
- `src/app/listings/[id]/page.tsx` — Replaced `bg-slate-50` spec grid with emerald-accented Bedroom/Bathroom/Property Size grid; removed unused IconBed/IconBath/IconFurnish defs
- `src/app/page.tsx` — Homepage mock data: replaced "sqft" values with metric "m²"
- `src/components/PropertyCard.tsx` — Default area prop changed to "120 m²"; display format changed to `{area ? `${area} m²` : '—'}`
- `src/app/rentals/page.tsx` — `sqm` → `m²` in area display
- `src/app/sales/page.tsx` — `sqm` → `m²` in area display (2 spots)
- `src/app/actions/analytics.ts` — Minor type fix

## Data/UI Architecture State

- **land_size** column stores formatted strings: `"${number} ${unit}"` (e.g. "2 Plots", "650 m²", "1.5 Acres")
- **square_meters** column stores numeric m² values; Acres input is converted (× 4046.86) on submission
- **SidebarProfile** component renders inside `<aside>` above nav rail; uses same `fileInputRef`/`handleAvatarSelect` as Profile Settings tab
- Avatar file input moved outside tab content to `<main>` level for persistent DOM mount
- Saved listings page shares sidebar profile via `initialProfile` prop

## Next Steps

- (none — all outstanding items complete)
