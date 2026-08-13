# Unified Properties Browser Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a `/properties` page mixing rentals and sales (with Rent/Buy/All toggle), and refactor `/rentals` + `/sales` onto one shared listings browser with working sort and pagination.

**Architecture:** One shared server component (`ListingsBrowser`) owns data fetching and the filter/grid/pagination layout; three thin route wrappers supply hero, metadata, and a `fixedType` ('rent' | 'sale' | undefined). A pure-helper module (`listingsQuery`) centralizes mode/sort/page resolution and the unified Supabase query, unit-tested with vitest. Cards are unified on the existing `PropertyCard`.

**Tech Stack:** Next.js 16 (App Router, server components), Supabase (postgrest-js via `@supabase/ssr`), Tailwind v4 (design tokens: navy-base, accent-gold, surface-primary), vitest for pure logic.

## Global Constraints

- **No DB schema changes, no migrations, no `drizzle`.** Single `listings` table, `transaction_type` enum `'rent' | 'sale'`.
- Public visibility gate everywhere: `.eq('status', 'active')` + `.eq('moderation_status', 'approved')`.
- URL filter param names must stay identical to today (posterRole, beds, baths, furnishing, litigationFree, region, neighborhood, propertyUse, propertyType, condition, parking_space, amenities slugs, search, minPrice, maxPrice) — external links keep working.
- Currency cookie name: `property_hub_currency` (values `GHS` | `USD`); price filter conversion via `convertFilterPriceToDb`.
- `type` param only has meaning on `/properties`; on `/rentals` and `/sales` the fixed type wins.
- Price sorting (`price_asc`/`price_desc`) is valid only when a single type is selected; in All mode those values are clamped to `newest`.
- In All mode, price filtering applies per column: `or(and(base_rent …),and(outright_price …))`.
- Do not add code comments unless the existing code style requires them.
- Verification commands: `npm run lint`, `npx tsc --noEmit`, `npm test` (vitest), `npm run build`.

---

### Task 1: Pure query helpers with vitest tests

**Files:**
- Create: `src/utils/listingsQuery.ts` (pure helpers only in this task)
- Test: `src/utils/listingsQuery.test.ts`
- Modify: `src/components/PropertyCard.tsx` (export the props interface)

**Interfaces:**
- Produces (used by Tasks 2, 4, 5):
  - `export type ListingsMode = 'rent' | 'sale' | 'all';`
  - `export type ListingsSort = 'newest' | 'views' | 'price_asc' | 'price_desc';`
  - `export const PAGE_SIZE = 12;`
  - `export function resolveMode(fixedType: 'rent' | 'sale' | undefined, typeParam: string | undefined): ListingsMode`
  - `export function resolveSort(raw: string | undefined, mode: ListingsMode): ListingsSort`
  - `export function clampPage(raw: string | string[] | undefined): number`
  - `export function buildPriceClauses(minGhs: number | null, maxGhs: number | null): { rent: string | null; sale: string | null }`

- [ ] **Step 1: Write the failing tests**

Create `src/utils/listingsQuery.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  buildPriceClauses,
  clampPage,
  PAGE_SIZE,
  resolveMode,
  resolveSort,
} from './listingsQuery';

describe('resolveMode', () => {
  it('fixedType wins over the type param', () => {
    expect(resolveMode('rent', 'sale')).toBe('rent');
    expect(resolveMode('sale', undefined)).toBe('sale');
  });

  it('uses the type param when there is no fixedType', () => {
    expect(resolveMode(undefined, 'rent')).toBe('rent');
    expect(resolveMode(undefined, 'sale')).toBe('sale');
  });

  it('defaults to all for missing or invalid values', () => {
    expect(resolveMode(undefined, undefined)).toBe('all');
    expect(resolveMode(undefined, 'all')).toBe('all');
    expect(resolveMode(undefined, 'foo')).toBe('all');
  });
});

describe('resolveSort', () => {
  it('defaults to newest for missing or unknown values', () => {
    expect(resolveSort(undefined, 'all')).toBe('newest');
    expect(resolveSort('bogus', 'rent')).toBe('newest');
  });

  it('returns views when requested in any mode', () => {
    expect(resolveSort('views', 'all')).toBe('views');
  });

  it('allows price sorts only in single-type modes', () => {
    expect(resolveSort('price_asc', 'rent')).toBe('price_asc');
    expect(resolveSort('price_desc', 'sale')).toBe('price_desc');
    expect(resolveSort('price_asc', 'all')).toBe('newest');
    expect(resolveSort('price_desc', 'all')).toBe('newest');
  });
});

describe('clampPage', () => {
  it('returns 1 for missing, invalid, and non-positive values', () => {
    expect(clampPage(undefined)).toBe(1);
    expect(clampPage('0')).toBe(1);
    expect(clampPage('-3')).toBe(1);
    expect(clampPage('abc')).toBe(1);
    expect(clampPage([])).toBe(1);
  });

  it('parses valid positive integers and arrays', () => {
    expect(clampPage('2')).toBe(2);
    expect(clampPage(['3'])).toBe(3);
  });
});

describe('buildPriceClauses', () => {
  it('builds one and() clause per price column for min+max', () => {
    expect(buildPriceClauses(100, 5000)).toEqual({
      rent: 'and(base_rent.gte.100,base_rent.lte.5000)',
      sale: 'and(outright_price.gte.100,outright_price.lte.5000)',
    });
  });

  it('handles single-sided ranges', () => {
    expect(buildPriceClauses(100, null)).toEqual({
      rent: 'and(base_rent.gte.100)',
      sale: 'and(outright_price.gte.100)',
    });
  });

  it('returns null for both columns when no price filter is set', () => {
    expect(buildPriceClauses(null, null)).toEqual({ rent: null, sale: null });
  });
});

describe('PAGE_SIZE', () => {
  it('is 12', () => {
    expect(PAGE_SIZE).toBe(12);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/utils/listingsQuery.test.ts`
