# SEO Wave 5 — Measurement Runbook — Design

**Date:** 2026-08-14
**Status:** Approved by user (sections 1–2, then full design)
**Project:** Property Hub GH (`property-hub-gh`)

## 1. Problem

SEO Waves 1–4 (launch blockers, content truth, location pages, content hub/OG/AI files) are shipped, but there is no measurement infrastructure: no search-console verification, no analytics, no IndexNow, and no documented cadence for tracking the success signals defined in `SEO-AUDIT-2026-08-12.md` (GSC Coverage, CWV p75 targets, AI-engine citations within 90 days). Wave 5 of `SEO-IMPLEMENTATION-PLAN-2026-08-12.md` (T26–T27) closes this out.

## 2. Design decisions (locked with user)

1. **Hybrid wave:** code tasks (GA4 integration, runbook doc, cookie-policy sentence) are executed by sub-agents; account-setup tasks (GSC, Bing/IndexNow, GA4 property) are user-executed from runbook steps.
2. **GA4 ships env-gated:** `<GoogleAnalytics>` renders only when `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set. Builds never break without it; dev stays GA-free. GA4 property does not exist yet — user creates it post-merge.
3. **Client-boundary isolation:** GA goes in a new `"use client"` wrapper component (`src/components/Analytics.tsx`) — avoids the known Next 15/16 Googlebot issue with third-parties scripts and keeps the server layout clean.
4. **Hosting is Vercel** (confirmed): IndexNow is a dashboard integration (Bing Webmaster Tools on Vercel), not code. The runbook still documents a curl fallback.
5. **No consent banner** (out of scope); GA4 configured analytics-only, data retention 14 months. Cookie policy gets one honest sentence about aggregate analytics (no ad trackers — consistent with the existing "No Third-Party Advertising Trackers" section).
6. **Runbook is a durable repo artifact:** `docs/measurement-runbook.md` — the T26/T27 content lives there, not only in the plan file.
7. **Commit hygiene:** Wave 5 touches only `src/app/layout.tsx`, `src/components/Analytics.tsx`, `src/app/cookie-policy/page.tsx`, `package.json`, `docs/measurement-runbook.md`. Unrelated working-tree WIP is committed separately (done: `ff825dd`).

## 3. Code changes

### 3.1 GA4 integration (env-gated)
- Install `@next/third-parties@^16` (matches Next 16.3.0).
- Create `src/components/Analytics.tsx`:

```tsx
"use client";

import { GoogleAnalytics } from "@next/third-parties/google";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export default function Analytics() {
  if (!GA_ID) return null;
  return <GoogleAnalytics gaId={GA_ID} />;
}
```

- Mount `<Analytics />` inside `<body>` in `src/app/layout.tsx`.

### 3.2 Runbook doc
`docs/measurement-runbook.md` with sections: GSC (URL-prefix + domain, DNS verify, sitemap submit, 48h coverage check); Bing WMT (import from GSC, sitemap, Vercel IndexNow integration + curl fallback); GA4 (create property, retention, Measurement ID env var, DebugView verification); monthly AI-visibility review with citation-log table template built on the 7 A1 keyword clusters; monthly GSC CWV + Coverage review (LCP < 2.5s, INP < 200ms, CLS < 0.1); quarterly content refresh; optional AI-visibility trackers.

### 3.3 Cookie policy disclosure
One sentence appended to the "No Third-Party Advertising Trackers" paragraph (`src/app/cookie-policy/page.tsx`).

## 4. Verification plan

- `npm test` (82/82 green), `npm run lint`, `npx tsc --noEmit`, `npm run build` per task and as the wave exit gate.
- Graceful no-env build: no `googletagmanager`/`gtag` in built HTML. Env-present build (`NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX`): gtag script present in HTML.
- Runbook doc: no placeholders; all 7 clusters and routes present.

## 5. Out of scope

- Vercel Analytics, consent banner, GA4 event taxonomy beyond default `page_view`, L3 manifest/PWA.
- User account setup (GSC/Bing/GA4) is runbook-guided, not executed here.
