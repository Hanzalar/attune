## ADDED Requirements

### Requirement: Patient approval before anything is shared
The system SHALL let only the patient choose the specialist, choose what is shared, and approve sharing. The system
MUST refuse approval when no specialist is chosen or no item is shared. Once approved, the specialist and shared items
SHALL be locked.
#### Scenario: Patient approves sharing
- **WHEN** the patient approves with a chosen specialist and at least one shared item
- **THEN** the referral moves to the PCP queue and consent is recorded with a timestamp
#### Scenario: Someone else tries to approve
- **WHEN** a PCP or specialist role sends the approve command
- **THEN** the system refuses with a message naming the patient as the required actor

### Requirement: PCP sign-off before delivery
The system SHALL deliver nothing before the PCP office signs. The MA (pcp_ma) or physician (pcp_physician) SHALL
confirm at least one code when signing. When the plan type requires it (HMO, POS), the referral MUST wait for a
physician signature after the MA signs. The agent MUST NOT sign.
#### Scenario: PPO referral signed by the MA
- **WHEN** the MA signs a PPO referral with confirmed codes
- **THEN** the agent delivers the packet and the specialist inbox shows it
#### Scenario: HMO referral signed by the MA only
- **WHEN** the MA signs an HMO referral
- **THEN** the referral waits for the physician's co-sign and nothing is delivered

### Requirement: Delivery through a verified route
The agent SHALL deliver through the specialist's FHIR endpoint, else Direct, else a verified fax, and SHALL record
which items left Attune. An unverified fax number MUST NOT be used.
#### Scenario: Only an unverified fax is on file
- **WHEN** the chosen specialist has only an unverified fax number
- **THEN** delivery is refused and the MA is told to verify a route

### Requirement: Specialist response
The specialist front desk (specialist_staff) SHALL be able to accept and offer a slot, request more records, or decline
with a required note. The patient SHALL book an offered slot. The provider or patient SHALL record the visit, after
which the agent closes the loop with the PCP.
#### Scenario: Decline without a note
- **WHEN** the front desk declines with an empty note
- **THEN** the system refuses until a note for the PCP and patient is added

### Requirement: Consent revocation
The patient SHALL be able to stop sharing at any time. Before delivery this MUST return the referral to draft and clear
signatures; after delivery it MUST withdraw the referral and block further steps.
#### Scenario: Revoke after delivery
- **WHEN** the patient stops sharing after the packet was delivered
- **THEN** the referral is withdrawn and the specialist cannot offer a slot

### Requirement: Ranking ignores who pays
Specialist matches SHALL be ordered by network status, soonest opening, PMOS experience and distance only, and SHALL
drop out-of-network specialists on plans that exclude them. Commercial relationships MUST NOT change the order.
#### Scenario: Partner flags change
- **WHEN** every specialist's partner flag is flipped
- **THEN** the ranked order is identical

### Requirement: Evidence without diagnosis
The system SHALL map tracked data to the Rotterdam domains with a source per item, list open gaps, and state at most
that a pattern is consistent with the criteria pending clinician confirmation. It MUST NOT state a diagnosis and MUST
NOT draft E28.2 unless the diagnosis is already on file.
#### Scenario: Two domains supported, labs missing
- **WHEN** cycles are irregular and mFG is at or above threshold but androgen labs are absent
- **THEN** two domains show as met, biochemical hyperandrogenism shows "order labs", and symptom codes are drafted

### Requirement: Audit trail
Every accepted command SHALL append an event with sequence, time, actor role and summary, and delivery events SHALL
list the shared items. The PCP and specialist views SHALL show the log.
#### Scenario: Full loop
- **WHEN** the loop runs from approval to close
- **THEN** the log holds seven events in order: approve, sign, deliver, offer, book, visit, close
