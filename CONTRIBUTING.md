# Contributing

## If you're editing business docs (no setup needed)

1. Open https://github.com/Hanzalar/attune/tree/business.
2. Open a file, press the pencil icon, edit, and commit straight to `business`, or open a PR if you want review.
3. Rules: no patient or interviewee names, no health details that could identify someone, no paid reports (Pitchbook, BCC). Link to the team Drive instead. The full rule list is in the business branch README.

## If you're changing the product

Every change has one kebab-case **change ID** used everywhere: the spec folder, the branch, the PR and the handoff.

1. **Spec it on `meta`.** In your `attune-meta` worktree, add `openspec/changes/<change-id>/` with `proposal.md`, `design.md`, `tasks.md`, `specs/<capability>/spec.md` and `handoff.md`. Link the discovery note on `business` that justifies it. Run `npm run spec:validate`.
2. **Build it on a feature branch.** `git switch develop && git pull && git switch -c feature/<change-id>`.
3. **Prove it.** `npm run check` must pass. Paste real output in the PR. If the change touches a view, walk the loop across all three views.
4. **Hand off.** Before you stop, update `handoff.md`: phase, branch, SHA, decisions, evidence, blockers, next action. The next person or agent starts there.
5. **PR into `develop`.** CI runs typecheck, tests, build and the agent-instruction drift check. Merging deploys the preview site.

## Promotion

`develop` → `stage` → `main`, each through a PR. PRs into `stage` and `main` run `scripts/check_promotion.py`, which fails closed unless `release/acceptance.json` names a tested commit, passing checks with evidence, and a release report on `meta` (plus a reviewer and rollback plan for `main`). Approval can change scope; it can't waive evidence.

## Rules that are tested, not just written

These live in `packages/domain` and have unit tests. Changing one needs an ADR on `business` and a test change in the same PR.

- The patient approves sharing and the specialist; nothing is delivered before the PCP office signs.
- HMO and POS referrals need a physician signature.
- Specialist ranking never reads who pays Attune.
- Evidence is mapped to criteria with a source per item; output never states a diagnosis.
- Suspected conditions are not coded; symptoms are.

## Agents

Agent instructions come from `governance/constitution.md` on `meta`. To refresh them in your checkout:

```bash
cd ../attune-meta && npm ci
npm run agents:install -- --repo ../attune
```
