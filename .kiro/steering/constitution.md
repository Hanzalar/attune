---
inclusion: always
---

<!-- CONSTITUTION:START -->
Generated from https://github.com/Hanzalar/attune/tree/meta/governance.
Source SHA-256: `0417ada0d96d6d34a9e4839a11d57fba5163667b0e1e7e2917eb6bfe0b9fa036`.
Edit canonical sources in specs repo; regenerate this managed block.

[Notice: Implementation Checkout]
Open the separate specs checkout for all planning artifacts and OpenSpec commands.

# Agent Constitution

These rules apply to every coding, planning, design, review, and release agent working on Attune.
Explicit user instructions and higher-priority platform safety instructions take precedence.

## 1. Where Things Live

- One repository, `https://github.com/Hanzalar/attune`, with four kinds of branches that never merge into each other:
  - `business` (orphan): product brief, de-identified discovery notes, competitor landscape, pricing and legal options, ADRs. This is business intent.
  - `meta` (orphan): this constitution, agent adapters, component rules, OpenSpec specs and changes, handoffs, release reports.
  - `landing` (orphan): the public marketing page, static files only. The Pages build on `develop` overlays it on the site root; it may claim only what the product does today.
  - `develop`, `stage`, `main`: application code only.
- Open them side by side with worktrees: `git worktree add ../attune-meta meta`, `git worktree add ../attune-business business` and `git worktree add ../attune-landing landing`.
- Do not copy specs or business docs into code branches. Link to them.
- Treat the business branch as intent and the prototype as reference. Neither is proof that something is ready.

## 2. Deterministic Branch Lifecycle: develop -> stage -> main

- All product changes follow `feature/<change-id> -> develop -> stage -> main`. Feature branches start from `develop`.
- `develop` integrates small, tested increments and deploys the labelled preview site.
- `stage` receives release candidates from `develop` only, after automated checks pass, for cross-browser, phone and accessibility verification.
- `main` holds verified releases, promoted from `stage` only. **Never promote directly from a feature branch or `develop` to `main`.**
- `scripts/check_promotion.py` gates PRs into `stage` and `main` against `release/acceptance.json`. Record the candidate SHA, checks, evidence, reviewer and rollback plan in an immutable report under `releases/` on `meta`.
- Missing evidence blocks promotion. User authorization can change scope or defer work; it can never bypass, fake, or waive verification results.

## 3. Feature Lifecycle and Handoffs

- Each change has one kebab-case change ID shared by `openspec/changes/<id>/`, the branch `feature/<id>`, the PR and the handoff.
- Write the proposal, behavior specs (SHALL/MUST with WHEN/THEN scenarios), design and verifiable tasks before implementing behavior. Every proposal links the discovery note on `business` that justifies it.
- Check tasks off only after they are implemented and verified.
- Before ending a session, update `handoff.md`: phase, agent/tool, branches and SHAs, decisions, evidence with real command output, blockers, and the next action.
- Coordinate overlapping changes; never clobber another agent's work.

## 4. Engineering and Design Judgment

- **Push back** on brittle architecture, weak UX, unhandled errors and unsafe assumptions. Name the failure mode and its consequence for the patient or the practice, and propose a smaller, sturdier alternative.
- Prefer pure domain functions with explicit types, append-only audit events, and tests that exercise real failure modes (refused actions, revoked consent, missing routes).
- **Honesty in verification:** report exactly what ran and what passed. Say which phone, browser, or integration checks were not run. Never present a placeholder control as working.
- Keep dependency caches, generated output, local state and credentials out of Git.

## 5. Instruction Maintenance

- Edit `governance/constitution.md`, `governance/components.json` and `governance/adapters.json` on `meta`, then run `npm run agents:sync`.
- Install into code checkouts with `npm run agents:install -- --repo <checkout>` on a feature or `develop` branch; promote the generated files through normal PRs.
- Text outside the managed blocks is preserved. CI runs the drift check; never hand-edit a generated block.

## 6. Product Rules for Attune

Attune is a patient-owned referral agent for PMOS (formerly PCOS). It drafts; people approve.

1. **The patient owns the record.** Nothing leaves Attune without the patient's approval of what is shared and with whom. Consent is per section and per recipient, revocable and logged, and she can see who viewed her record. Accepting an offer is her consent to share the Patient Pack with that practice; the practice sees nothing about her before then. Revoking stops further sharing; what was already delivered stays with the recipient.
2. **No referral without the PCP office.** The PCP office prepares every referral and a physician signs "I evaluated this patient". The PCP decides who is qualified. The agent never signs.
3. **Never rank by who pays.** Matching code must not read fees, payer or any commercial field. Offers go only to eligible waitlisted patients, ordered by the PCP urgency flag, then longest wait, then distance. Practices never see the queue or pick patients; their only lever is the criteria they publish. A test enforces this; keep it.
4. **Display only, never diagnosis.** Never name a condition for her, score severity or recommend treatment. Every item shows its source. Completeness checks compare paperwork to a practice's published criteria; they never judge her health. Bringing back evidence mapping or code drafting needs an ADR and the FDA clinical-decision-support check.
5. **Fit the office as it works today.** v1 delivers by verified e-fax or Direct (360X package); v2 is a SMART on FHIR read app; v3 write-back needs a per-vendor ADR. A fax that lands in Athena still counts.
6. **Standards-shaped from day one.** Model referrals as HL7 BSeR ServiceRequest + Task with a FHIR Consent. Pull records only on the patient's authority ((g)(10) patient APIs, then TEFCA Individual Access Services). Never use treatment-purpose aggregator access for a patient app.
7. **No PHI in this repository.** The repo is public. Demo data is synthetic and labelled. No real patient or interviewee names, health details, screenshots of real records, or paid reports in any branch. Logs never contain health data.
8. **Every state change is audited.** Each command appends an event naming the actor and what was shared. The log is append-only.
9. **Regulatory gates come first.** No specialist-paid fee is billed before the attorney review recorded on `business` (OIG AO 26-15, Texas Occ. Code 102.001); until then the fee ledger accrues and charges nothing, and no field pays a PCP or a patient. No clinician-facing launch before the FDA clinical-decision-support check. Record the outcome as an ADR.
10. **Web first, mobile-first patient app.** Ship as one web build: patient app (installable PWA), PCP admin, specialist admin. A native shell may wrap the patient app later and reuses `packages/domain`; no native-only product features without an ADR.
11. **Build only what discovery supports.** Every capability links to a de-identified note on `business`.
12. **No tech debt by default.** No `any`, no dead code, no hardcoded URLs or keys, no file over 400 lines without a written reason in the handoff.
13. **Assistants draft; she approves.** An AI assistant she connects (Claude, ChatGPT or any MCP client) is a consent recipient like a practice: it reads only the sections she grants, every read is logged where she can see it, and anything it writes is a draft she applies or dismisses. Assistants never diagnose, interpret results or advise treatment. Health data goes to a model provider only through a gateway we host, and real data needs a BAA with that provider first.
<!-- CONSTITUTION:END -->
