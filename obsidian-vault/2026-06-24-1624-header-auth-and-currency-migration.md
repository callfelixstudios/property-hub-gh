# Header Auth Gates & Currency Persistence Migration

**Executed on:** 2026-06-24 at 16:24:56 GMT

## Milestone Summary
Refactored the global `NavigationHeader` component to unify scroll transparency mechanics and implement explicit authentication gates on both CTA buttons ("Request a Space" and "Post a Space"). Extended the `CurrencyContext` to support dual-layer persistence: `localStorage` for guests and a new `preferred_currency` database column for authenticated users. Includes a live Supabase schema migration.

## Files Modified
- `src/components/NavigationHeader.tsx`
- `src/context/CurrencyContext.tsx`
- `supabase/migrations/20260624000000_add_preferred_currency_to_profiles.sql` _(new)_

## Data/UI Architecture State

### Database
- **New Column:** `public.profiles.preferred_currency` — `text`, default `'GHS'`
- Migration applied live to Supabase project `lqitnsvtqhsowvmaxjio` (eu-west-3).

### Header Scroll Mechanics
- Scroll listener now runs universally on all pages with no dependency on authentication state.
- `handleScroll()` is called immediately on mount (via `useEffect`) to handle pages that are pre-scrolled on load.
- The `passive: true` scroll event option is applied for improved performance on scroll-heavy listing pages.
- `isSolidHeader` logic unchanged — transparent on `/rentals` and `/sales` heroes, solid on scroll or on non-hero pages.

### CTA Button Auth Gates
| Button | Before | After |
|---|---|---|
| **Request a Space** | `<Link href="/request-space">` — unprotected | `<button onClick={handleRequestSpace}>` — redirects to `/login?next=/request-space&message=Please log in to submit a property request.` if no session |
| **Post a Space** | `router.push('/login?message=...')` — no `?next=` | `router.push('/login?next=/post-space&message=Log in or create an account to list your property.')` — destination preserved |
| Both also updated in **mobile menu** with `setIsMobileMenuOpen(false)` called before routing. |

### Currency Persistence Architecture
| User State | Source of Truth (On Mount) | On Toggle |
|---|---|---|
| **Authenticated** | Supabase `profiles.preferred_currency` (DB query) | Writes to DB via `supabase.from('profiles').update()` + writes to `localStorage` |
| **Guest** | `localStorage['property_hub_currency']` | Writes to `localStorage` only |
| **Both** | — | Dispatches `StorageEvent('storage')` so all sibling components and tabs react immediately without a page reload |

## Next Immediate Steps
- Implement `middleware.ts` for Supabase SSR session refresh to ensure server-rendered pages have access to the active session cookie.
- Consider adding a `?next=` redirect handler in the `/login` page that sends users to their intended destination after successful authentication.
