# Decisions

One entry per decision. Newest first. Each says what we decided, why, and what would change it.

## ADR-008 · 2026-10-30 · Fold the competitor research into the build
- **Decision:** v1 sends Direct as a 360X package alongside e-fax; the internal model is HL7 BSeR (ServiceRequest + Task + Consent); records pulls are patient-authorized only ((g)(10), then TEFCA IAS).
- **Why:** Epic and athena can consume 360X without custom work, BSeR keeps v2 and v3 a transport change, and treatment-purpose aggregators are in active litigation with Epic. See [competitive-landscape.md](research/competitive-landscape.md).
- **Revisit if:** our first pilot offices have no Direct addresses, or a QHIN offers IAS cheaply enough for v1.

## ADR-007 · 2026-10-30 · No real patient data until HIPAA posture is decided
- **Decision:** The public demo uses synthetic data only. No real PHI goes into any Attune system until counsel decides whether Attune is a consumer app the patient directs or a business associate of the practices, and a hosting provider with a BAA is chosen.
- **Why:** Sending records on a patient's behalf may put us under HIPAA. The shared-record backend (`shared-record-api` on `meta`) is blocked on this.
- **Revisit if:** counsel answers.

## ADR-006 · 2026-10-30 · One repository, orphan branches for business and specs
- **Decision:** `business` (this branch) and `meta` are orphan branches of `Hanzalar/attune`; code flows `develop` → `stage` → `main`.
- **Why:** One place to clone and share, while business docs, specs and code never pollute each other's history or an agent's context. Teammates edit `business` from the browser.
- **Revisit if:** we need different access rules for code and business docs, which would mean splitting repos.

## ADR-005 · 2026-10-30 · Web first; the patient app is an installable web app
- **Decision:** Ship patient, PCP admin and specialist admin as one web build. The patient app is mobile-first and installable. A native shell can wrap it later and reuse the domain package.
- **Why:** PCP and specialist offices need no install, and one codebase is all a student team can maintain. Native adds push notifications and app-store presence, which the pilot doesn't need yet.
- **Revisit if:** pilot patients need reliable push for cancellation offers.

## ADR-004 · 2026-10-30 · Lead with the patient subscription; no per-referral specialist fee
- **Decision:** The deck leads with option A (patient pays). Option B only as a flat, uniform, cost-based subscription. Option C is off the table until counsel reviews it.
- **Why:** AO 26-15, Texas Occ. Code 102.001, and the Zocdoc precedent. Physician fees are ~1% of Year 3 revenue in the model anyway. See [pricing-and-legal.md](strategy/pricing-and-legal.md).
- **Revisit if:** counsel approves a specific specialist-paid structure.

## ADR-003 · 2026-10-30 · Matches are never ranked by who pays
- **Decision:** Ranking uses network, soonest opening, PMOS experience and distance only, and always includes non-partners. Enforced by a unit test on `develop`.
- **Why:** Steering patients by payment is the conduct OIG flagged in AO 26-15, and it would break patient trust.

## ADR-002 · 2026-10-30 · Fax-first delivery
- **Decision:** v1 delivers by verified e-fax with receipt (plus Direct/360X); FHIR read in v2; write-back in v3, per vendor.
- **Why:** The certified patient API is read-only, and offices already work from fax buckets (SPEC-1). Nothing changes at the office.

## ADR-001 · 2026-10-30 · First loop is PCP to OB/GYN in DFW
- **Decision:** Build the PCP to OB/GYN handoff first; endo and REI later.
- **Why:** Highest referral volume at our PCP contact, warm physician contacts in DFW, and gynos keep PMOS patients long term while referring PMOS in, not out.
