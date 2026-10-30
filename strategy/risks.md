# Risks

The biggest risk is that the agent saves time for people who don't pay. Each risk has a test that settles it.

| Risk | Why it could kill it | Test |
| --- | --- | --- |
| PCPs won't adopt a new view | They pay nothing today and the EMR vendor bundles AI (PCP-1). Tebra raised $250M for AI in Dec 2025. | Will an MA sign off on 5 agent-drafted packets in the pilot? Time it against a manual packet. |
| Specialists distrust patient data | One gyno called ovulation kits "worthless" (OBGYN-2); another found patient data helpful (OBGYN-1). | Show 3 DFW OB/GYNs a real dossier, then ask what they'd act on. |
| Fee breaks kickback rules | AO 26-15 and Texas 102.001 ([pricing-and-legal.md](pricing-and-legal.md)). | Attorney review before any specialist pays. |
| The agent becomes a regulated device | Interpreting hormone data could make it a medical device (Advisor, regulatory). Mapping to Rotterdam criteria sits close to that line. | $3K FDA product-code check from the Sprint 3 ledger, before launching the clinician view. |
| HIPAA status | Sending records for a patient may make Attune a business associate of the practices. | Counsel review; decide the BAA posture before the pilot (ADR-007). |
| Capacity, not paperwork, is the bottleneck | Specialists are booked a month or more out. A better packet doesn't create slots. | Measure how often cancellation fill moves a patient earlier. Epic's own Fast Pass sees 8 to 11% of offers accepted. |
| Patients skip the PCP anyway | About half already know their specialist, and PPO patients can self-refer. | Track how many pilot patients go straight to the gyno. If most do, make self-referral the main path. |
| Funded receiving-side AI moves upstream | Tennr, Assort and Luma already sell referral intake to specialists, and Epic is adding fax-referral automation. | Win on the patient-owned, cross-EHR side; feed their inboxes rather than replace them (competitive landscape, implication 7). |