Expected: FAIL — module `./listingsQuery` not found / cannot be resolved.

- [ ] **Step 3: Write the minimal implementation**

Create `src/utils/listingsQuery.ts` (pure helpers only; the Supabase fetch arrives in Task 2):

```ts
export type ListingsMode = 'rent' | 'sale' | 'all';

export type ListingsSort = 'newest' | 'views' | 'price_asc' | 'price_desc';

export const PAGE_SIZE = 12;

export function resolveMode(
  fixedType: 'rent' | 'sale' | undefined,
  typeParam: string | undefined
): ListingsMode {
  if (fixedType === 'rent' || fixedType === 'sale') return fixedType;
  if (typeParam === 'rent' || typeParam === 'sale') return typeParam;
  return 'all';
}

export function resolveSort(raw: string | undefined, mode: ListingsMode): ListingsSort {
  if (raw === 'views') return 'views';
  if (mode !== 'all' && (raw === 'price_asc' || raw === 'price_desc')) return raw;
  return 'newest';
}

export function clampPage(raw: string | string[] | undefined): number {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const parsed = value ? Number.parseInt(value, 10) : NaN;
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return parsed;
}

export function buildPriceClauses(
  minGhs: number | null,
  maxGhs: number | null
): { rent: string | null; sale: string | null } {
  const forColumn = (column: string): string | null => {
    const parts: string[] = [];
    if (minGhs !== null) parts.push(`${column}.gte.${minGhs}`);
    if (maxGhs !== null) parts.push(`${column}.lte.${maxGhs}`);
    return parts.length > 0 ? `and(${parts.join(',')})` : null;
  };
  return { rent: forColumn('base_rent'), sale: forColumn('outright_price') };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/utils/listingsQuery.test.ts`
Expected: 6 describe blocks PASS.

- [ ] **Step 5: Export PropertyCardProps**

In `src/components/PropertyCard.tsx`, change `interface PropertyCardProps {` (line 7) to `export interface PropertyCardProps {`.

- [ ] **Step 6: Commit**

```bash
git add src/utils/listingsQuery.ts src/utils/listingsQuery.test.ts src/components/PropertyCard.tsx
git commit -m "feat: pure listing query helpers with vitest tests"
```

---

### Task 2: Unified Supabase query (`fetchListingsPage`)

**Files:**
- Modify: `src/utils/listingsQuery.ts` (append the server function below the pure helpers)

**Interfaces:**
- Consumes: `resolveMode`, `resolveSort`, `clampPage`, `buildPriceClauses`, `PAGE_SIZE` (Task 1); `PropertyCardProps` type (Task 1); existing utils `createClient`, `RESIDENTIAL_CATEGORIES`, `COMMERCIAL_CATEGORIES`, `normalizeRegionForDb`, `formatRegionForUi`, `convertFilterPriceToDb`, `buildSearchFilter`.
- Produces (used by Task 5):
  - `export interface ListingsPageResult { listings: PropertyCardProps[]; total: number; page: number; pageCount: number; mode: ListingsMode; }`
  - `export async function fetchListingsPage(searchParams: { [key: string]: string | string[] | undefined }, opts: { fixedType?: 'rent' | 'sale'; displayCurrency: string }): Promise<ListingsPageResult>`

- [ ] **Step 1: Append the fetch function**

Add to the top of `src/utils/listingsQuery.ts`:

```ts
import { createClient } from '@/utils/supabase/server';
import { RESIDENTIAL_CATEGORIES, COMMERCIAL_CATEGORIES } from '@/data/propertyCategories';
import { normalizeRegionForDb, formatRegionForUi } from '@/utils/regionMapper';
import { convertFilterPriceToDb } from '@/utils/currency';
import { buildSearchFilter } from '@/utils/searchQuery';
import type { PropertyCardProps } from '@/components/PropertyCard';
```

Append to the bottom of `src/utils/listingsQuery.ts`:

