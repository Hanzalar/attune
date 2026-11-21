<!-- CONSTITUTION:START -->
Generated from https://github.com/Hanzalar/attune/tree/meta/governance.
Source SHA-256: `577080a22b334891250cb0a4e270f75e025ef1c785bc9454d2ab767b06217d1c`.
Edit canonical sources in specs repo; regenerate this managed block.

# Component: domain (Shared record rules: referral lifecycle, criteria completeness, waitlist matching, offers and holds, consent, notifications, fee ledger, FHIR shapes)

Read the root AGENTS.md and relevant specifications first.

- Keep it pure: no I/O, no clock reads, no randomness. Callers pass timestamps.
- Every rule change ships with a test that fails without it. Refusals throw DomainError with a message a person can act on.
- Matching and criteria code must never read fee terms, payer or any commercial field; the invariance and source-scan tests stay.
- Assistant commands accept suggestions only; applyProposal is the patient's alone. Validate every suggested change with proposalProblem.
- Fill policy numbers (hold windows, batch sizes, freshness) live in config.ts; the product name lives in PRODUCT_NAME.
- Notification text carries no health details and fits one SMS; the notify tests stay.
- Demo data in demo.ts is synthetic and labelled (example); never add real names, NPIs or fax numbers.
<!-- CONSTITUTION:END -->
