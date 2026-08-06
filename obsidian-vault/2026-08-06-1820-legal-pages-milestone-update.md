# Milestone Update — Legal Pages (Terms, Privacy, Cookie, Copyright)

## 1. Execution Timestamp

`Executed on: 2026-08-06 at 18:20:58 GMT`

## 2. Milestone Summary

Added four statutory legal/compliance pages to the website and wired them into the Footer. All pages are Server Components with per-page `metadata` and a shared layout (white card on slate-50, bordered header band, prose body, `Footer`).

- **Terms of Service** (`/terms`): Binding agreement under the Electronic Transactions Act, 2008 (Act 772) and Data Protection Act, 2012 (Act 843). Covers marketplace role, account creation (incl. E.164 phone formatting), agent/developer verification, listing content rules, subscriptions/payments, immutable admin audit logs, limitation of liability (Section 93, Act 772), governing law, and Legal Department contact (`legal@propertyhubgh.com`).
- **Privacy Policy** (`/privacy`): Framework under Article 18(2) of the 1992 Constitution + Act 843. Data collected (account, KYC docs, listings, technical), sensitive-document handling, SMS/WhatsApp messaging partners (Moolre & Hubtel), audit-trail transparency, data-subject rights (Access §35, Rectification §40, Erasure §40, Objection §39), data-sharing partners (Supabase, Moolre, Hubtel), retention policy, Data Protection Officer contact (`privacy@propertyhubgh.com`).
- **Cookie & Local Storage Policy** (`/cookie-policy`): Explains cookies and local storage (essential security/auth, preferences/UI, aggregated performance), explicitly states no third-party ad trackers, browser-specific cookie management steps, and support contact (`support@propertyhubgh.com`).
- **Copyright & IP Policy** (`/copyright`): Content ownership (platform assets vs user media), prohibited content, takedown notice requirements and counter-notice procedure (10 business days) under the Copyright Act, 2005 (Act 690) and Act 772. Copyright Officer contact (`copyright@propertyhubgh.com`).
- **Footer update:** Added "Cookie Policy" and "Copyright Policy" links (with flex-wrap) alongside the existing Terms + Privacy links.

## 3. Files Modified

- `src/app/terms/page.tsx` (new)
- `src/app/privacy/page.tsx` (new)
- `src/app/cookie-policy/page.tsx` (new)
- `src/app/copyright/page.tsx` (new)
- `src/components/Footer.tsx` (added Cookie + Copyright footer links, `flex-wrap`)
- `skills-lock.json` (added `english-humanizer` skill lock)
- `.agents/skills/english-humanizer/SKILL.md` (new skill)

Also re-committed the prior un-pushed Obsidian milestone `obsidian-vault/2026-08-06-1700-milestone-update.md` (Footer social links + address update).

## 4. Data/UI Architecture State

- **Routing:** 4 new server-rendered routes registered by Next.js build: `/terms`, `/privacy`, `/cookie-policy`, `/copyright`. No client state or data fetching; all static content.
- **Metadata:** Each page exports `title` + `description` (amplified SEO/legal authority signals).
- **Footer nav state:** Legal link cluster = Terms, Privacy, Cookie Policy, Copyright (`flex-wrap` on small screens).
- **Contact matrix active:** `legal@propertyhubgh.com`, `privacy@propertyhubgh.com`, `support@propertyhubgh.com`, `copyright@propertyhubgh.com`, plus primary `hello@propertyhubgh.com` in the Footer top block.
- **Type safety:** `npx tsc --noEmit` clean; `npm run lint` 0 errors (10 `react/no-unescaped-entities` errors on `/terms` fixed — `"` escaped as `&quot;`); `npm run build` succeeded (30 routes).

## 5. Next Immediate Steps

- Add legal routes to `sitemap.xml`/`robots.txt` if not already covered.
- Optional: link Privacy/Cookie pages from signup/auth flows and add a cookie-consent banner consistent with the Cookie Policy.
- Run `next build`, lint, and typecheck once more after any copy tweaks.