```ts
export interface ListingsPageResult {
  listings: PropertyCardProps[];
  total: number;
  page: number;
  pageCount: number;
  mode: ListingsMode;
}

interface ListingRow {
  id: string;
  title: string | null;
  transaction_type: 'rent' | 'sale';
  category: string;
  neighborhood: string | null;
  region: string;
  base_rent: number | null;
  outright_price: number | null;
  currency: string | null;
  rent_advance_months: number | null;
  advance_period: string | null;
  service_charge: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  square_meters: number | null;
  media_urls: string[] | null;
  safemove_active: boolean | null;
  is_verified: boolean | null;
  viewing_fee: number | null;
  has_flood_resilience: boolean | null;
  has_solar_backup: boolean | null;
  has_borehole_system: boolean | null;
}

function formatCategory(cat?: string) {
  if (!cat) return 'Apartment';
  return cat
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function mapRowToCard(row: ListingRow): PropertyCardProps {
  const isRent = row.transaction_type === 'rent';
  return {
    id: row.id,
    imageSrc: row.media_urls?.[0] || '/property-1.png',
    title:
      row.title ||
      `${formatCategory(row.category)} in ${row.neighborhood || row.region || 'Ghana'}`,
    rawPrice: Number(isRent ? row.base_rent : row.outright_price) || 0,
    currency: row.currency || 'GHS',
    priceSuffix: isRent ? '/mo' : '',
    location:
      [row.neighborhood, formatCategory(row.region)].filter(Boolean).join(', ') || 'Ghana',
    beds: row.bedrooms || 0,
    baths: row.bathrooms || 0,
    area: row.square_meters != null ? String(row.square_meters) : undefined,
    badge: row.safemove_active ? 'safemove' : undefined,
    category: row.category || 'Apartment',
    isVerified: row.is_verified || false,
    is_rental: isRent,
    base_rent: row.base_rent ?? undefined,
    outright_price: row.outright_price ?? undefined,
    service_charge: row.service_charge ?? undefined,
    advance_period: row.advance_period ?? undefined,
    rent_advance_months: row.rent_advance_months ?? undefined,
    viewing_fee: row.viewing_fee ?? undefined,
    has_flood_resilience: row.has_flood_resilience ?? false,
    has_solar_backup: row.has_solar_backup ?? false,
    has_borehole_system: row.has_borehole_system ?? false,
  };
}

export async function fetchListingsPage(
  searchParams: { [key: string]: string | string[] | undefined },
  opts: { fixedType?: 'rent' | 'sale'; displayCurrency: string }
): Promise<ListingsPageResult> {
  const mode = resolveMode(opts.fixedType, searchParams.type as string | undefined);
  const page = clampPage(searchParams.page);
  const sort = resolveSort(searchParams.sort as string | undefined, mode);

  const supabase = await createClient();
  let query = supabase
    .from('listings')
    .select('*', { count: 'exact' })
    .eq('status', 'active')
    .eq('moderation_status', 'approved');

  if (mode === 'all') {
    query = query.in('transaction_type', ['rent', 'sale']);
  } else {
    query = query.eq('transaction_type', mode);
  }

  const minPriceGhs = convertFilterPriceToDb(searchParams.minPrice, opts.displayCurrency);
  const maxPriceGhs = convertFilterPriceToDb(searchParams.maxPrice, opts.displayCurrency);

  if (mode === 'all') {
    const { rent, sale } = buildPriceClauses(minPriceGhs, maxPriceGhs);
    if (rent && sale) query = query.or(`${rent},${sale}`);
    else if (rent) query = query.or(rent);
    else if (sale) query = query.or(sale);
  } else if (minPriceGhs !== null || maxPriceGhs !== null) {
    const priceColumn = mode === 'rent' ? 'base_rent' : 'outright_price';
    if (minPriceGhs !== null) query = query.gte(priceColumn, minPriceGhs);
    if (maxPriceGhs !== null) query = query.lte(priceColumn, maxPriceGhs);
  }

  const posterRole = searchParams.posterRole as string;
  const beds = searchParams.beds as string;
  const baths = searchParams.baths as string;
  const furnishing = searchParams.furnishing as string;
  const litigationFree = searchParams.litigationFree as string;
  const region = searchParams.region as string;
  const neighborhood = searchParams.neighborhood as string;
  const propertyUse = searchParams.propertyUse as string;
  const propertyType = searchParams.propertyType as string;
  const condition = searchParams.condition as string;
  const parkingSpace = searchParams.parking_space as string;
  const ac = searchParams.ac as string;
  const generator = searchParams.generator as string;
  const solar = searchParams.solar as string;
  const water = searchParams.water as string;
  const security = searchParams.security as string;
  const kitchen = searchParams.kitchen as string;
  const meter = searchParams.meter as string;
  const gated = searchParams.gated as string;

  if (posterRole && posterRole !== 'all') query = query.eq('poster_role', posterRole);
  if (beds) query = query.gte('bedrooms', beds);
  if (baths) query = query.gte('bathrooms', baths);
  if (furnishing) query = query.eq('furnishing_status', furnishing);
  if (litigationFree === 'true') query = query.eq('is_litigation_free', true);
  if (region && region !== 'All') {
    const dbSnakeRegion = normalizeRegionForDb(region);
    const uiTitleRegion = formatRegionForUi(dbSnakeRegion);
    if (dbSnakeRegion) {
      query = query.in('region', [region, dbSnakeRegion, uiTitleRegion]);
    } else {
      query = query.ilike('region', `%${region}%`);
    }
  }
  if (neighborhood) query = query.ilike('neighborhood', `%${neighborhood}%`);

  if (propertyType && propertyType !== 'All') {
    query = query.eq('category', propertyType);
  } else if (propertyUse === 'Residential') {
    query = query.in('category', RESIDENTIAL_CATEGORIES);
  } else if (propertyUse === 'Commercial') {
    query = query.in('category', COMMERCIAL_CATEGORIES);
  }
  if (condition && condition !== 'any') query = query.eq('condition', condition);
  if (parkingSpace && parkingSpace !== 'any') query = query.eq('parking_space', parkingSpace);
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

  const search = buildSearchFilter(searchParams.search as string);
  if (search) query = query.or(search);

  if (sort === 'views') {
    query = query.order('views', { ascending: false });
  } else if (sort === 'price_asc') {
    query = query.order(mode === 'rent' ? 'base_rent' : 'outright_price', { ascending: true });
  } else if (sort === 'price_desc') {
    query = query.order(mode === 'rent' ? 'base_rent' : 'outright_price', { ascending: false });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  const from = (page - 1) * PAGE_SIZE;
  query = query.range(from, from + PAGE_SIZE - 1);

  const { data, error, count } = await query;
  if (error) {
    console.error('Error fetching listings:', error);
    return { listings: [], total: 0, page: 1, pageCount: 0, mode };
  }

  const listings = (data ?? []).map((row) => mapRowToCard(row as ListingRow));
  const total = count ?? listings.length;
  return {
    listings,
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    mode,
  };
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: PASS, no errors.

- [ ] **Step 3: Run existing tests to confirm nothing broke**

Run: `npm test`
Expected: all tests PASS (existing suites + Task 1 suite).

- [ ] **Step 4: Commit**

```bash
git add src/utils/listingsQuery.ts
git commit -m "feat: unified listings query with pagination, sort, and per-type price filters"
```

---

### Task 3: SortSelect and PaginationControls components

**Files:**
- Create: `src/components/listings/SortSelect.tsx`
- Create: `src/components/listings/PaginationControls.tsx`

**Interfaces:**
- Produces (used by Task 5):
  - `export interface SortOption { value: string; label: string; }`
  - `export default function SortSelect({ options, current }: { options: SortOption[]; current: string })` — client component ('use client')
  - `export default function PaginationControls({ page, pageCount, searchParams }: { page: number; pageCount: number; searchParams: { [key: string]: string | string[] | undefined } })` — server component

- [ ] **Step 1: Create SortSelect**

Create `src/components/listings/SortSelect.tsx`:

```tsx
'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export interface SortOption {
  value: string;
  label: string;
}

