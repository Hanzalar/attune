## ADDED Requirements

### Requirement: One look, from the handoff
Every view SHALL use the handoff palette and Instrument Serif Italic (voice) with Instrument Sans (interface),
self-hosted. Dusty Rose MUST be used for large type only and Clay MUST NOT be used for text. Status MUST pair an icon
and a word with its color.
#### Scenario: Font requests
- **WHEN** any view loads
- **THEN** no request goes to a third-party font host

### Requirement: Patient screens are calm and finite
Patient screens MUST use text of 14px or larger, MUST NOT show red dots or badges, MUST NOT scroll infinitely, and
Home SHALL end with "You're caught up." The Offer screen SHALL design the "slot just filled" and "hold ended" states.
#### Scenario: Offer taken by someone else
- **WHEN** she opens an offer that was superseded
- **THEN** she sees "That slot just filled. You're still on the list." and no promise of a date or position
