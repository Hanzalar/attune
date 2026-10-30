# Handoff: referral-loop-pcp-obgyn

| Field | Value |
| --- | --- |
| Change ID | `referral-loop-pcp-obgyn` |
| Current stage | `ready_for_review` (implemented on develop; phone and stakeholder checks open) |
| Active agent & tool | Claude Opus 5.5 via Claude Code (VS Code), 2026-10-30 |
| Code branch | `develop` (initial commit; first change landed directly while bootstrapping the repo) |
| Specs branch | `meta` |

## 1. Work completed
- Domain package with lifecycle, consent, sign-off, coverage, ranking, evidence, codes, FHIR, agent follow-ups and demo data.
- Patient, PCP admin and specialist admin pages plus landing page, ported from the prototype artifact.
- CI (typecheck, tests, build, drift check, promotion gate) and Pages preview workflow.

## 2. Decisions and deviations from the prototype
- mFG threshold 6 (2023 guideline 4 to 6) instead of 8.
- Draft codes are symptoms (N91.5, L68.0, L70.0, E88.819); prototype's E28.2 and N91.4 removed because suspected
  conditions are not coded in outpatient settings.
- Separate `visited` and `closed` stages; physician co-sign stage for HMO and POS.
- Clinician console moved into specialist admin as the provider tab; integrations roadmap moved to the business branch.
- Interviewee names removed from all UI copy; the repo is public.

## 3. Verification evidence
```
$ npm run check
 Test Files  2 passed (2)
      Tests  22 passed (22)
✓ built in 2.02s
```
Headless Chrome (puppeteer-core, system Chrome), preview build with base `/attune/`, three tabs:
`pcp sees: true · spec inbox arrived: true · patient book btn: true · pcp outcome shown: true · activity entries: 7 ·
patient closed: true · patient scrollWidth@390: 390 · pcp scrollWidth@390: 390 · errors: none`.

Not verified: real iOS Safari and Android Chrome, screen readers, the live Pages URL.

## 4. Blockers and deferred scope
- Cross-device sharing needs `shared-record-api`; today the record is per browser.
- Real e-fax, Direct/360X, portal pull and auth are out of scope.

## 5. Next action
1. Confirm the Pages site is live, then walk the loop on a phone (tasks 3.3).
2. Review clinical copy (thresholds, codes, gaps) with a clinician advisor before any external demo.
3. Start `shared-record-api`.