export default function SortSelect({
  options,
  current,
}: {
  options: SortOption[];
  current: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <select
      value={current}
      onChange={(e) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('sort', e.target.value);
        params.delete('page');
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      }}
      className="bg-white border border-gray-200 text-sm rounded-sm px-3 py-2 text-navy-base outline-none cursor-pointer hover:border-navy-light transition-colors"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
```

- [ ] **Step 2: Create PaginationControls**

Create `src/components/listings/PaginationControls.tsx`:

```tsx
import Link from 'next/link';

interface PaginationControlsProps {
  page: number;
  pageCount: number;
  searchParams: { [key: string]: string | string[] | undefined };
}

function hrefFor(page: number, searchParams: PaginationControlsProps['searchParams']): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (key === 'page' || value === undefined) continue;
    const v = Array.isArray(value) ? value[0] : value;
    if (v) params.set(key, v);
  }
  params.set('page', String(page));
  return `?${params.toString()}`;
}

export default function PaginationControls({
  page,
  pageCount,
  searchParams,
}: PaginationControlsProps) {
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1);
  return (
    <nav className="flex items-center justify-center gap-2 mt-10" aria-label="Pagination">
      {page > 1 && (
        <Link
          href={hrefFor(page - 1, searchParams)}
          className="px-4 py-2 text-sm font-semibold text-navy-base bg-white border border-gray-200 rounded-sm hover:border-navy-light transition-colors"
        >
          Previous
        </Link>
      )}
      {pages.map((p) => (
        <Link
          key={p}
          href={hrefFor(p, searchParams)}
          aria-current={p === page ? 'page' : undefined}
          className={`px-4 py-2 text-sm font-semibold rounded-sm transition-colors ${
            p === page
              ? 'bg-navy-base text-white'
              : 'text-navy-base bg-white border border-gray-200 hover:border-navy-light'
          }`}
        >
          {p}
        </Link>
      ))}
      {page < pageCount && (
        <Link
          href={hrefFor(page + 1, searchParams)}
          className="px-4 py-2 text-sm font-semibold text-navy-base bg-white border border-gray-200 rounded-sm hover:border-navy-light transition-colors"
        >
          Next
        </Link>
      )}
    </nav>
  );
}
```

- [ ] **Step 3: Type-check and lint**

Run: `npx tsc --noEmit; npm run lint`
Expected: PASS, no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/listings/SortSelect.tsx src/components/listings/PaginationControls.tsx
git commit -m "feat: sort select and pagination controls components"
```

