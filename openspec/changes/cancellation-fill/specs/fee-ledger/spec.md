## ADDED Requirements

### Requirement: Fees accrue to specialist practices only, and nothing is billed
The system SHALL accrue one ledger entry per referral to the specialist practice, using that practice's amount and
trigger from config (default: visit attended), marked not billed. No entry, field or screen MUST pay or charge a PCP
or a patient. Matching MUST NOT read fee terms.
#### Scenario: Demo end state
- **WHEN** Ari's endo visit is attended
- **THEN** the ledger shows one entry owed by the endo practice and $0.00 for PCPs and patients
