## 1. Business inputs (business branch, `docs/prototype-handoff`)
- [x] 1.1 Prototype handoff transcribed to `product/prototype-handoff.md`; concept boards in `product/design-concepts/` with scope notes.
- [x] 1.2 Competitor research: `research/prototype-landscape-2026-11.md` (fill mechanics, B2B2C, PMOS apps, consent UX).
- [x] 1.3 ADR-009 (scope), ADR-010 (fee ledger only), ADR-011 (look); new open questions.

## 2. Domain (packages/domain)
- [x] 2.1 World model, config (hold policy, freshness, demo speeds, `PRODUCT_NAME`), labels.
- [x] 2.2 Commands with actor and state checks; append-only audit with `shared`; agent `settle`.
- [x] 2.3 Criteria completeness, eligibility with skip reasons, order, hold rule, unfilled reasons.
- [x] 2.4 Consent per section and recipient, share codes with date of birth, view log, Pack consent on accept.
- [x] 2.5 Fee ledger (specialist only, not billed); PHI-free notices; BSeR FHIR bundle; synthetic demo world.
- [x] 2.6 Tests: 29 covering the full loop, refusals, races, expiry, pause, withdraw, consent revocation, fees, fallback, fee/plan invariance and source scan, notice text.

## 3. Views (apps/web)
- [x] 3.1 Design system: tokens, self-hosted Instrument fonts, kit, Bloom, torn Paper, DESIGN.md.
- [x] 3.2 Patient app: 12 routes per the handoff, including the "slot just filled" and "hold ended" states.
- [x] 3.3 PCP portal: lookup, record view, builder with criteria preview and mocked EMR attach, fallback preview, sign-off, board, inbox.
- [x] 3.4 Specialist portal: post with policy preview, openings, slot detail and summary, Pack with print and link, criteria.
- [x] 3.5 Ops (mocked) and demo hub with the live six-step checklist and demo clock.
- [x] 3.6 Removed `/guide/`; README and Pages workflow comment updated.

## 4. Governance (meta)
- [x] 4.1 Constitution rules 1–4 and 9; domain and web component rules; synced and installed into the code checkout.

## 5. Landing (landing branch, `landing-cancellation-fill`)
- [x] 5.1 Rebuilt in the new look; claims limited to what the prototype does; `/guide/` links removed.

## 6. Verify
- [x] 6.1 `npm run check` passes.
- [x] 6.2 Headless Chrome walk of the six-step scenario: all steps done, no console errors, only localhost requested, no horizontal scroll (patient at 390px, others at 1280px).
- [ ] 6.3 Real iOS Safari and Android Chrome; screen reader pass; camera capture and QR scan on a phone.
- [ ] 6.4 Clinician and patient copy review.
- [ ] 6.5 Specialist intake interviews on how cancellations are filled today (ADR-009 gap).
- [ ] 6.6 Attorney review of the specialist-paid fee before any billing (ADR-010).

## 7. Handoff
- [x] 7.1 Update handoff.md.
