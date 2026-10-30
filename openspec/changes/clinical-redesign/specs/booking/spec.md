## ADDED Requirements

### Requirement: Patient holds a time before approving
The system SHALL let the `patient` pick one of the chosen specialist's open slots while the referral is a draft, and
MUST refuse a time change after the patient approves sharing.
#### Scenario: Patient changes specialist
- **WHEN** the patient holds a time with one specialist and then chooses another
- **THEN** the held time is released

### Requirement: Office confirms the held time
The system SHALL let `specialist_staff` confirm the held time once the referral has been delivered, which books the
visit without a second patient step. It MUST refuse confirmation before delivery and when no time was held.
#### Scenario: Confirm before PCP sign-off
- **WHEN** the office tries to confirm while the referral awaits the PCP office
- **THEN** the system refuses, because nothing is delivered before sign-off

### Requirement: Office can offer another time
The system SHALL keep the existing offer-and-book path when the held time is not available.
#### Scenario: Held time taken
- **WHEN** `specialist_staff` offers a different slot
- **THEN** the referral waits for the `patient` to book the offered slot

### Requirement: Revoking releases the hold
WHEN the `patient` revokes consent after delivery, the system MUST release the held time and share nothing further.
#### Scenario: Revoke after sending
- **WHEN** the patient stops sharing after the packet was delivered
- **THEN** the referral is withdrawn and has no held time
