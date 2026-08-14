# SEO Wave 5 — Measurement Runbook Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close out the SEO implementation plan's final wave — GA4 analytics wired into the app (env-gated) plus a durable measurement runbook covering GSC, Bing/IndexNow, GA4, and ongoing AI-visibility/CWV monitoring.

**Architecture:** Three small independent code tasks (GA client component, runbook doc, cookie-policy sentence) followed by user-executed account setup steps. GA ships env-gated so builds pass without the Measurement ID. No schema changes, no tests beyond the existing suite staying green.

**Tech Stack:** Next.js 16.3 App Router, `@next/third-parties@^16`, Tailwind v4, Vitest (existing).

## Global Constraints

- GA component renders **only** when `process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID` is set — never breaks builds, dev stays GA-free.
- Commit hygiene: Wave 5 touches **only** `src/app/layout.tsx`, `src/components/Analytics.tsx` (new), `src/app/cookie-policy/page.tsx`, `package.json`, `docs/measurement-runbook.md`. Unrelated WIP is already committed separately (`ff825dd`); never stage anything else.
- Verification per task: `npm test` (82/82 green), `npm run lint`, `npx tsc --noEmit`, `npm run build`.
- Cookie policy stays truthful: GA4 is aggregate analytics, **no** ad trackers, **no** consent banner (out of scope).

---

### Task 1: GA4 integration (env-gated)

**Files:**
- Modify: `package.json` (add dependency)
- Create: `src/components/Analytics.tsx`
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Produces: `<Analytics />` client component (self-gating; no props). Later tasks/user only need `NEXT_PUBLIC_GA_MEASUREMENT_ID` in Vercel env.

- [ ] **Step 1: Install the dependency**

Run: `npm i @next/third-parties@^16`
Expected: added to `dependencies` in `package.json`; no peer-dep warnings.

- [ ] **Step 2: Create the analytics client component**

Create `src/components/Analytics.tsx`:

```tsx
"use client";

import { GoogleAnalytics } from "@next/third-parties/google";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export default function Analytics() {
  if (!GA_ID) return null;
  return <GoogleAnalytics gaId={GA_ID} />;
}
```

Client boundary isolates the third-party component from the server layout (avoids the known Next 15/16 Googlebot issue with the analytics script) and keeps `layout.tsx` clean.

- [ ] **Step 3: Mount in root layout**

Modify `src/app/layout.tsx`: import `Analytics` and render inside `<body>` (before closing `</body>`), e.g. after `</Providers>`:

```tsx
import Analytics from "@/components/Analytics";
// ...
        </Providers>
        <Analytics />
      </body>
```

- [ ] **Step 4: Verify graceful no-env build**

Run: `npm run build`
Expected: PASS. Grep the `.next` build output — **no** `googletagmanager` / `gtag` string present in rendered HTML.

- [ ] **Step 5: Verify env-present build**

Run (PowerShell): `$env:NEXT_PUBLIC_GA_MEASUREMENT_ID="G-XXXXXXXXXX"; npm run build`
Expected: PASS. Rendered HTML contains `https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX`.

- [ ] **Step 6: Full exit-gate sweep**

Run: `npm test; npm run lint; npx tsc --noEmit`
Expected: 82/82 tests PASS, lint 0 errors, tsc clean.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json src/components/Analytics.tsx src/app/layout.tsx
git commit -m "feat: env-gated GA4 analytics via next/third-parties"
```

---

### Task 2: Measurement runbook doc

**Files:**
- Create: `docs/measurement-runbook.md`

**Interfaces:**
- Consumes: A1 keyword-map clusters from `SEO-AUDIT-2026-08-12.md` (7 clusters below); SEO Wave 1–4 routes (`/properties`, `/rentals/{location}`, `/sales/{location}`, `/guides/buying`, `/guides/mortgage`, `/insights`).
- Produces: the durable T26/T27 artifact referenced by `SEO-IMPLEMENTATION-PLAN-2026-08-12.md` Wave 5.

- [ ] **Step 1: Write the runbook with this exact structure**

Create `docs/measurement-runbook.md` with the following sections:

```markdown
# Measurement Runbook — Property Hub GH

> Companion to SEO-IMPLEMENTATION-PLAN-2026-08-12.md Wave 5 (T26–T27).
> One-time setup: Sections 1–4. Ongoing: Sections 5–7.

## 1. Google Search Console
- Add property `https://www.propertyhubgh.com/` (URL-prefix) AND the
  domain property; verify via DNS TXT record at the registrar.
- Submit `https://www.propertyhubgh.com/sitemap.xml` (Sitemaps report → Submit).
- After 48h: Coverage ≈ submitted URLs; no soft-404s (all routes listed in
  sitemap must return 200 — includes /properties, /rentals/{location}, /sales/{location},
  /guides/buying, /guides/mortgage, /insights).

## 2. Bing Webmaster Tools + IndexNow
- Import site from GSC (or DNS verify); submit the same sitemap.
- Vercel dashboard → Integrations → Bing Webmaster → enable IndexNow
  (no code; pings automatically on each deploy).
