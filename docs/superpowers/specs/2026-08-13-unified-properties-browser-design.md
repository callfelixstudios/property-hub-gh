# Unified Properties Browser — Design Spec

**Date:** 2026-08-13
**Status:** Approved (design review)
**Feature branch target:** /properties combined listings page + shared listings browser

## 1. Problem Statement

The homepage "View All Properties" CTA (src/app/page.tsx:173) links to `/rentals`,
which only shows rental listings — the CTA is misleading. There is no page that
shows both rentals and sales. Additionally:

- `/rentals` and `/sales` duplicate ~100 lines of inline card JSX each instead of
  using the shared `PropertyCard`.
- Both index pages have an inert sort `<select>` (no onChange) and no pagination.
- The hero `SearchWidget` "Buy" tab is cosmetic — it always submits to `/rentals`.

## 2. Goals

1. New `/properties` page showing a mix of rental and sale listings, with a
   Rent / Buy / All toggle.
2. One shared listings browser used by `/properties`, `/rentals`, `/sales`.
3. Working sort + pagination on all three pages.
4. Align related CTAs (homepage button, empty state, SearchWidget).
5. No database/schema changes — single `listings` table already supports this via
   `transaction_type` enum (`'rent'` | `'sale'`).

## 3. Architecture

### 3.1 New shared server component: `src/components/listings/ListingsBrowser.tsx`

Owns all data fetching and renders the two-column layout:

```
<aside>  PropertyFilters (client)
<main>   [topBanner] (optional)
         toolbar: "Showing N properties" + SortSelect
         grid: PropertyCard x N
         pagination: Link-based controls
```

Props:

```ts
interface ListingsBrowserProps {
  searchParams: { [key: string]: string | string[] | undefined };
  fixedType?: 'rent' | 'sale';          // set by /rentals and /sales wrappers
  topBanner?: React.ReactNode;          // rentals "Request a Space" banner
}
```

- Reads the `property_hub_currency` cookie directly (same pattern as current pages).
- `fixedType` wins over any `?type=` param (ignore `type` on /rentals and /sales).

### 3.2 Route wrappers (thin)

Each keeps its existing hero header, `metadata`, and breadcrumb JSON-LD; fetches
nothing itself.

| Route | Hero | Renders |
|---|---|---|
| `/properties` (new) | Navy hero + **Rent / Buy / All toggle chips** | `ListingsBrowser` |
| `/rentals` | existing hero | `ListingsBrowser fixedType="rent" topBanner={<RequestASpaceBanner/>}` |
| `/sales` | existing hero | `ListingsBrowser fixedType="sale"` |

- Toggle chips on /properties are plain `<Link>`s that preserve all other search
  params and set `type=rent | type=sale | (no type)`. Active state from `?type`.
- The inline card JSX in `/rentals` and `/sales` is deleted; both pages render
  `PropertyCard` via the shared browser. Visual result: cards adopt the unified
  `PropertyCard` style (already used on homepage, location pages, dashboard/saved).

## 4. Data Layer (unified query builder)

Single `fetchListings()` inside `ListingsBrowser`:

1. Base query: `.eq('status', 'active')`, `.eq('moderation_status', 'approved')`
   (unchanged public visibility gate).
2. Type filter:
   - `fixedType` or `type=rent|sale` → `.eq('transaction_type', ...)`
   - no `type` / `type=all` → `.in('transaction_type', ['rent', 'sale'])`
3. All existing filters carried over identically from the current rentals/sales
   fetch functions: `posterRole`, `beds`, `baths`, `furnishing`, `litigationFree`,
   `region` (3-format `.in` / ilike fallback), `neighborhood` (ilike),
   `propertyUse`/`propertyType` (RESIDENTIAL/COMMERCIAL category routing),
   `condition`, `parking_space`, amenities `.contains`, `search`
   (`buildSearchFilter` + `.or`).
4. Price filter (`minPrice`/`maxPrice` converted via `convertFilterPriceToDb`):
   - rent → `gte`/`lte` on `base_rent`
   - sale → `gte`/`lte` on `outright_price`
   - all → `or(and(base_rent.gte.min,base_rent.lte.max),and(outright_price.gte.min,outright_price.lte.max))`
     (only the constraints present; single-sided filters include just that clause).
5. Sort (`?sort=`):
   - `newest` (default) → `created_at` desc
   - `views` → `views` desc
   - `price_asc` / `price_desc` → sort on `base_rent` (rent) or `outright_price`
     (sale). **Only available when a single type is selected** — in All mode the
     sort UI offers Newest / Most Viewed only (monthly vs lump-sum prices are not
     comparable).
