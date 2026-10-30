# EHR and EMR integration

Reading records is mostly solved by regulation. Writing into someone else's EHR is not. So v1 reads through patient-authorized APIs and pushes by fax and Direct.

Certified EHRs must offer a standard FHIR API for patients (ONC criterion 170.315(g)(10), authorized through SMART on FHIR), but that API is **read-only** ([ONC API resource guide](https://onc-healthit.github.io/api-resource-guide/g10-criterion)).

## Where the record comes from (all patient-authorized)

| Source | How | What it gives | When |
| --- | --- | --- | --- |
| Attune tracker | Native | Cycles, symptoms, trials, adherence, photos | v1 |
| Patient upload | Photo or PDF; agent extracts and dates it | Old visit notes, lab printouts, imaging reports | v1 |
| Patient portal pull | Patient connects her portal through the (g)(10) FHIR API (Epic MyChart, athenahealth and others) | Problems, meds, labs, visit notes in US Core format | Pilot with 1 or 2 EHRs |
| TEFCA Individual Access Services | Through a QHIN that offers IAS (e.g. Epic Nexus participants, Health Gorilla) after IAL2 identity proofing | Records across organizations without one login per portal | v1.5 |
| Lab results network | National network or aggregator, under the patient's authority | Lab results without the MA hunting through lab portals | v2, confirm Quest and LabCorp coverage |

Never use treatment-purpose aggregator access for a patient app. Epic is in litigation with aggregators over exactly this (see [competitive-landscape.md](../research/competitive-landscape.md)).

## Where the packet goes

| Phase | Path | What the office sees |
| --- | --- | --- |
| **v1** | E-fax PDF with delivery receipt; Direct secure message sent as a **360X** package (C-CDA referral note plus HL7v2 order) where the office has a Direct address | Lands in the Athena fax bucket or the Epic/athena referral inbox. Nothing changes at the office. |
| **v2** | SMART on FHIR app the specialist launches inside their EHR to view the Attune record. Listing paths: Epic Connection Hub, athenahealth Marketplace. | The Attune record inside the chart, read-only |
| **v3** | Vendor partner APIs (or a partner like Medsender) file the packet and referral status into the chart | Referral and status filed directly; one deal per vendor |

Internally the referral is modelled as HL7 **BSeR** ServiceRequest + Task with a FHIR Consent, so moving from v1 to v3 changes transport, not the data model. The demo's specialist admin shows the bundle under "Intake settings".

## By EHR named in interviews

| EHR | Who runs it | v1 path | Next step |
| --- | --- | --- | --- |
| Tebra | Independent PCPs we interviewed | PDF for the EMR + e-fax out; Tebra sends referrals by eFax or Direct but stops at "sent" | Patient API pull (planned) |
| athenahealth | Specialist practices we interviewed | Lands in the athenaFax bucket; Direct/360X where enabled | SMART app via Marketplace; Medsender-style write-back |
| Epic | Hospital systems, larger groups | E-fax or Direct/360X (Epic supports 360X) | Connection Hub listing |

## Questions to settle

- Is Attune covered by HIPAA once it sends records on a patient's behalf, or is it a consumer app the patient directs? See ADR-007 in [decisions.md](../decisions.md).
- What can partner practices sign: a BAA, a data-use agreement?
- Which EHRs do our first 5 DFW OB/GYNs and 5 PCPs run, and which have a Direct address?