---

### Task 4: PropertyFilters — mode support and page reset

**Files:**
- Modify: `src/components/PropertyFilters.tsx`

**Interfaces:**
- Consumes: nothing new (mode derived internally from pathname + `type` param).
- Produces: behavior change consumed by Tasks 5–8 — `PropertyFilters` now supports `rent`, `sale`, and `all` modes.

- [ ] **Step 1: Replace the context derivation**

In `src/components/PropertyFilters.tsx`, replace line 55:

```ts
  const isRentalContext = pathname.includes('rentals');
```

with (note: `isRentalContext` is fully removed — Steps 3 and 4 replace its remaining usages):

```ts
  type FilterMode = 'rent' | 'sale' | 'all';

  const typeParam = searchParams.get('type');
  const isSalesContext = pathname.includes('sales');
  const filterMode: FilterMode = pathname.includes('rentals')
    ? 'rent'
    : isSalesContext
      ? 'sale'
      : typeParam === 'rent' || typeParam === 'sale'
        ? typeParam
        : 'all';
```

- [ ] **Step 2: Update price bounds for all modes**

Replace the `maxBounds`/`stepValue` block (current lines 57–76) with:

```ts
  let maxBounds = 0;
  let stepValue = 0;

  if (filterMode === 'rent') {
    if (displayCurrency === 'GHS') {
      maxBounds = 50000;
      stepValue = 500;
    } else {
      maxBounds = 5000;
      stepValue = 50;
    }
  } else if (filterMode === 'sale') {
    if (displayCurrency === 'GHS') {
      maxBounds = 10000000;
      stepValue = 50000;
    } else {
      maxBounds = 1000000;
      stepValue = 5000;
    }
  } else {
    if (displayCurrency === 'GHS') {
      maxBounds = 10000000;
      stepValue = 50000;
    } else {
      maxBounds = 1000000;
      stepValue = 5000;
    }
  }
```

- [ ] **Step 3: Update the price label**

Replace the price section heading (current line 311):

```tsx
          {isRentalContext ? `Monthly Rent (${displayCurrency})` : `Total Price (${displayCurrency})`}
```

with:

```tsx
          {filterMode === 'rent'
            ? `Monthly Rent (${displayCurrency})`
            : filterMode === 'sale'
              ? `Total Price (${displayCurrency})`
              : `Price (Rent: /mo · Sale: total)`}
```

- [ ] **Step 4: Update litigation-free visibility rule**

Replace the sales-only checkbox guard (current line 415):

```tsx
      {!isRentalContext && (
```

with:

```tsx
      {filterMode !== 'rent' && (
```

- [ ] **Step 5: Reset the page param on any filter change**

Inside `updateFilters` (current lines 92–104), after the `Object.entries(updates).forEach(...)` loop and before `router.push`, insert:

```ts
    params.delete('page');
```

- [ ] **Step 6: Type-check and lint**

Run: `npx tsc --noEmit; npm run lint`
Expected: PASS, no errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/PropertyFilters.tsx
git commit -m "feat: PropertyFilters supports all/rent/sale modes and resets page on filter change"
```

---

### Task 5: ListingsBrowser shared server component

**Files:**
- Create: `src/components/listings/ListingsBrowser.tsx`

**Interfaces:**
- Consumes: `fetchListingsPage`, `resolveMode`, `resolveSort` (Tasks 1–2); `PropertyFilters` (Task 4); `SortSelect`, `SortOption`, `PaginationControls` (Task 3); `PropertyCard`; `cookies()` from `next/headers`.
- Produces (used by Tasks 6–8):
  - `interface ListingsBrowserProps { searchParams: { [key: string]: string | string[] | undefined }; fixedType?: 'rent' | 'sale'; topBanner?: React.ReactNode; }`
  - `export default async function ListingsBrowser({ searchParams, fixedType, topBanner }: ListingsBrowserProps)`

- [ ] **Step 1: Create the component**

Create `src/components/listings/ListingsBrowser.tsx`:

```tsx
import Link from 'next/link';
import { Suspense } from 'react';
import { cookies } from 'next/headers';
import PropertyFilters from '@/components/PropertyFilters';
import PropertyCard from '@/components/PropertyCard';
import SortSelect, { type SortOption } from '@/components/listings/SortSelect';
import PaginationControls from '@/components/listings/PaginationControls';
import {
  fetchListingsPage,
  resolveMode,
  resolveSort,
} from '@/utils/listingsQuery';

interface ListingsBrowserProps {
  searchParams: { [key: string]: string | string[] | undefined };
  fixedType?: 'rent' | 'sale';
  topBanner?: React.ReactNode;
}

