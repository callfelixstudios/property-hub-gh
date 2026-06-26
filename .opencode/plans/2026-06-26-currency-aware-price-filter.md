# Currency-Aware Price Filter Fix

## Problem
All listing prices are stored in GHS, but the filter UI allows users to enter values in their display currency (USD). The query compares raw GHS values against un-converted USD values, causing incorrect results.

**Example:**
- Listing: `outright_price = 500,000` GHS → displays as `$44,444` (500k ÷ 11.25)
- User filters: max price `$100,000` → query runs `.lte('outright_price', 100000)`
- Result: 500,000 ≤ 100,000 → **FALSE** → listing incorrectly hidden

---

## 4 Files to Change

### 1. CREATE `src/utils/currency.ts`
Central source of truth for the exchange rate and a conversion utility.

```ts
export const USD_TO_GHS_RATE = 11.25;

export function convertFilterPriceToDb(
  priceString: string | string[] | undefined,
  displayCurrency: string
): number | null {
  if (!priceString || Array.isArray(priceString)) return null;
  const parsedPrice = Number(priceString);
  if (isNaN(parsedPrice)) return null;
  if (displayCurrency === 'USD') {
    return Math.round(parsedPrice * USD_TO_GHS_RATE);
  }
  return parsedPrice;
}
```

### 2. UPDATE `src/context/CurrencyContext.tsx`
Replace the hardcoded `11.25` with the import.

- **Line 18:** `const exchangeRate = 11.25;` → `const exchangeRate = USD_TO_GHS_RATE;`
- **Add import:** `import { USD_TO_GHS_RATE } from '@/utils/currency';`

### 3. UPDATE `src/app/sales/page.tsx`
Add currency-aware conversion to the sales price filter (lines 28-29, 46-47).

**Changes:**
- Import `cookies` from `next/headers` and `convertFilterPriceToDb` from `@/utils/currency`
- In `SalesPage` component (before `fetchSalesListings` call):
  ```ts
  const cookieStore = await cookies();
  const displayCurrency = cookieStore.get('property_hub_currency')?.value || 'GHS';
  ```
- Update `fetchSalesListings` to accept `displayCurrency` param
- Replace lines 46-47:
  ```ts
  if (minPrice) query = query.gte('outright_price', minPrice);
  if (maxPrice) query = query.lte('outright_price', maxPrice);
  ```
  with:
  ```ts
  const minPriceGhs = convertFilterPriceToDb(searchParams.minPrice, displayCurrency);
  const maxPriceGhs = convertFilterPriceToDb(searchParams.maxPrice, displayCurrency);
  if (minPriceGhs !== null) query = query.gte('outright_price', minPriceGhs);
  if (maxPriceGhs !== null) query = query.lte('outright_price', maxPriceGhs);
  ```

### 4. UPDATE `src/app/rentals/page.tsx`
Same pattern as sales, but filtering on `base_rent` instead of `outright_price`.

**Changes:**
- Same imports and cookie reading
- Update `fetchRentalListings` to accept `displayCurrency`
- Replace lines 65-66:
  ```ts
  if (minPrice) query = query.gte('base_rent', minPrice);
  if (maxPrice) query = query.lte('base_rent', maxPrice);
  ```
  with:
  ```ts
  const minPriceGhs = convertFilterPriceToDb(searchParams.minPrice, displayCurrency);
  const maxPriceGhs = convertFilterPriceToDb(searchParams.maxPrice, displayCurrency);
  if (minPriceGhs !== null) query = query.gte('base_rent', minPriceGhs);
  if (maxPriceGhs !== null) query = query.lte('base_rent', maxPriceGhs);
  ```

---

## Verification
After changes, test on the sales page:
1. Find a listing with `outright_price = 500,000` displaying as `$44,444`
2. Set max price filter to `$100,000` → listing should **appear** (500k ≤ 1,125,000)
3. Set max price filter to `$10,000` → listing should **disappear** (500k > 112,500)
4. Run `npm run lint` and `npm run typecheck`
