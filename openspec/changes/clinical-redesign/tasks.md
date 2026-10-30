## 1. Design system (apps/web)
- [x] 1.1 Research and write `DESIGN.md`; tokens with contrast check.
- [x] 1.2 Self-hosted fonts, focus ring, shared components, mark.
- [x] 1.3 Remove `theme.ts`; every view on tokens.

## 2. Held time (packages/domain)
- [x] 2.1 `openSlots`, `requestedSlot`, `holdSlot`, `confirmRequestedSlot`, release on switch and revoke.
- [x] 2.2 FHIR `occurrenceDateTime`; `nextStep` label.
- [x] 2.3 Tests: confirm books, refused before delivery, actor and no-hold refusals, switch releases, offer path, revoke releases, FHIR.

## 3. Views (apps/web)
- [x] 3.1 Patient: three-step booking, status screen, honest placeholders, diagnosis-style labels removed.
- [x] 3.2 PCP admin: review checklist, one decision row, held time shown.
- [x] 3.3 Specialist admin: confirm requested time as primary action.
- [x] 3.4 Guide at `/guide/` with recaptured screens; demo hub at `/demo/`.

## 4. Verify
- [x] 4.1 `npm run check` passes.
- [x] 4.2 Headless Chrome on the combined Pages build: no horizontal scroll at 390, fonts load, no failed or third-party requests.
- [ ] 4.3 Clinician advisor reviews patient and clinical copy.
- [ ] 4.4 Real iOS Safari and Android Chrome; screen reader pass.
- [ ] 4.5 Patient session with the guide; findings on `business`.

## 5. Handoff
- [x] 5.1 Update handoff.md.
