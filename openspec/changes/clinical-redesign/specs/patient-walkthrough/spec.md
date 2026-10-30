## ADDED Requirements

### Requirement: Patient-facing walkthrough
The web build SHALL serve `/guide/`, explaining in plain language how a patient books and tracks a referral, naming
for each step whether the patient, the PCP office, the specialist office or the agent acts.
#### Scenario: Patient reads the steps
- **WHEN** a patient opens `/guide/`
- **THEN** the page shows seven referral steps in order, each naming the acting role and what the patient taps

### Requirement: No placeholder presented as working
The guide MUST label what is not built and MUST state that the demo is synthetic and sends nothing.
#### Scenario: Coach answers
- **WHEN** the guide describes the Coach tab
- **THEN** it states that answers are pre-written in the demo

### Requirement: Consent rules stated
The guide MUST state that nothing leaves Attune without the patient's approval, that the PCP office signs, that
matches are never ranked by who pays, that Attune does not diagnose, and what stopping sharing does before and after
delivery.
#### Scenario: Revoke after sending
- **WHEN** the guide describes stopping after the packet was sent
- **THEN** it says nothing further is shared and the office keeps what it received
