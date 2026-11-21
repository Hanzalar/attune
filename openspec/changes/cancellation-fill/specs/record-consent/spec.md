## ADDED Requirements

### Requirement: Sharing by code and date of birth
The `patient` SHALL create a single-use share code for chosen sections that expires after 15 minutes. `pcp_ma` SHALL
redeem it only with her date of birth, which grants exactly those sections to that practice.
#### Scenario: Wrong date of birth
- **WHEN** the MA enters a valid code with the wrong date of birth
- **THEN** the system refuses and nothing is shared

### Requirement: Consent per section and per recipient
The `patient` SHALL turn each section on or off for each recipient. Every change MUST be logged. Turning a section
off MUST stop future access and future deliveries, including visit summaries to her PCP.
#### Scenario: Summaries turned off for the PCP
- **WHEN** she stops sharing visit summaries with her PCP before the specialist uploads one
- **THEN** the summary is filed to her record only and the log says it was not sent to the PCP

### Requirement: Accepting an offer is Pack consent
WHEN the `patient` accepts an offer, the system SHALL grant that practice her Patient Pack sections and log what was
shared. The practice MUST see nothing about her before then.
#### Scenario: Before acceptance
- **WHEN** the endo front desk tries to open a waitlisted patient's story
- **THEN** the system refuses because she hasn't shared it

### Requirement: She can see who viewed her record
Each staff view of her record SHALL be recorded with viewer, practice, time and sections, and shown to her.
#### Scenario: Repeat views
- **WHEN** the same person reopens her record within ten minutes
- **THEN** one view is recorded
