# The referral gap, by side

De-identified summary of the Interview Journal (49 rows as of Oct 30, 2026). Role IDs follow the [branch rules](../README.md).

Information and accountability drop at the handoff, and the patient is the only one who sees all of it.

| Side | What happens today | Where it breaks | Evidence |
| --- | --- | --- | --- |
| PCP (MA) | MA pulls SOAP notes or the annual physical write-up, pulls labs separately from LabCorp or Quest, then faxes everything. About 2 referrals per patient, 20 or more a day. | Finding an in-network specialist with a working fax number takes the most time. Faxes go missing. After sending, the PCP has no idea what happens. One referral was never entered and surfaced only when the patient called. | PCP-1, PCP-2, PCP Referral Findings |
| PCP (practice) | Pays nothing beyond the EMR (Tebra plus an AI scribe). The physician never touches referrals. | Weak buyer; the EMR vendor is already bundling AI. The physician quietly stops referring to bad specialists, with no shared list. | PCP-1 |
| Specialist intake | Faxes land in the provider's bucket in Athena. Schedulers call the patient. Outside records come by phone-and-fax requests or printouts the patient brings, scanned into the chart. | No clean way to move records across systems. Imaging often can't move, so patients sometimes pay for a repeat MRI. Records must be in the chart before they're used. | SPEC-1 |
| OB/GYN | Keeps PMOS patients long term. Refers out to REI for fertility only. | Lifestyle adherence between visits is the biggest friction (OBGYN-1). Patients rarely bring data, but when they do it's "helpful" (OBGYN-1). One gyno distrusts patient tracking data (OBGYN-2). Quality depends on which doctor you get (OBGYN-3). | OBGYN-1, OBGYN-2, OBGYN-3 |
| Endo / REI | Fertility and complex cases get referred in. | One gyno doubts endocrinology manages PMOS well long term (OBGYN-3). One patient's endocrinologist dismissed PMOS because her testosterone was normal (Patient A); another was told to "just lose weight" (Patient B). | OBGYN-3, Patient A, Patient B |
| Patient | Bounces between providers. About half already know which specialist they need (PCP-1's estimate). Some skip referrals: one found her OB by web search (Patient E), one was diagnosed through a friend's personal referral (Patient B). | About 5 years and 5 gynecologists to a diagnosis (Patient C). An REI referral went unused because insurance wouldn't cover it (Patient D). Several specialists and no one connecting them (Patient E). Specialists restart the history even when notes were sent (Patients F, G). | Patients B to G |

## What it means for the product

- The packet saves the specialist records, labs and timeline work; it does not replace their intake.
- The first loop is getting her **to** the gyno, because gynos refer PMOS in, not out.
- PPO patients who already know their specialist may skip the PCP. Track it in the pilot; if most do, self-referral becomes the main path.
- Specialists split on patient-logged data, so every evidence item shows where it came from.
