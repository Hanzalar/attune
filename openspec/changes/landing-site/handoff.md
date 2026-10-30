# Handoff: landing-site

| Field | Value |
| --- | --- |
| Change ID | `landing-site` |
| Current stage | `ready_for_review` (landing pushed; develop wiring in the clinical-redesign PR) |
| Active agent & tool | Coding agent in VS Code, 2026-10-30 |
| Code branches | orphan `landing` (worktree `../attune-landing`); develop wiring on `feature/clinical-redesign` at `a1d2593` |
| Specs branch | `spec/clinical-redesign` into `meta` |

## 1. Work completed
- Landing page with three audience views, rules, status notice; self-hosted fonts; redeploy workflow; README.
- Pages overlay on develop; constitution amended.

## 2. Decisions
- Hash-routed tabs that degrade to three stacked sections without JS.
- No contact path until there is an approved address and a backend; the call to action is the demo and the guide.
- Unused 700-weight font removed.

## 3. Verification evidence
Combined `BASE_PATH=/attune/` build with the overlay script from `pages.yml` (clash list empty), served locally:
```
landing 390 {"sw":390,"plex":true,"links":["./","guide/","demo/","patient/","pcp/","specialist/"]}
landing 1280 {"sw":1280,"plex":true}
#patients/#pcp/#specialists show the matching panel; keyboard arrows move between tabs; JS off shows all three
hosts: localhost:8130 | failed: none | page errors: none
```
Not verified: the live site, the `landing.yml` redeploy trigger (needs a push), real phones.

## 4. Next action
1. After the develop PR merges, confirm https://hanzalar.github.io/attune/ serves the page and that a push to `landing` re-runs the Pages workflow.
