# Decisions

One entry per decision. Newest first. Each says what we decided, why, and what would change it.

## ADR-012 · 2026-11-18 · AI-native journal: assistants draft, she approves
- **Decision:** Attune connects to AI assistants (Claude in the app and through a connector; ChatGPT and any other MCP client through the connector). She journals in plain words; the assistant drafts record updates she applies with one tap; she asks about her record and gets answers drawn only from what she shared. Each assistant is a consent recipient: per-section grants, every read logged, disconnect ends access. Health data reaches a model only through a gateway we host, on the Messages API.
- **Why:** The product owner asked for it (2026-11-18). It extends "she stops retelling her story": the record keeps itself current from what she already says. Per-section consent and drafts keep the patient-owned and "drafts, people approve" rules intact.
- **Risks:** No interview evidence yet that patients want this (open question). An assistant answering about labs sits close to clinical decision support: answers stay display-only (value, date, lab range, source) and send meaning to her care team. Real data needs a BAA with each model provider, and ADR-007 still blocks real PHI. Anthropic's hosted Managed Agents isn't BAA-eligible, so the gateway uses the Messages API.
- **Revisit if:** patients don't journal or don't trust it, counsel or the FDA CDS check objects to Q&A about results, or a provider's BAA terms rule it out.

## ADR-011 · 2026-11-18 · The handoff's look replaces Attune Clinical UI
- **Decision:** Every surface uses the handoff palette (Orchid Wine, Raspberry, Dusty Rose for large type only, Clay, Blush, Bone, Cream, Forest) with Instrument Serif Italic for voice and Instrument Sans for the interface, both self-hosted. The patient app is editorial; the clinician portals use the same colors, plainer and denser. IBM Plex and the navy palette are retired.
- **Why:** The [prototype handoff](product/prototype-handoff.md) specifies it. Contrast is checked: Forest on Cream 11:1, Raspberry 6.8:1, Dusty Rose 3.9:1 (so large type only), Clay 2.2:1 (decorative only). Status is never color alone: every status is an icon plus a word.
- **Revisit if:** clinician testers find the portals hard to scan, or patients read the look as not trustworthy for health data.

## ADR-010 · 2026-11-18 · Show the specialist fee in a ledger; charge nothing
- **Decision:** The prototype accrues a per-referral fee to the specialist practice (amount and trigger set per practice; default trigger is visit attended) and charges nothing. No field pays a PCP or a patient. Matching code cannot read fee terms; a test enforces it. ADR-004 still governs any real billing.
- **Why:** The handoff makes the specialist the payer. Our own research says that is the riskiest option: AO 26-15, Tex. Occ. Code 102.001, and none of the provider-distributed apps we found charge the receiving clinician per referral ([prototype-landscape-2026-11.md](research/prototype-landscape-2026-11.md)). A display-only ledger lets us test the story without taking that risk.
- **Revisit if:** counsel clears a specific specialist-paid structure, or rules it out (then switch the ledger to a flat, uniform, cost-based subscription, option B).

## ADR-009 · 2026-11-18 · Prototype one experience: the cancellation fill
- **Decision:** The prototype is built around one moment: a specialist's cancellation filled by a patient who is already PCP-qualified, insurance-checked and has her record ready. Both gyno and endo are in scope (the demo uses endo). The patient no longer picks a specialist or a time; she sets waitlist preferences and Attune offers openings. Rotterdam evidence scoring, draft ICD-10 codes and specialist ranking are removed from the product.
- **Why:** The [prototype handoff](product/prototype-handoff.md). It also removes the two features closest to diagnosis ("2 of 3 Rotterdam domains", drafted codes), which the handoff's non-negotiables rule out. This widens ADR-001 (gyno first) to gyno and endo.
- **What isn't proven:** No interview yet shows how DFW specialists fill cancellations or how often slots go empty (open question for specialist intake staff). Published fill data says per-offer acceptance is 8–11%, so single-offer tiers will be slow ([prototype-landscape-2026-11.md](research/prototype-landscape-2026-11.md)).
- **Revisit if:** specialist intake interviews show cancellations aren't a real pain, or that front desks won't post them outside their EHR.

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
