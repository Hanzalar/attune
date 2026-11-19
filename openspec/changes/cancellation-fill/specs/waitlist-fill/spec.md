## ADDED Requirements

### Requirement: Only ready patients are offered
The `agent` SHALL offer a posted slot only to a waitlisted patient whose referral is PCP-signed, on the waitlist, for
the slot's specialty, complete for that practice's criteria, insurance-verified within 24 hours, on a plan the practice
accepts, within her distance (or telehealth when she said yes), inside her days and times, no sooner than her shortest
notice, not already offered that slot, and holding no other live offer.
#### Scenario: Stale insurance check
- **WHEN** `specialist_staff` posts a slot and a waiting patient's insurance was last verified three days ago
- **THEN** she is not offered the slot and the skip is counted as "insurance check out of date"

### Requirement: Order never depends on who pays
The `agent` MUST order eligible patients by PCP urgency flag, then longest on the waitlist, then nearest, and MUST NOT
read fee terms, payer or plan type. Practices MUST NOT see the queue or choose patients.
#### Scenario: Fee terms change
- **WHEN** a practice's fee amount or trigger changes, or is removed
- **THEN** the same patients are offered in the same order

### Requirement: Hold windows and batch sizes come from config
The `agent` SHALL size each round by time until the slot: more than 48 h, 2 h hold, 1 offer; 24–48 h, 1 h, 1; 4–24 h,
15 min, 2; under 4 h, 5 min, 3. A hold MUST NOT run past the slot's start. Demo mode divides holds by its speed.
#### Scenario: Next-day afternoon slot
- **WHEN** `specialist_staff` posts a slot 22 hours out
- **THEN** two patients receive offers with a 15-minute hold

### Requirement: First to accept wins
WHEN a `patient` accepts a pending offer, the system SHALL book the slot, mark other pending offers for it Superseded,
return those patients to the waitlist, and tell them "That slot just filled. You're still on the list."
#### Scenario: Late accept
- **WHEN** a patient taps Accept after another patient took the slot
- **THEN** the system refuses with "That slot just filled. You're still on the list."

### Requirement: Unfilled slots say why
WHEN no eligible patient remains, or the start time passes, the `agent` SHALL close the slot as Unfilled with a reason
the practice can read, built from counts only, and notify the practice.
#### Scenario: Nobody matches
- **WHEN** `specialist_staff` posts a Saturday slot and every waiting patient picked weekdays only
- **THEN** the slot closes Unfilled with "None of the N waiting matched: … day doesn't work"

### Requirement: Practices can withdraw an unbooked opening
`specialist_staff` SHALL be able to withdraw an Open or Offering slot, which supersedes its pending offers, and MUST
NOT withdraw a booked visit.
#### Scenario: Withdraw while offering
- **WHEN** the front desk withdraws a slot with two pending offers
- **THEN** both offers are Superseded and both patients are back on the waitlist