- Optional first-deploy fallback ping (if integration off):
  `curl -X POST "https://api.indexnow.org/indexnow" -H "Content-Type: application/json" -d "{\"host\":\"www.propertyhubgh.com\",\"key\":\"<BING_KEY>\",\"keyLocation\":\"https://www.propertyhubgh.com/<BING_KEY>.txt\",\"urlList\":[\"https://www.propertyhubgh.com/\"]}"`

## 3. Google Analytics 4
- Create GA4 property (analytics-only; no ads measurement) for propertyhubgh.com.
- Admin → Data settings → Data retention: 14 months.
- Get Measurement ID (G-XXXXXXX); set Vercel env var `NEXT_PUBLIC_GA_MEASUREMENT_ID`
  (all environments) → redeploy. The app renders the gtag script only when set.
- Verify: GA4 DebugView (Admin → DebugView) while browsing the live site; expect
  `page_view` events. Event names/params beyond page_view are future work.

## 4. First-push checklist
- [ ] GSC: 2 properties added + verified + sitemap submitted
- [ ] Bing: site imported, sitemap submitted, IndexNow enabled
- [ ] GA4: Measurement ID set on Vercel, page_view firing in DebugView

## 5. Monthly AI-visibility review (≤1h)
Log every citation found; table template:

| Date | Engine | Query | Source URL | Cluster | Citation? (Y/N) |
|---|---|---|---|---|---|
|  | ChatGPT / Perplexity / Google AI Overviews / Bing Copilot | exact query | URL where answer appeared | cluster from map below |  |

Priority clusters (from SEO-AUDIT-2026-08-12.md A1):
1. Rentals by neighborhood (apartments for rent in East Legon/Cantonments/Labone…)
2. Student housing (student hostels in Accra, chamber and hall for rent…)
3. Sales/land (land for sale in Kasoa, litigation-free land Ghana…)
4. Diaspora (rent house in Ghana from abroad…)
5. Trust/escrow (rent advance scam Ghana, SafeMove…)
6. Guides (how to buy land in Ghana, mortgage rates Ghana…)
7. Category (studio apartment Accra, warehouse for rent Tema…)

Success signal: ≥1 citation for priority queries within 90 days of launch.

## 6. Monthly GSC CWV + Coverage review (≤30m)
- Core Web Vitals report: p75 mobile targets LCP < 2.5s, INP < 200ms, CLS < 0.1.
- Coverage: no "Discovered - currently not indexed" spikes; no soft-404s.
- Grep crawl: zero 404s from internal links (Sitemaps → Submitted URLs all 200).

## 7. Quarterly content refresh
- Refresh /guides/buying + /guides/mortgage (stats, rates, legal changes).
- Refresh /insights methodology note; confirm homepage market table matches.
- Update last-modified dates honestly (no fabricated dates).

## 8. Optional: share-of-AI-voice trackers
- Otterly.ai, Peec AI, ZipTie — monitor priority-cluster citations automatically.
```

- [ ] **Step 2: Verify doc integrity**

Run: grep the file for `TBD`, `TODO`, placeholder brackets — Expected: none. Confirm all 7 A1 clusters and all routes exist in the doc.

- [ ] **Step 3: Commit**

```bash
git add docs/measurement-runbook.md
git commit -m "docs: add SEO measurement runbook (GSC, Bing, GA4, monitoring)"
```

---

### Task 3: Cookie policy GA4 disclosure

**Files:**
- Modify: `src/app/cookie-policy/page.tsx` (the `<p>` in the "No Third-Party Advertising Trackers" section, ~line 75)

- [ ] **Step 1: Add one sentence to the "No Third-Party Advertising Trackers" section**

Append a new sentence to the existing paragraph (after the existing text about "functional infrastructure partners"):

> We do run Google Analytics in aggregate, privacy-friendly mode to understand general page performance and traffic levels — it does not track you across other websites and is never used for advertising.

- [ ] **Step 2: Verify**

Run: `npm run lint; npm run build`
Expected: lint 0 errors, build PASS.

- [ ] **Step 3: Commit**

```bash
git add src/app/cookie-policy/page.tsx
git commit -m "chore: disclose Google Analytics in cookie policy"
```

---

### Task 4: User setup (post-merge, owner: user, tracked in runbook §4)

- [ ] GSC: add + verify URL-prefix and domain properties; submit `sitemap.xml`; check Coverage after 48h
- [ ] Bing Webmaster Tools: import from GSC; submit sitemap; enable Vercel IndexNow integration
- [ ] GA4: create property; set `NEXT_PUBLIC_GA_MEASUREMENT_ID` in Vercel env; redeploy; confirm `page_view` in DebugView
- [ ] Log first monthly AI-visibility + CWV/coverage review using runbook §5–6

---

## Self-review notes (verified during planning)

- Spec coverage: T26 (GSC/Bing/GA4/IndexNow) → Tasks 1, 2, 4; T27 (monthly monitoring, optional trackers) → runbook §5–8.
- No placeholders; all code/doc content inline.
- No schema changes → no drizzle generate/migrate needed (per AGENTS.md).
- Commit hygiene protects the working tree (WIP committed separately as `ff825dd`).
