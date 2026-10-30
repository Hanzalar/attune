<!-- CONSTITUTION:START -->
Generated from https://github.com/Hanzalar/attune/tree/meta/governance.
Source SHA-256: `c2542066760117871f6fb341f5deb085cb87762c326bd8ef078da6d319126323`.
Edit canonical sources in specs repo; regenerate this managed block.

# Component: domain (Referral business rules: lifecycle, consent, sign-off, coverage, ranking, evidence mapping, FHIR shapes)

Read the root AGENTS.md and relevant specifications first.

- Keep it pure: no I/O, no clock reads, no randomness. Callers pass timestamps.
- Every rule change ships with a test that fails without it. Refusals throw DomainError with a message a person can act on.
- rankSpecialists must never read the partner field or any commercial data; the invariance test stays.
- Evidence output names a source per item and never states a diagnosis.
- Demo data in demo.ts is synthetic and labelled (example); never add real names, NPIs or fax numbers.
<!-- CONSTITUTION:END -->
