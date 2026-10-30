# Competitive landscape: referral loop

*2026-10-30 · Attune (UT Austin STC 384, DFW pilot). Claims I could not confirm are marked **(unverified)**.*

## At a glance

Within a single Epic organization, Epic already closes the referral loop with work queues, Cadence, MyChart self-scheduling, Fast Pass, and its Emmie/Art/Penny agents. It is now moving into fax intake: integrated eFax is live, auto-populated fax referrals are in development, and voice-AI referral scheduling is planned for 2027. Between organizations, Epic relies on Care Everywhere (Epic-to-Epic), EpicCare Link (a portal), and 360X. So a Tebra PCP referring to an athena OB/GYN still faxes. The well-funded AI vendors (Tennr, Assort, Luma, Notable, Medsender) all sell to the receiving specialist. I found no one offering a patient-owned packet that travels across EHRs, and the standards needed to build one already exist.

## 1. Epic

| Product | What it does | Who it serves | Where it stops for Attune | Source |
|---|---|---|---|---|
| Referral orders + work queues (Cadence) | Routes a referral record to a specialty scheduling work queue and tracks it to an appointment | Epic orgs | Works only inside one org. Inbound faxes are keyed in by hand | [UIowa](https://epicsupport.sites.uiowa.edu/epic-resources/care-everywhere), [MGB](https://eristest2-6.partners.org/wp-content/uploads/1.-Getting-Started-with-Referral-Scheduling-WQs.pdf) |
| Care Everywhere / CERM | Epic-to-Epic referrals and C-CDA exchange | Epic-to-Epic | OHSU reports access and integration barriers for non-Epic senders | [UC Davis](https://health.ucdavis.edu/referrals/ways-to-refer/how-to-use-CERM), [OHSU](https://digitalcollections.ohsu.edu/record/44677) |
| EpicCare Link | Web portal where outside clinicians submit and track referrals | Community referrers | The MA needs a separate login per health system. Nothing for the patient | [Roper St. Francis](https://rsfh.com/health-professionals/epiccare-link) |
| 360X over Direct | Closed-loop referrals with any vendor that meets the spec | Cross-vendor | Few live pairs; Epic names eCW and Netsmart. Tebra is not listed | [open.epic](https://open.epic.com/Clinical/EHRtoEHR), [DirectTrust](https://directtrust.org/what-we-do/direct-secure-messaging/360x) |
| MyChart Open Scheduling | New patients book open slots, with eligible visit types and payers set by each site | One org's patients | Shows a single org's slots and often requires a referral. No cross-network in-network search | [Watson Clinic](https://www.watsonclinic.com/services/mychart/open-scheduling.html) |
| MyChart Fast Pass | Offers cancelled slots to waitlisted patients. UCSF: 11% of offers accepted; Sutter: 8.3%; Loma Linda: patients seen ~30 days sooner | Epic orgs | Covers only patients already booked at that org | [UCSF/PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC10988365), [JMIR](https://jmir.org/2020/6/e16451/PDF), [Epic](https://www.epic.com/epic/post/patients-see-doctor-30-days-sooner-mychart-fast-pass) |
| MyChart Central | One Epic ID across linked MyChart accounts; live in all 50 states at UGM 2026 | Patients of Epic orgs | Epic orgs only. Patients can view records but cannot route a referral | [Epic](https://www.epic.com/software/mychart-central), [HIT Today](https://www.healthcareittoday.com/2026/08/19/epic-ugm-2026-judy-faulkner-keynote-and-cool-stuff-ahead/) |
| **Emmie** (patient), **Art** (clinician), **Penny** (revenue cycle) | Names confirmed, launched at UGM Aug 2025. Emmie schedules and reschedules by text. Art summarizes charts and places orders. Penny handles appeals and coding. UGM 2026 added **Agent Factory** (129 features live), Emmie in MyChart Central (coming soon), and **Voice AI Referral Scheduling** (2027) | Epic orgs | Every agent acts inside its own org. "Agentic scheduling for specialty referrals, Dec 2026" appears on a Becker's roadmap **(unverified)** | [Epic Emmie](https://www.epic.com/software/emmie), [HealthLeaders](https://www.healthleadersmedia.com/innovation/epics-grand-ai-gamble-can-ehr-giant-truly-build-connected-healthcare-universe), [HIT Today](https://www.healthcareittoday.com/2026/08/19/epic-ugm-2026-judy-faulkner-keynote-and-cool-stuff-ahead/) |
| Hello World + eFax | Epic-native patient texting. Integrated eFax is live, with auto-populated fax referrals in development | Epic orgs | Epic competing directly with Tennr for fax intake | [KLAS](https://klasresearch.com/report/epic-hello-world-2024-engaging-patients-with-epic-native-interactive-sms/3499), [HIT Today](https://www.healthcareittoday.com/2026/08/19/epic-ugm-2026-judy-faulkner-keynote-and-cool-stuff-ahead/) |
| Community Connect, Garden Plot, Orchard, Flower Pot | Hosted or sponsored Epic for small groups. Flower Pot (very small orgs) is "coming soon" | Independent groups | Epic's plan to absorb independents; solo practices on Tebra remain outside for now | [Garden Plot](https://prnewswire.com/news-releases/epic-launches-garden-plot-a-shared-environment-where-independent-medical-groups-can-grow-301497888.html), [HIT Today](https://www.healthcareittoday.com/2026/08/19/epic-ugm-2026-judy-faulkner-keynote-and-cool-stuff-ahead/) |
| Connection Hub | Self-attested app listing, ~$500/app/yr, requires a live connection | Vendors | Helps buyers find Attune but grants no write access | [Fierce](https://www.fiercehealthcare.com/health-tech/epic-plans-overhaul-its-app-market-opens-new-connection-hub-developers-here-are-key), [Epic VS](https://vendorservices.epic.com/Resources/OEC08) |
| Cosmos | De-identified data on ~300M patients; "Curiosity" predictions announced at UGM 2026 | Epic clinicians | Not a referral channel, but real-world-evidence depth Attune cannot match | [HIT Today stats](https://www.healthcareittoday.com/2026/08/20/great-stats-from-epic-ugm/) |
| Epic Nexus (QHIN) + TEFCA IAS | Patient-chosen apps (IAL2-verified, contracted with a QHIN, SMART confidential client) query Nexus participants | Patient apps | Attune's cleanest patient-directed records pull | [open.epic IAS](https://open.epic.com/Home/Interoperate/TEFCA/IAS) |

## 2. Other EHRs from interviews

| Product | What it does | Who it serves | Where it stops for Attune | Source |
|---|---|---|---|---|
| athenaOne | AI labels inbound documents. Agentic Waitlist Scheduling fills cancellations by text (H1 2026); AI self-scheduling and voice agent (H2 2026). Marketplace has 370+ apps | Specialists in our interviews | Fills only the practice's own schedule. Referral-fax intake is left to partners | [athena PR](https://www.athenahealth.com/press-releases/athenahealth-launches-agentic-patient-communication-tools), [Marketplace](https://www.businesswire.com/news/home/20230320005460/en/athenahealth-Enhances-its-Marketplace-Program-to-Strengthen-Customer-and-Partner-Success) |
| Tebra | Sends referrals from a signed note by eFax or Direct, tracks Sent/Failed, and lets staff mark the consult "received." Raised $250M for AI (Dec 2025) | Our PCPs | Outbound only: no slot finding and no specialist acknowledgment | [eFax](https://helpme.tebra.com/Clinical/Referrals/Send_a_Referral_by_eFax), [Referrals](https://helpme.tebra.com/Clinical/Referrals/Navigate_Referrals), [funding](https://www.bakersfield.com/ap/news/private-practice-platform-tebra-secures-250m-to-accelerate-ai-innovation/article_581d9b2b-1295-5f90-a3ed-2472251c94fe.html) |
| Oracle Health | New AI-first EHR (ambulatory first). Its Clinical AI Agent drafts referral orders | Health systems | Small footprint among DFW independents | [Healthcare Dive](https://www.healthcaredive.com/news/oracle-new-ehr-artificial-intelligence-ai/757588/), [Becker's](https://www.beckershospitalreview.com/healthcare-information-technology/ehrs/oracle-healths-biggest-moves/) |

## 3. Referral and intake vendors

| Product | What it does | Who it serves | Where it stops for Attune | Source |
|---|---|---|---|---|
| Tennr | AI intake of fax, portal, and email referrals. Tennr Network sends status to referrers and patients. $101M Series C (Jun 2025), $605M valuation | Specialists, DME | Paid for by the receiver; the patient does not own the data. Closest overlap with Attune's loop | [MobiHealthNews](https://mobihealthnews.com/news/tennr-raises-101m-automate-referrals-hits-605m-valuation) |
| Assort Health | "Referrals" agent (GA Aug 2026) handles extraction, triage, patient outreach, EHR booking, and referrer updates. $120M Series C, $1.2B valuation | Specialty groups | Strongest rival on the receiving side | [Fierce](https://www.fiercehealthcare.com/ai-and-machine-learning/assort-health-rolls-out-ai-agent-dedicated-referrals), [MobiHealthNews](https://www.mobihealthnews.com/news/assort-health-lands-120m-scale-patient-journey-ai-agents) |
| Luma Health | Referral outreach plus Smart Waitlist (vendor-reported 43–48% fill). Luma calls it Smart Waitlist; I found no product named "Fast Fill" | Specialists, FQHCs | Fills only its customers' own slots | [Luma](https://go.lumahealth.io/luma-smart-waitlist-for-oracle-health) |
| Notable | EHR-embedded agents for closed-loop referral tracking (Inova) | Health systems | Enterprise customers, mostly on Epic | [HIT Consultant](https://hitconsultant.net/2026/01/07/inova-health-partners-with-notable-to-scale-agentic-rcm-and-referral-automation/) |
| Medsender | AI fax intake with write-back to athenaOne and Tebra. $5M Series A (Jan 2025) | Small and specialty practices | A partner candidate rather than a competitor | [athenaOne](https://medsender.com/athenaone-integration), [funding](https://hitconsultant.net/2025/01/31/medsender-raises-5-for-ai-powered-workflow-automation-platform/) |
| Kyruus Health | Provider search and matching; direct booking into Epic | Health systems, payers | Covers one network's directory | [Kyruus](https://www.kyruus.com/news/kyruus-joins-the-epic-app-orchard-with-direct-scheduling-solution) |
| ReferralMD / Phreesia | Closed-loop referral SaaS / intake with a fax referral hub | Groups, specialists | Requires both sides to adopt it | [AdvancedMD](https://www.advancedmd.com/integrations/marketplace/referralmd/), [Phreesia](https://www.phreesia.com/solutions/multispecialty/) |
| Zocdoc | Charges per new-patient booking. Favorable OIG opinions (2019, 2023); qui tam suit dismissed; Medicare/Medicaid patients carved out | Patients, practices | Per-booking fees need an OIG opinion to be safe | [Rivkin Radler](https://rivkinradler.com/rivkin-rounds/zocdoc-fees-get-anti-kickback-approval), [McDermott](https://www.mcdermottlaw.com/case-study/zocdoc/) |
| **OIG AO 26-15** (Jul 2026) | Home health agencies' per-hospital subscription fees to receive e-referrals counted as remuneration. Fees were not uniform or cost-based, so no safe harbor applied | — | Rules out "specialist pays to receive" pricing | [Barnes & Thornburg](https://btlaw.com/en/insights/alerts/2026/hhs-oig-issues-unfavorable-advisory-opinion-on-pay-to-play-referral-software-platform-arrangement) |

## 4. Records access

| Product | What it does | Who it serves | Where it stops for Attune | Source |
|---|---|---|---|---|
| Health Gorilla | QHIN with an IAS patient-access API | Apps, labs | Viable IAS on-ramp, but Epic is suing it | [HG IAS](https://healthgorilla.com/home/use-cases/ias), [Epic suit](https://hitconsultant.net/2026/01/13/epic-health-systems-sue-health-gorilla-over-alleged-medical-record-syndicate/) |
| Particle, Zus, Metriport | Record aggregation via CommonWell/Carequality. Zus is a Candidate QHIN. Particle is suing Epic for antitrust ([MedTech Dive](https://www.medtechdive.com/news/epic-particle-health-antitrust-suit-moves-forward/759598/)) | Providers (Treatment purpose of use) | Not available to a patient app | [Zus](https://docs.zushealth.com/), [Metriport](https://metriport.com/medical), [RCE](https://rce.sequoiaproject.org/wp-content/uploads/2026/07/8.18.26-RCE-Info-Call_final.pdf) |
| CommonWell / Carequality | National exchange networks; CommonWell is a QHIN | Providers | Treatment queries only | [HIPAA Journal](https://www.hipaajournal.com/onc-expands-tefca-with-two-additional-health-information-networks/) |
| PicnicHealth / Ciitizen | Patient-directed record collection. PicnicHealth now focuses on life-sciences RWD. Invitae bought Ciitizen in 2021; it was reportedly relaunched as Citizen Health **(unverified)** | Patients, pharma | Shows patient-directed pulls work; neither is a referral tool | [PicnicHealth](https://hitconsultant.net/2023/10/23/ma-picnichealth-acquires-rare-disease-platform-allstripes), [Ciitizen](https://hitconsultant.net/2021/09/07/invitae-acquires-ciitizen) |

## 5. Standards prior art

| Standard | What it does | Who it serves | What Attune should adopt | Source |
|---|---|---|---|---|
| ONC/IHE 360X | Direct + XDM: an HL7v2 OMG^O19 order plus a C-CDA with a mandatory reason for referral; a return C-CDA closes the loop | Epic, athena, eCW, NextGen | **v1, alongside fax** | [ONC](https://oncprojectracking.healthit.gov/wiki/x/OIAeAQ), [open.epic](https://open.epic.com/Clinical/EHRtoEHR) |
| HL7 BSeR | FHIR ServiceRequest + Task + feedback. STU1 is published; STU2 is in ballot | eReferrals | **Internal data model and v2** | [STU1](https://hl7.org/fhir/us/bser/), [STU2](https://build.fhir.org/ig/HL7/bser/) |
| Da Vinci CDex | FHIR exchange of clinical data and attachments | Payers, providers | Optional for v3 | [CDex](https://hl7.org/fhir/us/davinci-cdex/) |
| SMART on FHIR + US Core ((g)(10)) | App authorization plus certified patient APIs | All certified EHRs | **Required** | [SMART](https://hl7.org/fhir/smart-app-launch/), [US Core](https://hl7.org/fhir/us/core/) |
| TEFCA IAS | National patient-directed query (IAL2) | Patient apps | **v1.5** | [open.epic IAS](https://open.epic.com/Home/Interoperate/TEFCA/IAS) |

## 6. PCOS/PMOS players

The renaming is confirmed: PCOS became PMOS on 12 May 2026 under a Lancet consensus led by Monash, with a three-year transition ([AAFP](https://www.aafp.org/afp/afp-community-blog/pcos-gets-a-new-name-polyendocrine-metabolic-ovarian-syndrome-pmos)).

| Product | What it does | Who it serves | Where it stops for Attune | Source |
|---|---|---|---|---|
| Allara Health | Virtual hormonal-care team, in-network with major payers. $26M Series B (Feb 2025) | US patients | Replaces the OB/GYN visit rather than routing to one. Could serve as a fallback destination | [BioSpace](https://www.biospace.com/press-releases/allara-health-raises-26-million-in-series-b-funding-to-revolutionize-womens-hormonal-healthcare) |
| Oova / Inito / Mira | At-home hormone strips (LH, E3G, PdG; Inito adds FSH). Mira says it does not diagnose PCOS | Trackers | Possible data imports for the dossier | [Oova](https://www.oova.life/blog/oova-vs-inito), [Mira](https://join.miracare.com/pcos) |
| Flo / Clue | Cycle apps with PCOS risk checkers. Flo's own study: 73–78% accuracy | Consumers | No clinician handoff | [JMIR](https://formative.jmir.org/2024/1/e65469), [Advisory](https://www.advisory.com/daily-briefing/2019/11/11/pcos) |

## Implications for Attune

1. **Don't compete inside Epic.** Within a single org, Epic's work queues, Fast Pass, and Emmie (plus the referral and voice agents coming in 2027) already close the loop. Attune should hand off to Epic in formats it ingests and go no further.
2. **The wedge is the cross-org, mixed-EHR handoff that the patient owns,** e.g. Tebra PCP to athena OB/GYN. Tebra stops at "fax sent," and athena's agents fill only the practice's own schedule.
3. **Emit 360X on day one.** Send Direct + XDM (C-CDA Referral Note + OMG^O19) alongside fax, so Epic and athena sites can consume the packet without custom work. Model the referral internally as BSeR ServiceRequest + Task, so moving to v2 SMART and v3 write-back only changes transport.
4. **Pull records only with the patient's authorization.** Use (g)(10) patient logins (MyChart Central gives one Epic ID), then TEFCA IAS through a QHIN. Never use Treatment-purpose aggregators: Epic is litigating against Particle and Health Gorilla over exactly this.
5. **Cancellation fill has to work across orgs.** Fast Pass acceptance runs 8–11%, and Luma and athena fill only their own customers' slots. Attune's value is matching a patient whose packet is ready to any in-network opening. Batch the offers and keep acceptance windows short.
6. **Don't charge specialists per referral.** AO 26-15 and Tex. Occ. Code 102.001 rule out per-packet or volume-tiered fees paid by the receiving office. If specialists pay at all, use a flat, uniform, cost-based subscription that doesn't depend on referral volume. Lead with the patient subscription. Zocdoc's model survived only because it obtained OIG opinions and carved out Medicare and Medicaid.
7. **Feed Tennr and Assort; don't fight them.** Their specialist customers already pay for intake, and structured Attune packets would make those inboxes cleaner. Tennr Network is the overlap to watch.
8. **Lean into PMOS.** A dossier built for the new criteria (cycles, androgens, metabolic labs, Inito/Oova data) is something generic referral tools won't build.
9. **Partners and acquirers:** Medsender for fax write-back into Tebra and athena. Tebra and athena Marketplace for distribution, and as possible buyers. Allara as the fallback when no in-network slot is open. Tennr, Assort, or Kyruus as acquirers that want the patient side.
