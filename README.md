# Attune

A patient-owned PMOS record that her PCP, gyno and endo all see, so she stops retelling her story. The prototype is built
around one moment: **a specialist's cancellation gets filled by a patient who is already ready**, meaning PCP-signed,
complete for the practice's criteria, insurance-checked, and with her record on one page.

It is **AI-native**: she journals in plain words and an assistant drafts the record updates (check-ins, medications,
story notes) for her to approve; she asks about her stats, labs, visits and Patient Pack and gets answers drawn only
from what she shared. Claude works inside the app, and Claude, ChatGPT or any MCP client can connect through Attune's
connector. Assistants are consent recipients like practices: per-section grants, every read logged, drafts only.
See [apps/assistant/README.md](apps/assistant/README.md).

**Site (preview from `develop`):** https://hanzalar.github.io/attune/ serves the landing page from the orphan `landing` branch; the app lives under it.

| Page | Who uses it | URL |
| --- | --- | --- |
| Demo hub | Whoever presents the demo: the six-step scenario as a live checklist, demo clock, reset | [/attune/demo/](https://hanzalar.github.io/attune/demo/) |
| Patient app | The patient, on her phone (installable web app) | [/attune/patient/](https://hanzalar.github.io/attune/patient/) |
| PCP portal | The PCP's medical assistant, and the physician who signs | [/attune/pcp/](https://hanzalar.github.io/attune/pcp/) |
| Specialist portal | Gyno or endo front desk, and the specialist | [/attune/specialist/](https://hanzalar.github.io/attune/specialist/) |
| Ops | Attune's back office (mocked): insurance checks, waitlist, directory, notifications, fee ledger, audit log | [/attune/ops/](https://hanzalar.github.io/attune/ops/) |

Start at the demo hub. Open the views in separate windows (the patient app at phone width) and walk the scenario:
the endo office posts a cancellation, Ari accepts the offer, the front desk opens her Patient Pack, the endo sends a
visit summary, and the ledger shows one fee owed by the endo practice. Nothing is billed. All views share one record
in the browser and update live. All people, practices and plans are synthetic.

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
packages/domain   The shared record: referral lifecycle, criteria completeness, waitlist matching, offers and hold
                  timers, consent and record views, notifications, fee ledger, FHIR (BSeR) shapes. Pure TS, tested.
                  Fill policy (hold windows, batch sizes) and the product name live in src/config.ts.
apps/assistant    Node gateway: in-app Claude for the journal and Ask screens, a record hub, and the MCP connector
                  (/mcp/<token>) for Claude, ChatGPT and other MCP clients. Not part of the static site.
apps/web          Vite + React. One build: /demo/, /patient/, /pcp/, /specialist/, /ops/.
                  Design system: apps/web/DESIGN.md, tokens in src/design/tokens.ts.
scripts           check_promotion.py: fail-closed gate for PRs into stage and main.
release           acceptance.json lands here when a build is promoted.
```

Agent instructions (`AGENTS.md`, `CLAUDE.md`, Copilot, Cursor and others) are generated from `meta`. Don't edit the managed blocks by hand.

## Run it

```bash
npm ci
npm run dev        # http://localhost:5173/demo/  (also /patient/, /pcp/, /specialist/, /ops/)
npm run assistant  # optional: assistant gateway on :8787 (in-app Claude needs ANTHROPIC_API_KEY or `ant auth login`)
npm run check      # typecheck, unit tests (including the connector over HTTP), production build
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
