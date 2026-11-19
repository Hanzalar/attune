# Design: cancellation-fill

## Context
The handoff narrows Attune to the cancellation fill. The previous domain modeled one referral moving through a
patient-picked specialist and time. The fill needs a shared world: many waiting patients, practices with published
criteria, slots and offers with timers, and consent that changes who can see what.

## Implementation
- Repository `Hanzalar/attune`, branch `feature/cancellation-fill` from `feature/clinical-redesign` (`f93f65a`).
- `packages/domain/src/types.ts`: `World` holds patients, practices, `feeTerms` (kept off `Practice` so matching
  can't read it by accident), referrals, slots, offers, consents, views, share codes, summaries, ledger, notices, log.
- `commands.ts`: `run(world, command, now)` checks the actor role and state, applies the command, appends one
  `AuditEvent` (actor, summary, and `shared` when data left her record), then calls `settle`. Refusals throw
  `DomainError` with a message the UI shows as-is.
- `agent.ts`: `settle(world, now)` runs small rules until nothing changes and returns the same object when nothing
  did: `qualify`, `insuranceStep`, `expireOffers` (skipped while the demo clock is paused), `offerRound`, `remind`,
  `deliverSummary`. The store calls it once a second from one tab.
- `matching.ts`: `evaluate` returns the first failing `SkipReason` or a `Candidate`; `orderCandidates` takes only
  `{ referralId, urgent, waitlistSince, miles }`; `holdRule`/`holdMs` read `HOLD_POLICY` from `config.ts`;
  `describeSkips` turns counts into the Unfilled reason.
- `criteria.ts`: `checkCompleteness` compares her record to a practice's `Requirement[]` (results within N months,
  minimum check-in days, sections on file) plus the always-required signed reason.
- `consent.ts`: grants and revocations per section and recipient; deterministic share codes; `canSee`.
- `notify.ts`: patient and practice text templates; `views.ts`: read models (`patientHome`, `trends`, `feesByPayer`).
- `fhir.ts`: BSeR ServiceRequest (priority from the urgency flag, `occurrenceDateTime` once booked) + Task (status
  mapped from the referral) + one Consent per recipient.
- `demo.ts`: synthetic world. `fill` mode builds Ari's history by running real commands at past times; eight other
  waiting patients each fail exactly one rule for the default slot, plus one eligible patient behind Ari.
- `apps/web/src/shared/store.ts`: localStorage + BroadcastChannel; a Web Lock elects one ticker tab; `nowIso()` adds
  the demo clock offset. `act()` returns the refusal message.
- `apps/web`: tokens and kit (`design/tokens.ts`, `shared/ui.tsx`, `Brand.tsx` with code-drawn blooms and grain,
  torn `Paper`), `PatientPack.tsx` shared by all views, views per surface (`patient/`, `pcp/`, `specialist/`,
  `ops/`, `demo/`).

## Decisions
- Accepting an offer grants the Pack sections to that practice; the PCP note travels with the referral itself.
- Results the PCP attaches go into her record (she owns it), not a per-referral list, so criteria read one place.
- Share codes need her date of birth (MyChart Share Everywhere pattern). Lockout after failed tries is deferred:
  refusals can't record state in a pure command model without a separate attempt log.
- Batch offers say others got it too (research: JHAH Fast Pass wording). Texts fit one SMS (FCC 2015 exemption).
- Demo clock: speed divides hold windows; pause extends pending holds on resume; an offset lets the presenter skip to
  the visit so "attended" is never faked before the start time.
- The patient never picks a specialist, so specialist ranking is gone; the "never rank by who pays" test now guards
  offer order and source-scans matching and criteria code.

## Not adopted from research (open questions on `business`)
Quiet hours for new holds, a 2-at-once fallback for the 24 h+ tiers, and longer holds or translated texts for
patients who accept less often. Each changes the handoff's numbers, so they wait for a decision.

## Verification
`npm run check` (typecheck, domain tests, build); a browser walk of the six-step scenario across the patient app at
390px and the PCP, specialist and ops views at desktop width; console and network checks for third-party requests.
