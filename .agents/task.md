# Phone Auth Implementation Tasks

- [x] **Phase 1 — Independent modules (parallel)**
  - [x] Create `src/utils/phoneUtils.ts` — Ghana phone sanitizer + validator
  - [x] Create `src/app/actions/authActions.ts` — sendPhoneOtp + verifyPhoneOtp
  - [x] Create `src/components/auth/AuthModal.tsx` — Multi-step auth modal
  - [x] Create `src/app/auth/callback/route.ts` — Google OAuth callback handler
  - [x] Create DB migration — Update `handle_new_user()` trigger for phone
  - [x] Add `public/google-icon.svg` — Inline Google logo asset

- [x] **Phase 2 — Page upgrades (depends on Phase 1)**
  - [x] Upgrade `src/app/login/page.tsx` — Add phone OTP + Google OAuth
  - [x] Upgrade `src/app/register/page.tsx` — Add phone OTP + Google OAuth

- [x] **Phase 3 — Navigation integration**
  - [x] Update `src/components/NavigationHeader.tsx` — Wire AuthModal

- [/] **Phase 4 — Verification**
  - [ ] Run `npm run build` + `npx tsc --noEmit`
  - [ ] Run `npm run lint`
