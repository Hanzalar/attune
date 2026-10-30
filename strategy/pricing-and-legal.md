# Who pays

The per-patient fee matters least to the numbers and carries the most legal risk. In the Sprint 3 base case, physician fees are about 1% of Year 3 revenue and subscriptions carry the rest. Our docs still disagree on the fee: the brainstorm says $10 to $20 per qualified referral; the financial model uses $40 per booking.

| Option | Who pays, how | Fits the evidence | Main risk |
| --- | --- | --- | --- |
| **A. Patient pays** | The agent is part of Plus ($25 a month in the model). Specialists and PCPs use it free. | Patients feel the pain most. A paid PCOS program's pilot patients paid $200 a month, and some offered over $1,000 for a program (Operator-1). | Price untested; the $12 vs $15 page test hasn't run. Plus churns after the booking (model assumes 50% drop back to Base). |
| **B. Specialist subscription** | Flat monthly fee for the specialist inbox, intake pre-fill and cancellation fill. Same price for every practice, not tied to patient volume. | Specialists are the bottleneck and gain filled cancellations and less intake work (SPEC-1, PCP-1). | Practices may not pay for software. A subscription can still fail the safe harbor if pricing isn't uniform and cost-based. |
| **C. Per-referral or per-booking fee** | $10 to $20 per qualified referral, or $40 per booked new patient. | Matches "charge the specialist, not the PCP" (PCP Referral Findings). | Highest legal risk: a fee per patient sent is payment that varies with referrals. Texas bans paying for patient referrals whatever the payer. |

## Why the legal risk is real

- **HHS-OIG Advisory Opinion 26-15 (July 2026)** ruled against a referral-software platform where home health agencies paid subscription fees to receive hospital referrals electronically. The fees failed the referral-services safe harbor because they were not uniform and not limited to the cost of running the service. OIG also flagged steering patients by who pays ([Barnes & Thornburg summary](https://btlaw.com/en/insights/alerts/2026/hhs-oig-issues-unfavorable-advisory-opinion-on-pay-to-play-referral-software-platform-arrangement)).
- **Texas Occupations Code 102.001** makes it an offense to pay or accept payment for securing or soliciting patients ([text](https://texas.public.law/statutes/tex._occ._code_section_102.001)).
- **Zocdoc** charges per new-patient booking, and it took favorable OIG opinions plus Medicare and Medicaid carve-outs to make that work (see [competitive-landscape.md](../research/competitive-landscape.md)).

We are not lawyers. This is the question for the $5K attorney review already in the model.

## Where we lean (pending counsel)

Lead with **A**. If specialists pay at all, use **B** with one flat, uniform, cost-based price that doesn't depend on referral volume. Drop **C** from the deck until counsel says otherwise. See ADR-004 in [decisions.md](../decisions.md).

**Design that lowers the risk under any option** (built and tested): the agent ranks specialists by the patient's criteria (network, soonest opening, PMOS experience, distance) and never by who pays; non-partner specialists are always shown; cancellation-fill order is first-come and can't be bought.
