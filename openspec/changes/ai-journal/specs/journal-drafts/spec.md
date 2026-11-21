## ADDED Requirements

### Requirement: Suggestions change nothing until she applies them
An `assistant` SHALL only suggest updates (check-in scales 1–5, medications started or stopped, story notes). The
record MUST NOT change until the `patient` applies a suggestion; only the patient may apply or dismiss.
#### Scenario: Claude suggests a sleep score
- **WHEN** she tells Claude "slept terribly again" and it suggests sleep 1 through the connector
- **THEN** her check-ins are unchanged until she taps Apply in Attune

### Requirement: Suggestions are checked like any other input
The system SHALL drop suggestions that fail validation (scores outside 1–5, stopping a medication not on her list,
empty notes) and SHALL log how many were dropped.
#### Scenario: Stop a medication she doesn't take
- **WHEN** an assistant suggests "stop Metformin" and Metformin isn't on her list
- **THEN** the suggestion is dropped and the log says one invalid suggestion was dropped

### Requirement: Her journal shows where each note came from
Notes an assistant saves SHALL be marked with that assistant's name; notes she writes in Attune are hers.
#### Scenario: Journaling in Claude
- **WHEN** Claude saves her words through `write_journal_entry`
- **THEN** the note appears in her Attune journal marked "Written in Claude"
