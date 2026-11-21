## ADDED Requirements

### Requirement: No chatbot inside Attune
The patient app MUST NOT include a chatbot or call a model. She asks questions in her own assistant, which reads her
record through `read_record`.
#### Scenario: Looking for a chat
- **WHEN** she opens the patient app
- **THEN** she finds her connected assistants, suggestions waiting for her and who read what, and no chat screen

### Requirement: Answers from her record, with sources, never diagnosis
`read_record` SHALL return the rules every assistant follows ahead of the record: answer only from shared sections,
name the source and date of each fact, say at most whether a value is inside or outside the lab's printed range, and
never diagnose, interpret what a result means for her, estimate risk or advise treatment.
#### Scenario: A1c question in her assistant
- **WHEN** she asks her assistant "What was my last A1c?" and it calls `read_record`
- **THEN** the record it receives starts with those rules and gives the value, date, lab range and source

### Requirement: Withheld sections are named
WHEN she has switched a section off for an assistant, `read_record` SHALL leave it out and say it isn't shared.
#### Scenario: Labs switched off
- **WHEN** she switches labs off and her assistant reads her record
- **THEN** the record says "Not shared with you: Labs and results"
