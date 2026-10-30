# Attune: `meta` branch

Specs, governance and release evidence for Attune. No application code and no business docs live here.

| Branch | Purpose |
| --- | --- |
| [`business`](https://github.com/Hanzalar/attune/tree/business) (orphan) | Product brief, de-identified discovery, competitors, pricing and legal, ADRs |
| `meta` (this branch, orphan) | Agent constitution, OpenSpec specs and changes, handoffs, release reports |
| [`develop`](https://github.com/Hanzalar/attune/tree/develop) | Code integration; feature branches `feature/<change-id>` start here |
| `stage` / `main` | Release candidates / verified releases, gated by `scripts/check_promotion.py` |

```bash
git clone https://github.com/Hanzalar/attune.git attune && cd attune     # develop
git worktree add ../attune-meta meta
git worktree add ../attune-business business
```

## Where things live

- `governance/constitution.md`: rules for every agent and person. `components.json` adds per-folder rules; `adapters.json` lists the agent config files to generate.
- `openspec/changes/<change-id>/`: proposal, design, tasks, spec deltas and `handoff.md` for each change. `openspec/specs/` holds accepted truth after archive.
- `templates/`: `handoff.md` and `acceptance.template.json`.
- `releases/`: one immutable report per promotion.
- `scripts/agents-sync.mjs`: writes the constitution into AGENTS.md, CLAUDE.md, GEMINI.md, Copilot, Cursor, Windsurf, Cline, Kiro, Amazon Q and Roo files, with a SHA-256 drift check.

## Active changes

| Change | Status |
| --- | --- |
| `referral-loop-pcp-obgyn` | Implemented on develop; phone and stakeholder checks open |
| `shared-record-api` | Proposed; blocked on the HIPAA/BAA hosting ADR |

## Commands

```bash
npm ci
npm test                                          # sync engine tests
npm run agents:sync                               # regenerate instruction files on meta
npm run agents:install -- --repo ../attune        # install into a develop or feature checkout
npm run agents:install -- --repo ../attune --check
npm run spec:validate                             # openspec validate --all --strict
```

Governance pattern: [Hanzala-plyance/howto](https://github.com/Hanzala-plyance/howto/blob/main/DOCTRINE.md), adapted to one repo with orphan branches.