export default async function ListingsBrowser({
  searchParams,
  fixedType,
  topBanner,
}: ListingsBrowserProps) {
  const cookieStore = await cookies();
  const displayCurrency = cookieStore.get('property_hub_currency')?.value || 'GHS';
  const mode = resolveMode(fixedType, searchParams.type as string | undefined);
  const sort = resolveSort(searchParams.sort as string | undefined, mode);
  const { listings, total, page, pageCount } = await fetchListingsPage(searchParams, {
    fixedType,
    displayCurrency,
  });

  const sortOptions: SortOption[] = [
    { value: 'newest', label: 'Sort by: Newest' },
    { value: 'views', label: 'Sort by: Most Viewed' },
    ...(mode === 'all'
      ? []
      : [
          { value: 'price_asc', label: 'Sort by: Lowest Price' },
          { value: 'price_desc', label: 'Sort by: Highest Price' },
        ]),
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row gap-8 items-start">
      <PropertyFilters />

      <main className="flex-1 w-full pb-20">
        {topBanner}

        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-500 font-medium">
            Showing {total} {total === 1 ? 'property' : 'properties'}
          </p>
          <Suspense fallback={null}>
            <SortSelect options={sortOptions} current={sort} />
          </Suspense>
        </div>

        {listings.length > 0 ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {listings.map((listing) => (
                <PropertyCard key={listing.id} {...listing} />
              ))}
            </div>
            {pageCount > 1 && (
              <PaginationControls page={page} pageCount={pageCount} searchParams={searchParams} />
            )}
          </>
        ) : (
          <div className="bg-white rounded-md p-6 shadow-ambient border border-gray-100 flex flex-col items-center text-center py-14">
            <h3 className="font-bold text-navy-base mb-2">No properties match your filters</h3>
            <p className="text-sm text-gray-500 mb-6 max-w-sm">
              Try adjusting or clearing your filters to see more listings.
            </p>
            <Link
              href={fixedType === 'rent' ? '/rentals' : fixedType === 'sale' ? '/sales' : '/properties'}
              className="inline-flex items-center px-6 py-3 bg-navy-base text-white font-bold rounded-sm hover:bg-navy-light transition-colors"
            >
              Reset Filters
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Type-check and lint**

Run: `npx tsc --noEmit; npm run lint`
Expected: PASS, no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/listings/ListingsBrowser.tsx
git commit -m "feat: shared ListingsBrowser server component with filters, sort, grid, pagination"
```

---

### Task 6: /properties route with Rent/Buy/All toggle

**Files:**
- Create: `src/app/properties/page.tsx`

**Interfaces:**
- Consumes: `ListingsBrowser` (Task 5), `JsonLd` + `getBreadcrumbSchema` from `@/components/seo/JsonLd`, `Footer`.
- Produces: public route `/properties` with `?type=rent|sale` support (consumed by Task 9 CTA links).

- [ ] **Step 1: Create the route**

Create `src/app/properties/page.tsx`:

```tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import ListingsBrowser from '@/components/listings/ListingsBrowser';
import { JsonLd, getBreadcrumbSchema } from '@/components/seo/JsonLd';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'All Properties for Rent & Sale in Ghana | Property Hub GH',
  description:
    'Browse every verified property on Property Hub GH — apartments, houses, single rooms, land and commercial spaces for rent or sale across all regions of Ghana.',
  alternates: {
    canonical: 'https://www.propertyhubgh.com/properties',
  },
  openGraph: {
    title: 'All Properties for Rent & Sale in Ghana | Property Hub GH',
    description: 'Browse every verified property in Ghana — rentals and sales on Property Hub GH.',
    url: 'https://www.propertyhubgh.com/properties',
    images: ['https://www.propertyhubgh.com/opengraph-image'],
  },
};

type SearchParams = { [key: string]: string | string[] | undefined };
type ToggleType = 'all' | 'rent' | 'sale';

function toggleHref(searchParams: SearchParams, type: ToggleType): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (key === 'type' || key === 'page' || value === undefined) continue;
    const v = Array.isArray(value) ? value[0] : value;
    if (v) params.set(key, v);
  }
  if (type !== 'all') params.set('type', type);
  return params.toString() ? `/properties?${params.toString()}` : '/properties';
}

