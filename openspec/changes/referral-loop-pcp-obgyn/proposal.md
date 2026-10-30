# Why
No one owns a PMOS patient between providers. PCP medical assistants fax packets by hand and hunt for in-network
specialists with working fax numbers; specialists receive partial records and retake the history; patients spend
4 to 5 years and 3 to 5 providers reaching a diagnosis. Discovery: `business` branch,
`discovery/referral-gap.md` and `product/referral-agent-solution.md`.

# What Changes
- Add the PCP to OB/GYN referral loop as pure domain rules in `packages/domain`: lifecycle, consent, sign-off by
  plan type, delivery channel choice, specialist ranking, Rotterdam evidence mapping, draft ICD-10-CM codes, and
  BSeR-shaped FHIR resources.
- Host three stakeholder views from one web build: patient app (mobile-first, installable), PCP admin (queue,
  sign-off, status after sending, trusted specialists, practice settings, activity log) and specialist admin
  (pre-qualified inbox, cancellation fill, provider console, intake settings with FHIR preview, activity log).
- Views share one record in the browser and sync live across tabs. A server-backed record is change
  `shared-record-api`.

# Capabilities
## New Capabilities
- `referral-loop`: patient-approved, PCP-signed referral that is delivered, accepted, booked, visited and closed
  back to the PCP, with an audit event for every step.

# Impact
Implementation: `packages/domain`, `apps/web`, CI and Pages workflows on `develop`.
Excluded: real fax or Direct sending, portal and lab pulls, authentication, any payment flow, endo and REI loops.
Regulatory gates touched: consent and sign-off (enforced in code); kickback and FDA CDS stay open on `business`.
