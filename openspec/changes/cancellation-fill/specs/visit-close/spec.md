## ADDED Requirements

### Requirement: Day-before confirmation
The `patient` SHALL confirm a booked visit within 36 hours of it, either "nothing has changed" or with a note that
travels with her Pack. The practice SHALL be told it was confirmed.
#### Scenario: Something changed
- **WHEN** she confirms with "Started a new medication last week"
- **THEN** the slot is Confirmed and the note shows on the Patient Pack

### Requirement: Attended only after the start
`specialist_staff` or `specialist_provider` SHALL mark a visit attended only at or after its start time.
#### Scenario: Too early
- **WHEN** the front desk marks attended an hour before the visit
- **THEN** the system refuses with "The visit hasn't started yet."

### Requirement: Summary closes the loop
WHEN a specialist uploads a visit summary for an attended visit, the `agent` SHALL file it to her record, send it to
the PCP inbox if she still shares summaries with them, notify her, and close the referral.
#### Scenario: Summary uploaded
- **WHEN** `specialist_provider` uploads the summary
- **THEN** the referral passes Summary received and is Closed
