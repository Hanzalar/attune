# Design: referral-loop-pcp-obgyn

## Context
The prototype (a single-file React artifact) showed five lenses over one in-memory record with stage numbers
hard-coded in each view. This change moves every rule into a tested package and gives each stakeholder its own URL.

## Implementation
- Repository `Hanzalar/attune`, branch `feature/referral-loop-pcp-obgyn` merged to `develop` (initial commit).
- `packages/domain/src/referral.ts`: `apply(referral, command)` is pure; it checks the actor role and stage, returns
  the next referral with an appended `AuditEvent`, or throws `DomainError`. `nextStep()` drives the cross-view banner.
- `agent.ts`: `dispatch()` applies a human command, then the agent follow-ups it is cleared for (deliver after
  sign-off, close after the visit). The agent never approves or signs.
- `coverage.ts`: plan-type defaults (HMO and POS need a referral and a physician signature; EPO excludes
  out-of-network). Always flagged "verify with plan".
- `matching.ts`: `rankSpecialists()` takes `Omit<Specialist, "partner">`-compatible input and sorts by network,
  soonest opening, PMOS experience, distance. A test flips partner flags and asserts identical order.
- `evidence.ts`: Rotterdam domains per the 2023 International Guideline. mFG threshold defaults to 6 (guideline range
  4 to 6; the prototype's 8 was the older cut-off). Morphology is always `clinician_review`; Attune does not read imaging.
- `codes.ts`: symptom codes (N91.5, L68.0, L70.0, E88.819). E28.2 only when the diagnosis is on file, because
  outpatient coding does not code suspected conditions. The prototype drafted E28.2 and N91.4; both changed.
- `fhir.ts`: ServiceRequest + Task + Consent following HL7 BSeR. Stage maps to Task.status.
- `apps/web/src/shared/store.ts`: localStorage plus BroadcastChannel; the same `act()` hook will front the API.

## Decisions
- Delivery preference is FHIR, then Direct (sent as a 360X package so Epic and athena sites can consume it), then a
  verified fax. An unverified fax is not a route.
- Revoking consent before delivery returns to draft and clears signatures; after delivery it withdraws the referral.
- Cancellation-fill order is first-come by referral date and is not purchasable.

## Verification
- `npm run check` (typecheck, 22 unit tests, production build).
- Headless Chrome walk across three tabs (patient at 390px, PCP and specialist at 1280px): approve, sign, accept,
  book, record visit; 7 audit events; no console errors; no horizontal scroll at 390px on patient and PCP pages.