export default async function PropertiesPage(props: {
  searchParams: Promise<SearchParams>;
}) {
  const searchParams = await props.searchParams;
  const currentType: ToggleType =
    searchParams.type === 'rent' || searchParams.type === 'sale' ? searchParams.type : 'all';

  const tabs: { id: ToggleType; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'rent', label: 'Rent' },
    { id: 'sale', label: 'Buy' },
  ];

  return (
    <div className="w-full min-h-screen bg-surface-primary flex flex-col">
      <JsonLd
        data={getBreadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'Properties', url: '/properties' },
        ])}
      />

      <div className="bg-navy-base pt-36 pb-20 md:pt-44 md:pb-28 px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
            Properties in Ghana
          </h1>
          <p className="text-white/80 max-w-2xl mb-10">
            Browse every verified property on Property Hub GH — apartments, houses,
            single rooms, land and commercial spaces for rent or sale across Ghana.
          </p>
          <div className="inline-flex rounded-xl bg-white/10 p-1 gap-1">
            {tabs.map((tab) => (
              <Link
                key={tab.id}
                href={toggleHref(searchParams, tab.id)}
                className={`px-6 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                  currentType === tab.id
                    ? 'bg-white text-navy-base shadow-sm'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <ListingsBrowser searchParams={searchParams} />
      <Footer />
    </div>
  );
}
```

- [ ] **Step 2: Type-check and lint**

Run: `npx tsc --noEmit; npm run lint`
Expected: PASS, no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/properties/page.tsx
git commit -m "feat: /properties route with Rent/Buy/All toggle and SEO metadata"
```

---

### Task 7: Refactor /rentals onto ListingsBrowser

**Files:**
- Modify: `src/app/rentals/page.tsx` (rewrite; keep metadata block verbatim)

**Interfaces:**
- Consumes: `ListingsBrowser` (Task 5).
- Produces: `/rentals` with identical hero + "Request a Space" banner, now with working sort/pagination and unified cards.

- [ ] **Step 1: Rewrite the page**

Replace the entire contents of `src/app/rentals/page.tsx` with:

```tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import ListingsBrowser from '@/components/listings/ListingsBrowser';
import { JsonLd, getBreadcrumbSchema } from '@/components/seo/JsonLd';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Apartments & Rooms for Rent in Ghana | Property Hub GH',
  description:
    'Browse verified apartments, student hostels, single rooms, and chamber & halls for rent across Accra, Kumasi, East Legon, Cantonments & all regions of Ghana.',
  alternates: {
    canonical: 'https://www.propertyhubgh.com/rentals',
  },
  openGraph: {
    title: 'Apartments & Rooms for Rent in Ghana | Property Hub GH',
    description: 'Browse verified apartments, student hostels, single rooms, and chamber & halls for rent in Ghana.',
    url: 'https://www.propertyhubgh.com/rentals',
    images: ['https://www.propertyhubgh.com/opengraph-image'],
  },
};

export default async function RentalsPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;

  const requestSpaceBanner = (
    <div className="mb-8 bg-emerald-50 border border-emerald-100 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
      <div>
        <h3 className="text-lg font-bold text-emerald-900 mb-1">
          Can&apos;t find what you&apos;re looking for?
        </h3>
        <p className="text-emerald-700 text-sm">
          Post a request on our Seeker Notice Board and let property owners come to you!
        </p>
      </div>
      <Link
        href="/request-space"
        className="shrink-0 px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
      >
        Request a Space
      </Link>
    </div>
  );

  return (
    <div className="w-full min-h-screen bg-surface-primary flex flex-col">
      <JsonLd
        data={getBreadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'Rentals', url: '/rentals' },
        ])}
      />

      <div className="bg-navy-base pt-36 pb-20 md:pt-44 md:pb-28 px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
            Rentals in Ghana
          </h1>
          <p className="text-white/80 max-w-2xl mb-10">
            Find verified apartments, single rooms, and houses for rent with fully
            transparent terms and SafeMove escrow protection.
          </p>
        </div>
      </div>

      <ListingsBrowser searchParams={searchParams} fixedType="rent" topBanner={requestSpaceBanner} />
      <Footer />
    </div>
  );
}
```

- [ ] **Step 2: Verify nothing else referenced the removed helpers**

Run: `npx tsc --noEmit`
Expected: PASS — `formatAdvanceDuration`, `formatCategory`, `fetchRentalListings`, and the `Listing`/`RentalListingRow` interfaces are gone and unused.

- [ ] **Step 3: Lint and test**

Run: `npm run lint; npm test`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/app/rentals/page.tsx
git commit -m "refactor: rentals page uses shared ListingsBrowser"
```

---

### Task 8: Refactor /sales onto ListingsBrowser

**Files:**
- Modify: `src/app/sales/page.tsx` (rewrite; keep metadata block verbatim)

**Interfaces:**
- Consumes: `ListingsBrowser` (Task 5).
- Produces: `/sales` with identical hero, now with working sort/pagination and unified cards (sale cards show outright price via PropertyCard, no `/mo` suffix).

- [ ] **Step 1: Rewrite the page**

Replace the entire contents of `src/app/sales/page.tsx` with:

```tsx
import type { Metadata } from 'next';
import ListingsBrowser from '@/components/listings/ListingsBrowser';
import { JsonLd, getBreadcrumbSchema } from '@/components/seo/JsonLd';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Houses & Litigation-Free Land for Sale in Ghana | Property Hub GH',
  description:
    'Explore verified land plots, uncompleted structures, and luxury estate homes for sale in East Legon, Cantonments, Kumasi, and across Ghana.',
  alternates: {
    canonical: 'https://www.propertyhubgh.com/sales',
  },
  openGraph: {
    title: 'Houses & Litigation-Free Land for Sale in Ghana | Property Hub GH',
    description: 'Explore verified land plots, uncompleted structures, and luxury estate homes for sale in Ghana.',
    url: 'https://www.propertyhubgh.com/sales',
    images: ['https://www.propertyhubgh.com/opengraph-image'],
  },
};

export default async function SalesPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;

  return (
    <div className="w-full min-h-screen bg-surface-primary flex flex-col">
      <JsonLd
        data={getBreadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'Sales', url: '/sales' },
        ])}
      />

      <div className="bg-navy-base pt-36 pb-20 md:pt-44 md:pb-28 px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
            Properties for Sale
          </h1>
          <p className="text-white/80 max-w-2xl mb-10">
            Acquire premium real estate in Ghana. We verify title documents and land
            registry registrations so you can invest with absolute confidence.
          </p>
        </div>
      </div>

      <ListingsBrowser searchParams={searchParams} fixedType="sale" />
      <Footer />
    </div>
  );
}
```

