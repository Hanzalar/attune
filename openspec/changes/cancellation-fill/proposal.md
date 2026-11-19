# Why
Specialists restart the history even when notes were sent, faxes go missing, and after sending the PCP has no idea
what happens (`business` branch, `discovery/referral-gap.md`: Patients F and G, PCP-1, PCP-2, SPEC-1). The prototype
handoff (`business`, `product/prototype-handoff.md`, 2026-11-18) narrows the product to one moment that answers all
three: **a specialist's cancellation is filled by a patient who is already PCP-qualified, insurance-checked and has
her record ready.** Competitor research (`business`, `research/prototype-landscape-2026-11.md`) supplies the fill
mechanics (batching, holds, the "slot is gone" state, PHI-free texts) and the consent patterns.

Not yet proven by interviews: how DFW specialists fill cancellations today and how often slots go empty (open
question for specialist intake staff). ADR-009 records that gap.

# What Changes
- **Domain rebuilt around the fill.** One shared world: patients and their record, referrals, practices and their
  published criteria, slots, offers, consents, record views, share codes, visit summaries, fee ledger, notices and an
  append-only audit log. Commands are pure and refuse with an actionable `DomainError`; the agent settles follow-ups
  (qualify, request insurance, join the waitlist, send and expire offers, close unfilled slots, deliver summaries).
- **Removed:** Rotterdam evidence scoring, draft ICD-10 codes, specialist ranking, plan-type coverage defaults, the
  patient-picked held time, and the `/guide/` walkthrough (its screenshots showed screens that no longer exist).
- **Patient app:** onboarding (three questions), Home (offer, then referral status, then check-in, then "you're
  caught up"), check-in, My Record with who viewed it, Care team (per-section consent), Share with my doctor (code +
  QR), insurance card, waitlist preferences, offer with countdown and designed "slot is gone" states, booked
  confirmation with day-before confirm, Patient Pack preview, after-visit summary.
- **PCP portal (for the MA):** lookup by share code and date of birth, record view, referral builder with live
  criteria preview, attach-from-EMR (mocked), physician sign-off, off-Attune fax fallback (mocked), status board,
  inbox.
- **Specialist portal (front desk):** post cancellation with the hold policy previewed, openings, filled slots,
  Patient Pack (print to PDF, secure link), mark attended, visit summary, published criteria.
- **Ops (mocked) and demo hub:** insurance exception queue, waitlist and offers, directory, notifications outbox,
  fee ledger, audit log, demo clock (60× holds, pause, skip to visit), and the handoff's six-step scenario as a live
  checklist.
- **Design:** the handoff's palette with Instrument Serif and Instrument Sans, self-hosted (ADR-011). Replaces Attune
  Clinical UI from `clinical-redesign`.
- **Constitution:** rules 1–4 and 9 and the domain/web component rules updated to the new model.

# Capabilities
## New Capabilities
- `waitlist-fill`: eligibility, ordering, hold policy, races and unfilled reasons.
- `referral-qualification`: physician sign-off, criteria completeness, insurance step, fax fallback.
- `record-consent`: share codes, per-section per-recipient consent, view log, Patient Pack consent on accept.
- `visit-close`: day-before confirmation, attended, visit summary, close.
- `fee-ledger`: display-only accrual to specialist practices.
- `notifications`: PHI-free text that fits one SMS.
- `attune-design`: the handoff look and the patient-screen rules.

# Impact
Views: patient, PCP portal, specialist portal, plus ops and demo hub. Components: `packages/domain` (rewritten),
`apps/web` (all views, design system), governance on `meta`. Stacks on `clinical-redesign`, which is not merged yet
and carries the landing overlay; this change supersedes its design-system and patient-walkthrough capabilities.

Excluded: community, the daily note, real EMR connections, real billing, real push, real insurance eligibility
(X12 270/271), anything that diagnoses or recommends treatment.

Regulatory gates touched: consent (accept = Pack consent; revocation honored, including for summaries to the PCP),
PCP sign-off (physician attestation required), kickback (fee ledger only, ADR-010; matching can't read fees), FDA CDS
(evidence scoring and codes removed, so the prototype is display-only). Clinical copy review is still open.
