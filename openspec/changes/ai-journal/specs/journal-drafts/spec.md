## ADDED Requirements

### Requirement: Drafts change nothing until she applies them
An `assistant` SHALL only draft updates (check-in scales 1–5, medications started or stopped, story notes). The
record MUST NOT change until the `patient` applies a draft; only the patient may apply or dismiss.
#### Scenario: Claude drafts a sleep score
- **WHEN** Claude replies to "slept terribly again" with a sleep 1 draft
- **THEN** her check-ins are unchanged until she taps Apply

### Requirement: Drafts are checked like any other input
The system SHALL drop drafts that fail validation (scores outside 1–5, stopping a medication not on her list, empty
notes) and SHALL log how many were dropped.
#### Scenario: Stop a medication she doesn't take
- **WHEN** an assistant drafts "stop Metformin" and Metformin isn't on her list
- **THEN** the draft is dropped and the log says one invalid draft was dropped

### Requirement: Her words are saved first
WHEN the `patient` saves a journal entry, the system SHALL save it before calling any assistant, so a failed call
loses nothing.
#### Scenario: Gateway down
- **WHEN** she saves an entry and the assistant can't be reached
- **THEN** the entry is in her journal and she is told it was saved