- [ ] **Step 2: Type-check and lint**

Run: `npx tsc --noEmit; npm run lint`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/app/sales/page.tsx
git commit -m "refactor: sales page uses shared ListingsBrowser"
```

---

### Task 9: Align homepage CTA and SearchWidget

**Files:**
- Modify: `src/app/page.tsx` (two hrefs)
- Modify: `src/components/SearchWidget.tsx` (submit target)

**Interfaces:**
- Consumes: `/properties` route (Task 6).
- Produces: all homepage entry points now point at `/properties`; SearchWidget sends `type` per active tab.

- [ ] **Step 1: Homepage "View All Properties" CTA**

In `src/app/page.tsx`, line 173: change `href="/rentals"` to `href="/properties"` (inside the "View All Properties" Link at lines 172–180).

- [ ] **Step 2: Homepage empty-state button**

In `src/app/page.tsx`, line 196: change `href="/rentals"` to `href="/properties"` (inside the "Browse Rentals" Link at lines 195–200). Keep the button text "Browse Rentals" unchanged unless the empty-state copy is also updated — update the paragraph text at line 193 from "Browse rentals to see what's currently live." to "Browse all properties to see what's currently live." and keep the button label "Browse Rentals".

- [ ] **Step 3: SearchWidget tab-aware submit**

In `src/components/SearchWidget.tsx`, replace the form `onSubmit` (lines 32–36):

```tsx
        onSubmit={(e) => {
          e.preventDefault();
          const q = query.trim();
          if (q) router.push("/rentals?search=" + encodeURIComponent(q));
        }}
```

with:

```tsx
        onSubmit={(e) => {
          e.preventDefault();
          const q = query.trim();
          if (!q) return;
          const params = new URLSearchParams();
          if (activeTab === "rent") params.set("type", "rent");
          if (activeTab === "buy") params.set("type", "sale");
          params.set("search", q);
          router.push(`/properties?${params.toString()}`);
        }}
```

- [ ] **Step 4: Type-check and lint**

Run: `npx tsc --noEmit; npm run lint`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx src/components/SearchWidget.tsx
git commit -m "feat: point homepage CTA and search widget at /properties"
```

---

### Task 10: Sitemap entry and full verification

**Files:**
- Modify: `src/utils/sitemapEntries.ts`

- [ ] **Step 1: Add /properties to static sitemap entries**

In `src/utils/sitemapEntries.ts`, after the `/sales` line (line 14), insert:

```ts
  { url: '/properties', lastModified: '2026-08-13T00:00:00.000Z' },
```

- [ ] **Step 2: Run the full verification suite**

Run: `npm run lint; npx tsc --noEmit; npm test`
Expected: all PASS.

- [ ] **Step 3: Build the app**

Run: `npm run build`
Expected: build succeeds. The `/properties` route appears in the route list, and `/rentals`, `/sales` compile with the shared browser.

- [ ] **Step 4: Manual QA checklist**

With `npm run dev` running against the live Supabase project, verify:

- [ ] `/properties` loads mixed rent + sale listings; default All tab active.
- [ ] Toggle to Rent → only rent listings, `?type=rent` in URL; toggle to Buy → only sales. Existing filters (e.g. `?region=Greater%20Accra`) survive the toggle.
- [ ] On All: sort dropdown shows only Newest/Most Viewed; `?sort=price_asc` in the URL silently falls back to newest.
- [ ] On Rent/Buy: price sort appears and works (base_rent / outright_price).
- [ ] Price filter: on All, a rent listing with base_rent 3,000 and a sale listing with outright_price 4,000,000 both match `minPrice=2000`; a sale listing at 500 doesn't.
- [ ] Pagination: with >12 matching listings, page 2 renders 12-per-page, prev/next and numbered links preserve all other params; `?page=abc` renders page 1; `?page=99` shows the empty state with a Reset Filters link back to `/properties`.
- [ ] Changing any sidebar filter resets `page` to 1.
- [ ] `/rentals` and `/sales`: same filter param behavior as before the refactor (spot-check region, propertyUse, amenities, search, minPrice), new sort dropdown works, pagination appears when >12 results, cards are the unified PropertyCard style.
- [ ] Homepage "View All Properties" and empty-state button go to `/properties`.
- [ ] SearchWidget: Rent tab submit → `/properties?type=rent&search=…`; Buy tab → `/properties?type=sale&search=…`; SafeMove tab → `/properties?search=…`.
- [ ] `/properties` renders in `sitemap.xml` output.

- [ ] **Step 5: Commit**

```bash
git add src/utils/sitemapEntries.ts
git commit -m "feat: add /properties to sitemap"
```