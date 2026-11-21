# Handoff: cancellation-fill

| Field | Value |
| --- | --- |
| Change ID | `cancellation-fill` (supersedes the design-system and patient-walkthrough parts of `clinical-redesign`) |
| Current stage | `verifying` (built and walked in a browser; device, copy and legal checks open) |
| Active agent & tool | Coding agent in VS Code, 2026-11-18 |
| Code branch | `feature/cancellation-fill` from `feature/clinical-redesign` at `f93f65a` (stacked: clinical-redesign isn't merged yet) |
| Specs branch | `spec/cancellation-fill` from `spec/clinical-redesign` |
| Business branch | `docs/prototype-handoff` from `business` |
| Landing branch | `landing-cancellation-fill` from `landing` |

## 1. Work completed
- Domain rewritten around the fill (see design.md); 29 tests.
- Every view rebuilt: patient app, PCP portal, specialist portal, ops, demo hub. `/guide/` removed.
- Design system replaced: handoff palette, Instrument Serif and Instrument Sans (self-hosted), code-drawn blooms
  and torn paper. IBM Plex and the navy palette are gone from the app and the landing page.
- Business docs: handoff, concept boards, research, ADR-009 to 011, open questions.
- Constitution and component rules updated, synced, installed.

## 2. Decisions and deviations
- The specialist-paid fee is a display-only ledger (ADR-010). This conflicts with ADR-004's direction for real
  billing, which still stands until counsel answers.
- Evidence scoring and ICD-10 drafting are removed (handoff: never name a condition or score severity).
- Physician attestation is required on every referral; the MA prepares.
- Share codes need her date of birth; batch offers say others got them too; texts fit one SMS (research).
- Not adopted, recorded as open questions: quiet hours, a 2-at-once fallback for 24 h+ tiers, longer holds or
  translated texts for patients who accept less often.
- Off-Attune fax/Direct fallback and insurance checks are mocked and labelled so.
- No AI attribution in commits, PRs or product files, per the user.

## 3. Verification evidence
```
$ npm run check
 Test Files  3 passed (3)
      Tests  29 passed (29)
✓ built in 2.95s
$ npx openspec validate cancellation-fill --strict
Change 'cancellation-fill' is valid
$ node scripts/agents-sync.mjs install --repo ../attune
[agents:install] Verified 12 targets. Updated 12 file(s).
```
Headless Chrome 157 over CDP against the Vite dev server (scenario script, synthetic data):
```
1 ari status: on_waitlist
2 posted: true | slot: offering 2026-11-19T20:40:00.000Z | offers to: [ 'p-ari', 'p-jb' ]
2 front desk sees a patient before accept? false
3 accept: true | ari status: booked | JB offer: superseded
4 pack shows story: true | view logged: true
4b slot: confirmed
5 ari status: closed | pcp notice: true | pcp inbox has summary: true | patient summary: true
6 ledger: [["bluebonnet-endo",4000,false]]
6 hub: All six steps done
gone: That slot just filled. You're still on the list.
overflow demo/patient(390)/pcp/specialist/ops: 0 · fonts: Instrument Sans, Instrument Serif italic
hosts requested: localhost:5180 · errors: none
```
Not verified: real iOS Safari and Android Chrome, screen readers, camera capture and QR scanning on a phone, the
built Pages site under `/attune/` with the landing overlay, the live preview URL.

## 4. Blockers and deferred scope
- Attorney review of the specialist-paid fee (ADR-010) before any billing; FDA CDS check before clinician launch.
- No interview evidence yet on how specialists fill cancellations (ADR-009).
- The concept board `pro-and-shop.png` names a real physician; replace with a placeholder before pushing `business`.
- `act()` doesn't return created ids, so the share screen predicts the next code; a server store should return it.
- Share-code lockout after failed attempts is deferred (needs an attempt log outside pure commands).

## 5. Next action
1. Review and push in order: `docs/prototype-handoff` into `business`, `spec/cancellation-fill` into `meta`
   (develop CI's drift check reads `meta`), then `feature/clinical-redesign` and `feature/cancellation-fill` into
   `develop`, then `landing-cancellation-fill` into `landing`.
2. Phone pass on the preview; clinician copy review; specialist intake interviews.
