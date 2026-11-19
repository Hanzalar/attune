## ADDED Requirements

### Requirement: Assistants read only what she grants
The `patient` SHALL connect an AI assistant by choosing sections, which grants that assistant those sections only.
The record text any assistant receives MUST be built from granted sections and MUST name what was withheld.
#### Scenario: Medications not shared
- **WHEN** she connects Claude without medications and Claude reads her record
- **THEN** the text has no medications and says "Not shared with you: Medications"

### Requirement: Every read is visible to her
Each assistant read SHALL be logged as a record view naming the assistant and sections, and shown under "Who viewed
your record". An `assistant` MUST be refused sections she didn't grant.
#### Scenario: Claude reads labs
- **WHEN** Claude reads her labs
- **THEN** her record shows Claude (Anthropic) viewed Labs and results

### Requirement: Disconnect ends access
WHEN the `patient` disconnects an assistant, the system SHALL revoke every grant and end its connector token.
#### Scenario: Old connector link
- **WHEN** the assistant calls the connector after she disconnected it
- **THEN** the connector answers that the link was disconnected
