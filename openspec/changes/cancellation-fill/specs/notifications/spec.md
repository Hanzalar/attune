## ADDED Requirements

### Requirement: No health details in text that leaves the app
Every push, SMS or email text MUST omit specialty, practice name, condition, result and medication, and MUST fit one
SMS (160 characters). Offers sent to several patients at once SHALL say so.
#### Scenario: Batch offer
- **WHEN** the `agent` offers one slot to two patients
- **THEN** each gets "A visit time opened up. A few people got this too; first to accept gets it. Open Attune to see it."
