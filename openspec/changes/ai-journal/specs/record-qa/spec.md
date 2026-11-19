## ADDED Requirements

### Requirement: Answers from her record, with sources, never diagnosis
The assistant SHALL answer questions about her stats, labs, visits and Patient Pack only from shared sections,
naming the source and date of each fact. It MAY say whether a value is inside or outside the range the lab printed,
and MUST NOT diagnose, interpret what a result means for her, estimate risk or advise treatment.
#### Scenario: A1c question
- **WHEN** she asks "What was my last A1c?"
- **THEN** the answer gives the value, date, lab range and source, and sends what it means to her care team

### Requirement: Honest engine labels
WHEN no model is reachable, the system SHALL answer with demo replies labelled "Demo replies (no AI model)" and
MUST NOT present them as Claude.
#### Scenario: Public demo
- **WHEN** she asks a question on the static demo site
- **THEN** the answer is labelled as a demo reply and nothing leaves her browser
