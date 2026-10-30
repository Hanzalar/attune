## ADDED Requirements

### Requirement: One record across devices
The system SHALL store each referral server-side and apply every command through the same domain rules as the
browser, so the patient, PCP staff and specialist staff see the same state on their own devices.
#### Scenario: PCP signs on a desktop
- **WHEN** the MA signs the referral on the PCP desktop
- **THEN** the patient's phone and the specialist's inbox show the update without a reload

### Requirement: Role-scoped access
The system MUST let a signed-in user act only in the roles they hold on that referral, and MUST refuse commands from
users with no role on it.
#### Scenario: Specialist staff from another practice
- **WHEN** staff from a practice not on the referral request it
- **THEN** the system refuses and logs nothing about the referral's contents
