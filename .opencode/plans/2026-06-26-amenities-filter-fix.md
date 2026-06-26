# Amenities Filter Fix

## Problem
1. Filter queries boolean columns (`has_generator`, `has_water_reservoir`, etc.) never written to
2. Form stores amenities as text strings in `amenities TEXT[]` — filter must use `.contains()`
3. "Prepaid Meter" and "Walled & Gated" aren't in the form's amenity list

## Files to Change (6)

### 1. `src/app/post-space/page.tsx`
**Add "Prepaid Meter" and "Walled & Gated" to `AMENITIES_LIST`** (lines 78-82)

Residential/commercial list (line 79):
```
was: ["Air Conditioning", "Standby Generator / Plant", "Solar Power System", "Water Reservoir (Polytank)", "24/7 Security", "Fitted Kitchen Cabinets"]
now: ["Air Conditioning", "Standby Generator / Plant", "Solar Power System", "Water Reservoir (Polytank)", "24/7 Security", "Fitted Kitchen Cabinets", "Prepaid Meter", "Walled & Gated"]
```

Land list (line 82) — add the two items that apply to land too:
```
was: ["Fenced / Walled Compound", "Tarred / Graded Road Access", "Electricity Grid Connected", "Water Pipe Connected", "Registered Indenture / Title Docs", "Non-Waterlogged Area"]
now: no change needed (these are already land-specific)
```

### 2. `src/components/listings/EditListingModal.tsx`
**Same change** — add to `AMENITIES_LIST` (lines 109-113)

### 3. `src/components/PropertyFilters.tsx`
**Replace the checkboxes and URL param reading** to use 8 amenities:

**URL param reading** (lines 57-60):
```
was:
  const generator = searchParams.get('generator') === 'true';
  const water = searchParams.get('water') === 'true';
  const meter = searchParams.get('meter') === 'true';
  const gated = searchParams.get('gated') === 'true';

now:
  const ac = searchParams.get('ac') === 'true';
  const generator = searchParams.get('generator') === 'true';
  const solar = searchParams.get('solar') === 'true';
  const water = searchParams.get('water') === 'true';
  const security = searchParams.get('security') === 'true';
  const kitchen = searchParams.get('kitchen') === 'true';
  const meter = searchParams.get('meter') === 'true';
  const gated = searchParams.get('gated') === 'true';
```

**Checkbox JSX** (lines 358-378):
Replace the 4-item checkbox array with the 8-item array, matching form strings:
```tsx
{[
  { id: 'ac', label: 'Air Conditioning', param: ac },
  { id: 'generator', label: 'Standby Generator / Plant', param: generator },
  { id: 'solar', label: 'Solar Power System', param: solar },
  { id: 'water', label: 'Water Reservoir (Polytank)', param: water },
  { id: 'security', label: '24/7 Security', param: security },
  { id: 'kitchen', label: 'Fitted Kitchen Cabinets', param: kitchen },
  { id: 'meter', label: 'Prepaid Meter', param: meter },
  { id: 'gated', label: 'Walled & Gated', param: gated },
].map((item) => (...))}
```

### 4. `src/app/sales/page.tsx`
**Replace amenity filter queries** (lines 73-77):

Read the new params (add alongside existing param reads):
```ts
const ac = searchParams.ac as string;
const generator = searchParams.generator as string;
const solar = searchParams.solar as string;
const water = searchParams.water as string;
const security = searchParams.security as string;
const kitchen = searchParams.kitchen as string;
const meter = searchParams.meter as string;
const gated = searchParams.gated as string;
```

Replace lines 75-78 with consolidated `.contains()` block:
```ts
const targetAmenities: string[] = [];
if (ac === 'true') targetAmenities.push('Air Conditioning');
if (generator === 'true') targetAmenities.push('Standby Generator / Plant');
if (solar === 'true') targetAmenities.push('Solar Power System');
if (water === 'true') targetAmenities.push('Water Reservoir (Polytank)');
if (security === 'true') targetAmenities.push('24/7 Security');
if (kitchen === 'true') targetAmenities.push('Fitted Kitchen Cabinets');
if (meter === 'true') targetAmenities.push('Prepaid Meter');
if (gated === 'true') targetAmenities.push('Walled & Gated');

if (targetAmenities.length > 0) {
  query = query.contains('amenities', targetAmenities);
}
```

Remove the old amenity variable reads (`generator`, `water`, `meter`, `gated` at the top).

### 5. `src/app/rentals/page.tsx`
**Same change** as sales — replace amenity filter (lines 90-96) with the same `.contains()` block.

### 6. `src/app/listings/[id]/page.tsx` (optional — consistency)
The Utilities & Extras section uses `row.generator_backup` and `row.solar_ready` (always false). These should match what's in `row.amenities`. Consider updating this section to check the amenities array instead, but this is a display-only issue and lower priority.

## ⚠️ String Warning
The filter `.contains()` values MUST match the EXACT strings stored in the form's `AMENITIES_LIST`. From reading the code:
- `"Water Reservoir (Polytank)"` — **parentheses**, NOT slash
- `"Fitted Kitchen Cabinets"` — **plural**, NOT singular

Using wrong strings = filter returns zero results for those amenities.

## Verification
1. Create a listing checking "Prepaid Meter" and "Walled & Gated"
2. On sales/rentals page, check those amenities in the filter
3. Verify the listing appears (`.contains()` requires ALL checked amenities)
4. Run `npm run lint`
