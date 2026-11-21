# Handoff: clinical-redesign

| Field | Value |
| --- | --- |
| Change ID | `clinical-redesign` (absorbs the earlier `patient-walkthrough-guide` draft) |
| Current stage | `ready_for_review` (PR open against develop; clinical review and real-device checks open) |
| Active agent & tool | Coding agent in VS Code, 2026-10-30 |
| Code branch | `feature/clinical-redesign` from `develop` at `969f30f`, head `f93f65a` |
| Specs branch | `spec/clinical-redesign` into `meta` |

## 1. Work completed
- Attune Clinical UI: `apps/web/DESIGN.md`, `src/design/tokens.ts`, self-hosted IBM Plex, shared kit rebuilt.
- Held time in the domain (`holdSlot`, `confirmRequestedSlot`) with 7 new tests.
- Patient app booking flow and status screen; PCP checklist with one decision row; specialist "Confirm time".
- Walkthrough at `/guide/` with 12 recaptured screens; demo hub moved to `/demo/`.
- Pages workflow overlays the `landing` branch on the site root (see `landing-site`).
- Constitution: fourth branch kind `landing`; web component rule now points at DESIGN.md and 44px tap targets.
  Synced on `meta` and installed into the code checkout.

## 2. Decisions and deviations
- IBM Plex Sans/Mono, self-hosted: UI-drawn, tabular figures, distinct I/l/1, and no font CDN sees patient IPs.
- Removed the patient-facing "Insulin-resistant type" badge and the "Suggested for your type" supplement line
  (product rule 4). The provider console still shows the phenotype pattern to clinicians.
- Confirming a held time books directly: the patient chose that time when approving, so a second tap adds nothing.
- Develop-side landing wiring is on this branch (it moves the demo hub this change restyles).
- No AI attribution in commits, PRs or product files, per the user.

## 3. Verification evidence
```
$ npm run check
 Test Files  2 passed (2)
      Tests  29 passed (29)
✓ built in 2.05s
$ node scripts/agents-sync.mjs install --repo ../attune --check
[agents:install] Verified 12 targets. Updated 0 file(s).
```
Headless Chrome on a `BASE_PATH=/attune/` build with the landing overlay applied, served under `/attune/`:
```
landing 390 {"sw":390,"plex":true}   landing 1280 {"sw":1280,"plex":true}
demo/ patient/ pcp/ specialist/ guide/ -> sw 390, plex true, broken images 0
hosts: localhost:8130 | failed: none | page errors: none
```
Patient flow at 390px: scrollWidth 390. PCP and specialist at 390px: scrollWidth 390, no page errors.
Dev-only console noise: recharts `defaultProps` warnings (library, not in production builds).

Not verified: real iOS Safari and Android Chrome, screen readers, the live Pages URL (404 on 2026-10-30).

## 4. Blockers and deferred scope
- Clinical copy review before any patient or clinician sees it.
- Guide screens are static captures; recapture when the patient UI changes (no capture script in the repo yet).
- Slots are demo data; real availability needs a scheduling integration and its own change.

## 5. Next action
1. Merge order: `spec/clinical-redesign` into `meta` first (develop CI's drift check reads `meta`), then
   `feature/clinical-redesign` into `develop`. `landing` is already pushed, so the Pages overlay can check it out.
2. Clinician advisor reviews copy; then a phone pass on the live preview.
