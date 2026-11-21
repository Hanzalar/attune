# Why
Patients bounce between providers and chase referrals by phone (`business` branch, `discovery/referral-gap.md`,
Patient row). Booking a specialist should feel like booking any appointment: pick a doctor, pick a time, done. The
demo also needed to look like trustworthy clinical software, built from Attune's own design system, before it is shown
to patients, MAs and front desks. Patient sessions need a walkthrough page so the team can run them consistently
(patient questions in `open-questions.md`).

# What Changes
- **Attune Clinical UI:** a design file (`apps/web/DESIGN.md`) and tokens (`src/design/tokens.ts`) based on EHR
  usability guidance (NIST GCR 15-996, NHS colour guidance). One palette across all views, self-hosted IBM Plex,
  status never by colour alone, WCAG AA contrast, two-tone focus ring. Every view and the shared kit use it.
- **Held time (domain):** the patient picks an open slot when choosing the specialist (`holdSlot`). The time is held
  until the specialist office confirms it (`confirmRequestedSlot`), which books the visit. The office can still offer
  another time. Switching specialist or revoking after delivery releases the hold. The time travels in the FHIR
  ServiceRequest as `occurrenceDateTime`.
- **Patient app:** the Referral tab becomes a three-step booking flow (doctor and time, what's shared, review and
  send) and then a status screen. The diagnosis-style "Insulin-resistant type" badge and the "Suggested for your
  type" supplement line are removed. Placeholder controls are disabled and say so.
- **PCP admin:** numbered review checklist ending in one decision row; the held time shows next to the specialist.
- **Specialist admin:** "Confirm <time>" is the primary action when the patient held one.
- **Patient walkthrough:** `/guide/`, a plain-language guide to the patient app with captured screens and collapsed
  presenter notes. Linked from the demo hub.
- The demo hub moves from `/` to `/demo/` so the landing page (change `landing-site`) can own the site root.

# Capabilities
## New Capabilities
- `booking`: patient-held time confirmed by the specialist office.
- `design-system`: Attune Clinical UI.
- `patient-walkthrough`: patient-facing guide.

# Impact
`packages/domain` (types, referral rules, demo data, FHIR, tests), `apps/web` (all views, shared kit, new design
folder, guide), `.github/workflows/pages.yml` (landing overlay, see `landing-site`), generated agent files.
Excluded: real scheduling integration, slot inventory from practice systems, translations.
Regulatory gates touched: consent (held time released on revoke) and PCP sign-off (confirming still requires
delivery, which requires the signature). No change to ranking inputs. Clinical copy review is still open.
