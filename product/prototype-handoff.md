# Prototype handoff

*2026-11-18 · From Seemona (design). Transcribed from the handoff PDF. The build lives on `feature/cancellation-fill`; the spec is `cancellation-fill` on `meta`.*

## What to build

Prototype one experience: **a specialist's cancellation gets filled by a patient who is already ready.** Everything else exists only to make that moment believable.

Attune is a patient-owned PMOS record that her PCP, gyno and endo all see, so she stops retelling her story at every visit. It feeds the clinic's EMR and does not replace it.

When a gyno or endo has a cancellation, Attune fills the slot from a waitlist of patients who are PCP-qualified, insurance-checked and have their record ready.

The specialist pays a per-referral fee. The PCP pays nothing. Patients pay nothing for the referral loop. *(See ADR-010: in the prototype this is a display-only ledger, and ADR-004 still governs any real billing.)*

**Not in the prototype:** community features, the daily note, real EMR connections, real billing, anything that diagnoses or recommends treatment.

**Terms:** PCP is the primary care physician. MA is the medical assistant who compiles and sends referrals, and the real daily user of the PCP screens. Gyno and endo are the two specialists.

## The journey: referral loop, 8 stages

Stages 1 to 4 build and qualify the referral, stage 6 is the step the specialist pays for, and stage 8 returns the outcome to her record.

| # | Who | What happens | Screens |
| --- | --- | --- | --- |
| 1 | Patient | Answers three onboarding questions (top symptoms, what she wants help with, what she has tried) and starts a 60-second daily check-in. Her record exists from here. | Onboarding, Check-in |
| 2 | Patient, MA | She shares her record with her PCP by QR code or share code. The MA sees it on one page. | Patient: Share with my doctor. PCP: Patient lookup, Record view |
| 3 | PCP, MA | Picks gyno or endo, writes the reason, signs "I evaluated this patient", sends. No fax, no hunting for the right specialist. | PCP: Referral builder |
| 4 | Attune | Checks the referral is complete against the specialist's criteria, then checks insurance. She photographs her card. | Patient: Insurance card. PCP: Status board |
| 5 | Patient | Lands on the waitlist and sets distance, telehealth yes or no, days and times, and the shortest notice she can handle. | Waitlist preferences, status card on Home |
| 6 | Specialist, Attune, patient | The practice posts a cancellation. Attune offers it to the best-fit patient with a countdown. She accepts and the slot is booked. | Specialist: Post cancellation. Patient: Offer, Booked |
| 7 | Specialist | Intake sees her one-page Patient Pack before she arrives. She confirms nothing has changed the day before. | Specialist: Filled slot, Patient Pack |
| 8 | Specialist, PCP, patient | The specialist uploads a visit summary. It lands in her record and the PCP's inbox, and the referral closes. | Specialist: Visit summary. PCP: Inbox. Patient: After-visit summary |

The **Patient Pack** is the one-page record Attune builds for a clinician: her story in her own words, the PCP's referral note, labs, symptom trends, meds and insurance. Display only.

## Screens to build

| Surface | Screens |
| --- | --- |
| Patient app (mobile) | Onboarding, Home, Daily check-in, My Record, Share with my doctor, Insurance card, Waitlist preferences, Offer (accept, decline, countdown), Booked confirmation, Patient Pack, After-visit summary |
| PCP portal (web, built for the MA) | Patient lookup, Record view, Referral builder, Status board, Inbox for specialist summaries |
| Specialist portal (web, built for the front desk) | Practice criteria, Post cancellation, Filled slots, Patient Pack, Visit summary |
| Ops (can be mocked) | Insurance exception queue, provider directory |

Home is the only patient home screen. It shows a live offer first, then referral status, then the check-in prompt, and ends with "You're caught up." No red dots or badges.

## Rules that make the fill work

A waitlisted patient gets an offer only if all of these are true:

