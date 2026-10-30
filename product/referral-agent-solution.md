# Attune: PMOS referral agent

Oct 30, 2026 · de-identified copy of the team's solution doc

## At a glance

No one owns a PMOS patient between providers. Attune should give her an agent that does it for her. Across 49 journal interviews, every side works around the same handoff gap. PCP medical assistants (MAs) fax packets by hand and use ChatGPT to find specialists. Specialists get partial records and retake the history. Patients spend 4 to 5 years and 3 to 5 providers getting to a diagnosis.

**Proposal:** a patient-owned referral agent built on the Attune tracker. It turns her check-ins, portal records and labs into a referral packet. It finds an in-network OB/GYN with open slots, gets the PCP's sign-off, sends the packet the way each office already works (fax and Direct today, FHIR later) and follows up until the visit happens. The agent drafts every step and a human approves it: the patient approves sharing and booking, and the PCP's MA approves the clinical referral.

**First loop:** PCP to OB/GYN in DFW. That's where our PCP contact sees the highest referral volume, where our warm physician contacts are, and where gynos keep PMOS patients long term. Endo and fertility specialist (REI) handoffs come next.

**Money:** three options in [pricing-and-legal.md](../strategy/pricing-and-legal.md). The specialist booking fee needs an attorney's review before anything is charged.

## Two findings that shape it

1. **Retelling isn't only a records problem.** Specialists take their own history no matter what (SPEC-1). The packet should save the specialist time on records, labs and timeline, not replace intake.
2. **Gynos refer PMOS in, not out** (Sprint 3 ledger). So the first loop gets her **to** the gyno, from the PCP or on her own.

## The loop, step by step

Each step has one person who approves it.

| # | Agent does | Who approves | Replaces today |
| --- | --- | --- | --- |
| 1 | Spots a referral trigger in the tracker: cycles over 35 days, a symptom trend, a trial that didn't work. Or the patient asks. | Patient | Waiting until symptoms are at their worst |
| 2 | Pulls her history: portal notes, LabCorp or Quest labs, uploaded PDFs, tracker data. Builds a one-page packet mapped to the Rotterdam criteria. | Patient (reviews what's shared) | MA pulling notes and labs from separate systems |
| 3 | Checks her plan: does it need a PCP referral (HMO, POS) or not (most PPOs)? Which ICD-10 codes fit? | None (lookup) | MA and insurer back-and-forth |
| 4 | Shortlists in-network OB/GYNs with the soonest openings and PMOS experience. Pulls verified fax, Direct address and NPI. | Patient picks one | MA asking ChatGPT, filing cabinet, wrong fax numbers |
| 5 | Sends the PCP office a pre-filled referral with the packet and draft codes. | PCP MA signs (physician where the plan requires it) | MA building the packet from scratch |
| 6 | Delivers the packet the way that office receives it: e-fax, or Direct as a 360X package; FHIR later. | None (after sign-off) | Fax with no receipt |
| 7 | Books a slot or joins the cancellation waitlist. Confirms the referral was received. | Patient confirms the time | "Where's my referral?" calls |
| 8 | Prepares the visit: intake summary for the specialist, question list for the patient. | Patient | Retelling the history from scratch |
| 9 | Closes the loop: visit outcome back to the PCP, tracker plan updated, next check-in set. | Patient | PCP losing sight of the patient after the fax |

**Design rules from the interviews**

- Nothing goes to a clinician without the patient's approval, and no referral is sent without the PCP's sign-off.
- The agent never diagnoses. It maps evidence to criteria, with the source of each item.
- Every output fits how the office already works. A fax that lands in Athena still counts.
- Matches are ranked by the patient's criteria, never by who pays Attune, and include non-partner specialists.

These rules are enforced and tested in `packages/domain` on `develop`.

## What each side sees

One shared record, three views. All three are live in the demo.

**Patient app (phone).** A referral tracker (packet ready, PCP signed, sent, received, booked, visit done), three OB/GYN matches with network status, soonest opening and distance, one approve button per step with a plain list of what gets shared, a cancellation-waitlist toggle, and "stop sharing" at any time.

**PCP admin (web, no install).** A queue of agent-drafted referrals: reason, draft ICD-10 codes to confirm, plan type, matched specialist with verified fax and NPI. One-click sign-off, PDF for Tebra or any EMR, status after sending (received, booked, seen), a practice list of trusted specialists, and an activity log.

**Specialist admin (front desk and provider).** Pre-qualified referrals: insurance checked, packet attached, Rotterdam evidence on one page with a source per item. Accept and offer a slot, request more records, or decline with a note. Cancellation fill offers an open slot to the next referred patient whose record is ready. The provider console shows trends, trial response and open lab gaps.

**What each side gets**

- Patient: no chasing the referral, no retelling from memory, an earlier slot.
- PCP MA: minutes instead of a packet built from scratch, and no specialist hunting.
- Specialist: complete, pre-qualified new patients, filled cancellations, less intake work.

## Where this sits against Epic and others

Inside one Epic organization the loop is largely closed already (work queues, Fast Pass, the Emmie and Art agents). Attune's wedge is the cross-organization, mixed-EHR handoff the patient owns, such as a Tebra PCP referring to an athena OB/GYN, where today the referral stops at "fax sent". See [competitive-landscape.md](../research/competitive-landscape.md).

## Sources

Team material on the private Drive: Interview Journal (49 rows as of Oct 30), Sprint 3 Update deck, Sprint 3 Financial Model, PCP Referral Findings (Oct 10), Proposed Acquirers v2, prototype artifact. External sources are linked in the strategy and research docs.
