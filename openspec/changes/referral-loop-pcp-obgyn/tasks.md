## 1. Domain rules (packages/domain)
- [x] 1.1 Lifecycle with actor and stage guards, audit events, `nextStep`.
- [x] 1.2 Consent grant and revoke before and after delivery.
- [x] 1.3 Plan-type sign-off rules, physician co-sign for HMO and POS.
- [x] 1.4 Delivery channel choice; refuse unverified fax.
- [x] 1.5 Ranking without commercial fields, with invariance test.
- [x] 1.6 Rotterdam evidence mapping and draft symptom codes.
- [x] 1.7 BSeR-shaped FHIR bundle.

## 2. Views (apps/web)
- [x] 2.1 Patient app: today, insights, trials, coach, referral with approve, book, waitlist, stop sharing.
- [x] 2.2 PCP admin: queue, sign-off with code confirmation, after-sending status, trusted specialists, settings, activity.
- [x] 2.3 Specialist admin: inbox with sourced evidence, accept, request records, decline with note, cancellation fill, provider console, intake settings with FHIR preview, activity.
- [x] 2.4 Landing page linking the three views with live loop status.

## 3. Delivery
- [x] 3.1 CI: typecheck, tests, build, agent drift check, promotion gate.
- [x] 3.2 Pages preview from develop.
- [ ] 3.3 Confirm the Pages site is live and walk the loop on a real phone (iOS Safari and Android Chrome).
- [ ] 3.4 Show the PCP and specialist views to one MA and one OB/GYN front desk; log findings on `business`.

## 4. Handoff
- [x] 4.1 Update handoff.md with evidence and next action.