6. Pagination: `?page=` (default 1, clamped to integers ≥ 1), PAGE_SIZE = 12,
   `.range((page-1)*12, page*12-1)`, count via `.select('*', { count: 'exact' })`.
7. Row → `PropertyCard` props mapping:
   - rent: `rawPrice = base_rent`, `priceSuffix = '/mo'`, `is_rental = true`,
     plus `service_charge`, `rent_advance_months`, `advance_period`
   - sale: `rawPrice = outright_price`, `priceSuffix = ''` (explicit empty string
     to defeat PropertyCard's `/mo` default), `is_rental = false`
   - shared: `title` (fallback `${category} in ${neighborhood|region}`),
     `location`, `beds`, `baths`, `area` (land_size for land / square_meters),
     `media_urls[0]` image, `safemove_active` → badge, `is_verified`,
     `viewing_fee`, resiliency flags.

## 5. UI Components

### 5.1 `PropertyFilters` (src/components/PropertyFilters.tsx) — mode support

- Replace `isRentalContext = pathname.includes('rentals')` with a mode derived as:
  - pathname `/properties` → mode = `searchParams.get('type') || 'all'`
  - otherwise → `'rent'` or `'sale'` from pathname
- Price section:
  - rent → "Monthly Rent (X)" (bounds 50,000 / 5,000)
  - sale → "Total Price (X)" (bounds 10,000,000 / 1,000,000)
  - all → "Price (Rent: /mo · Sale: total)", combined bounds 10,000,000 / 1,000,000
- Litigation-free checkbox: visible when mode is `sale` **or** `all` (currently
  hidden only on rentals; new rule: `mode !== 'rent'`).
- All other filters unchanged.

### 5.2 `SortSelect` (new, client component)

- Small client component, Suspense-wrapped (matches PropertyFilters pattern).
- Receives `options` (list of `{ value, label }`) and current `sort` from server.
- On change: `router.push(pathname + '?' + params)` preserving all other params.
- Options: Newest / Most Viewed always; Price Low→High / High→Low only when
  single type selected.

### 5.3 Pagination (server-rendered)

- `<Link>`s to `?page=N` preserving all other params; prev/next + page numbers;
  current page highlighted. New page loads as a normal navigation (scroll
  position not preserved — acceptable).

### 5.4 Empty state

- "No properties match your filters" message + Reset link to the bare route,
  styled consistently with the homepage empty state.

## 6. CTA Alignment

| Location | From | To |
|---|---|---|
| src/app/page.tsx:173 "View All Properties" | `/rentals` | `/properties` |
| src/app/page.tsx:196 empty-state "Browse Rentals" | `/rentals` | `/properties` |
| SearchWidget Rent tab | `/rentals?search=` | `/properties?type=rent&search=` |
| SearchWidget Buy tab | `/rentals?search=` | `/properties?type=sale&search=` |
| SearchWidget SafeMove tab | `/rentals?search=` | `/properties?search=` |

- Nav dropdown + footer: unchanged.
- Empty query still does nothing (current behavior).

## 7. SEO

- New `/properties` metadata: title "All Properties for Rent & Sale in Ghana |
  Property Hub GH", description, canonical `https://www.propertyhubgh.com/properties`,
  Open Graph (same image pattern as existing pages).
- Breadcrumb JSON-LD on /properties.
- Add `/properties` to static entries in `src/app/sitemap.ts`.
- `/rentals` and `/sales` metadata untouched.

## 8. Error Handling & Edge Cases

- Invalid `page` (0, negative, non-numeric) → clamp to 1.
- Page beyond range → empty-state UI with reset link.
- `type` values other than `rent`/`sale` (e.g. `type=foo`, `type=all`) → treated
  as all.
- Supabase query error → log + render empty grid with the empty state (current
  pages return `[]` on error; same behavior).
- No schema changes; no migrations.

## 9. Testing & Verification

- No test framework in the project. Verification via:
  - `npm run lint`
  - `npx tsc --noEmit`
  - `npm run build`
- Manual checks:
  - `/properties`: toggle chips (All/Rent/Buy), price filter in each mode,
    sort (price options hidden in All mode), pagination, search, empty state.
  - `/rentals` and `/sales`: identical filter behavior to before (URL params),
    new sort/pagination work, cards render.
  - Homepage CTA + SearchWidget redirect to the right URLs.

## 10. Out of Scope

- `/rentals/[location]` and `/sales/[location]` location pages (already use
  PropertyCard; unchanged).
- Nav/footer "Properties" dropdown restructure.
- Fixing the pre-existing `priceSuffix` default quirk in PropertyCard beyond
  passing explicit values from the new browser.
- Pagination/sort on location pages.