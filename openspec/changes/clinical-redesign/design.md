# Design

- **Branch:** `feature/clinical-redesign` from `develop` at `969f30f`.
- **Domain:** `Specialist.openSlots`, `Referral.requestedSlot`, commands `holdSlot` (patient) and
  `confirmRequestedSlot` (specialist_staff) in `referral.ts`; `chooseSpecialist` releases a hold on change;
  `revokeConsent` after delivery releases it; `nextStep` names the confirm step; `toFhirBundle` adds
  `occurrenceDateTime`. Ranking (`matching.ts`) is unchanged and still never reads `partner`.
- **Design system:** `apps/web/DESIGN.md`, `src/design/tokens.ts`, `src/index.css` (self-hosted Plex via
  `@fontsource`, focus ring), `src/shared/ui.tsx` (Button, StatusPill, Notice, Card, Panel, Stepper, SlotButton, Tabs,
  Metric, Toast), `src/shared/Brand.tsx` (mark). `theme.ts` removed. Contrast checked with a script: text 17.5:1,
  muted 7.3:1, subtle 5.0 to 5.7:1, status pairs 5.2 to 5.6:1, input borders 3.5:1.
- **Patient app:** `patient/referral/{ReferralTab,Booking,ProviderCard,Status}.tsx`, `patient/Coach.tsx`,
  `patient/Tracker.tsx`, `patient/main.tsx`.
- **Clinical views:** `pcp/{main,Detail,Practice}.tsx`, `specialist/{main,Inbox,Provider}.tsx`.
- **Guide:** `guide/*`, screens captured at 390x844 @2x from the dev server with states produced by `dispatch`.
- **Demo hub:** `apps/web/demo/index.html` + `src/demo/main.tsx`; `viewUrl("demo")`. Storage key bumped to
  `attune.demo.referral.v2` because the record shape changed.
- **Landing overlay:** `pages.yml` checks out `landing` and copies it over the site root, failing on any path clash.
- **Deviation:** the develop-side landing wiring rides on this branch because it moves the demo hub this change
  restyles; splitting would conflict on the same files.