- Her referral is PCP-signed, complete for the specialist's criteria, and insurance-verified within the last 24 hours.
- The slot's provider matches the specialty she was referred to. The practice accepts her plan.
- The slot is within her distance (or telehealth, if she said yes), inside her days and times, and no sooner than her shortest notice.
- She has no other live offer.

**Order:** PCP urgency flag first, then longest on the waitlist, then nearest. Never rank by payer or any patient trait. The specialist cannot see the queue or pick patients. Their only lever is the acceptance criteria they publish.

| Time until slot | Hold window | Offers sent at once |
| --- | --- | --- |
| More than 48 hours | 2 hours | 1 |
| 24 to 48 hours | 1 hour | 1 |
| 4 to 24 hours | 15 minutes | 2 |
| Under 4 hours | 5 minutes | 3 |

These are starting defaults. Keep them in config.

- First to accept wins. The others see "That slot just filled. You're still on the list."
- Tapping Accept is her consent to share her Patient Pack with that specialist. The practice sees nothing about her before then.
- If nobody takes the slot it closes as Unfilled, with a reason, and the practice sees why. Never promise a date or queue position on the waitlist.

**Statuses to model**

- Referral: Draft, Sent, Needs info, Qualified, Insurance pending, Insurance issue, On waitlist, Offered, Booked, Seen, Summary received, Closed.
- Slot: Open, Offering, Filled, Confirmed, Completed, Unfilled, Withdrawn.
- Offer: Pending, Accepted, Declined, Expired, Superseded.

**Fee:** charged to the specialist practice only. Amount and trigger are set per practice in config, and the default trigger is visit attended. The prototype shows fees accruing in a ledger and charges nothing. No field or screen pays a PCP or a patient anything.

## Build real, fake the rest

| Piece | Prototype approach |
| --- | --- |
| Matching, offers, hold timers, statuses | Build for real. Add a demo mode that shrinks hold windows to seconds. |
| Insurance check | Fake it. A manual "verified" toggle in the ops screen, or seeded results. |
| Specialist directory | Seed a few practices. |
| EMR | None. Export the Patient Pack as a PDF and a secure link. |
| Off-network specialist (fax fallback) | Mock the send and show the packet that would go out. |
| Notifications | Real push if easy, otherwise in-app banners. No health details in the text. |
| Fee ledger | Show it accruing. Charge nothing. |

## Demo scenario to build around

1. Ari's PCP refers her to an endocrinologist. Her record and insurance are ready, so she is on the waitlist.
2. The endo's office posts a cancellation for tomorrow afternoon.
3. Ari gets an offer with a countdown and accepts.
4. The endo's front desk opens her Patient Pack. She does not retell her story.
5. The endo uploads a visit summary. It appears in Ari's record and the PCP's inbox, and the referral closes.
6. The ledger shows one fee owed by the endo's practice and nothing owed by anyone else.

## Non-negotiables

- Display only and non-diagnostic. The app never names a condition, scores severity or recommends treatment. The PCP decides who is qualified for a referral.
- Consent is per section and per recipient, revocable, and logged. She can see who viewed her record.
- No health details in push, SMS or email text.
- Patient screens: text 14px or larger, no red notification dots, no infinite scroll.
- Look: ethereal editorial, feminine, never bubbly. Colors: Orchid Wine #5A1428, Raspberry #8E3853, Dusty Rose #AE6679 (large type only), Clay #C2A08B, Blush #F0C9C8, Bone #F4EBE4, Cream #FAF4EE, Forest #2E3A2A (body text). Instrument Serif Italic for voice, Instrument Sans for the interface. The clinician portals use the same colors, plainer and denser.
- The product name is Attune. Keep it in one constant.

## Open items

- **Fee legality:** a healthcare attorney must clear the specialist-paid fee before any real billing. The prototype only shows the ledger.
- **Navigation:** default is Home plus two header icons (Record and Care team). The designer should confirm whether a small tab bar is allowed.

## Concept boards

Three boards came with the handoff: [design-concepts/](design-concepts/README.md). Only the look and the onboarding and check-in patterns apply to the prototype; the rest is later or out of scope.
