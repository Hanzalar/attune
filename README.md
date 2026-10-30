# Attune

A patient-owned referral agent for PMOS (formerly PCOS). It turns a patient's tracker data, portal records and labs into a referral packet, finds an in-network OB/GYN with open slots, gets the PCP office's sign-off, sends the packet the way each office already works, and follows up until the visit happens.

**Site (preview from `develop`):** https://hanzalar.github.io/attune/ serves the landing page from the orphan `landing` branch; the app lives under it.

| Page | Who uses it | URL |
| --- | --- | --- |
| Demo hub | Whoever presents the demo | [/attune/demo/](https://hanzalar.github.io/attune/demo/) |
| Patient app | The patient, on her phone (installable web app today) | [/attune/patient/](https://hanzalar.github.io/attune/patient/) |
| PCP admin | PCP medical assistant and physician | [/attune/pcp/](https://hanzalar.github.io/attune/pcp/) |
| Specialist admin | OB/GYN front desk and provider | [/attune/specialist/](https://hanzalar.github.io/attune/specialist/) |
| Patient walkthrough | Patients in a demo session | [/attune/guide/](https://hanzalar.github.io/attune/guide/) |

Open the three views in separate tabs and walk the loop: book a doctor and time on the patient app, sign in PCP admin, confirm the time in specialist admin. They share one record and update live. All people and practices are synthetic.

> **Planning does not live on this branch.** Business context is on the [`business`](https://github.com/Hanzalar/attune/tree/business) branch; specs, the agent constitution, handoffs and release evidence are on [`meta`](https://github.com/Hanzalar/attune/tree/meta). Read both before changing code.

## Branches

| Branch | Role | Who edits it |
| --- | --- | --- |
| `business` (orphan) | Product brief, de-identified discovery notes, competitor landscape, pricing and legal options, decisions | Whole team, including from the GitHub web editor |
| `meta` (orphan) | Agent constitution, OpenSpec specs and changes, handoffs, release reports | Anyone proposing or speccing a change |
| `landing` (orphan) | Public landing page, static files. The Pages build overlays it on the site root. | Whoever owns the public site |
| `develop` (default) | Integration. Feature branches `feature/<change-id>` start here and PR back here. Deploys the preview site. | Engineers and agents |
| `stage` | Release candidates, promoted from `develop` only | Through PR + promotion gate |
| `main` | Verified releases, promoted from `stage` only | Through PR + promotion gate |

The orphan branches share no history with code, so nothing merges across them by accident. Never merge `business`, `meta` or `landing` into a code branch, or the reverse.

## Layout

```
packages/domain   Business rules: referral lifecycle, consent, sign-off, coverage, ranking,
                  Rotterdam evidence mapping, draft ICD-10 codes, FHIR (BSeR) shapes. Pure TS, unit tested.
apps/web          Vite + React. One build: /demo/, /patient/, /pcp/, /specialist/, /guide/.
                  Design system: apps/web/DESIGN.md (Attune Clinical UI), tokens in src/design/tokens.ts.
scripts           check_promotion.py: fail-closed gate for PRs into stage and main.
release           acceptance.json lands here when a build is promoted.
```

Agent instructions (`AGENTS.md`, `CLAUDE.md`, Copilot, Cursor and others) are generated from `meta`. Don't edit the managed blocks by hand.

## Run it

```bash
npm ci
npm run dev        # http://localhost:5173/demo/  (also /patient/, /pcp/, /specialist/, /guide/)
npm run check      # typecheck, unit tests, production build
```

## Work on it

```bash
git clone https://github.com/Hanzalar/attune.git && cd attune      # lands on develop
git worktree add ../attune-meta meta                                 # specs and governance
git worktree add ../attune-business business                         # business docs
git worktree add ../attune-landing landing                           # public landing page
git switch -c feature/<change-id>
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for the change lifecycle, and how non-engineers edit the business branch from the browser.
