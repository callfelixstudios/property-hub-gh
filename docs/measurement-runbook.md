# Measurement Runbook — Property Hub GH

> Companion to SEO-IMPLEMENTATION-PLAN-2026-08-12.md Wave 5 (T26–T27).
> One-time setup: Sections 1–4. Ongoing: Sections 5–7.

## 1. Google Search Console
- Add property `https://www.propertyhubgh.com/` (URL-prefix) AND the
  domain property; verify via DNS TXT record at the registrar.
- Submit `https://www.propertyhubgh.com/sitemap.xml` (Sitemaps report → Submit).
- After 48h: Coverage ≈ submitted URLs; no soft-404s (all routes listed in
  sitemap must return 200 — includes /properties, /rentals/{location}, /sales/{location},
  /insights).

## 2. Bing Webmaster Tools + IndexNow
- Import site from GSC (or DNS verify); submit the same sitemap.
- Vercel dashboard → Integrations → Bing Webmaster → enable IndexNow
  (no code; pings automatically on each deploy).
- **Status (2026-08-14): DEFERRED — the Bing/IndexNow integration was not
  available in this Vercel account's Marketplace (no search results for
  "IndexNow" or "Bing"). Not blocking: all 16 sitemap URLs already indexed.
  Return here if deploy-time pings are ever needed.**
- Optional first-deploy fallback ping (if integration off):
  `curl -X POST "https://api.indexnow.org/indexnow" -H "Content-Type: application/json" -d "{\"host\":\"www.propertyhubgh.com\",\"key\":\"<BING_KEY>\",\"keyLocation\":\"https://www.propertyhubgh.com/<BING_KEY>.txt\",\"urlList\":[\"https://www.propertyhubgh.com/\"]}"`

## 3. Google Analytics 4
- Create GA4 property (analytics-only; no ads measurement) for propertyhubgh.com.
- Admin → Data settings → Data retention: 14 months.
- Get Measurement ID (G-XXXXXXX); set Vercel env var `NEXT_PUBLIC_GA_MEASUREMENT_ID`
  (all environments) → redeploy. The app renders the gtag script only when set.
- Verify: GA4 DebugView (Admin → DebugView) while browsing the live site; expect
  `page_view` events. Event names/params beyond page_view are future work.
- **Status (2026-08-14): DONE — Measurement ID `G-16MWX98XYD`; env var set on Vercel
  (all environments); gtag verified in live HTML post-redeploy. Access note: the
  office ISP DNS-blocked analytics.google.com (null-routed) — use a VPN when
  checking reports. Confirm `page_view` in Realtime while browsing (DebugView needs
  the GA Debugger extension).**

## 4. First-push checklist
- [x] GSC: property verified ("You are a verified owner"), sitemap Success (16 URLs), homepage indexed (2026-08-14)
- [~] Bing: site added + verified, sitemap Success (16 URLs indexed) — IndexNow **deferred** (see §2)
- [x] GA4: `NEXT_PUBLIC_GA_MEASUREMENT_ID` = `G-16MWX98XYD` set on Vercel (all envs), gtag verified in live HTML (2026-08-14); confirm page_view in Realtime

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
- Once /guides/buying and /guides/mortgage ship (SEO plan T22–T23), refresh them quarterly (stats, rates, legal changes).
- Refresh /insights methodology note; confirm homepage market table matches.
- Update last-modified dates honestly (no fabricated dates).

## 8. Optional: share-of-AI-voice trackers
- Otterly.ai, Peec AI, ZipTie — monitor priority-cluster citations automatically.
