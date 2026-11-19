## ADDED Requirements

### Requirement: The PCP office prepares, a physician attests
`pcp_ma` or `pcp_physician` SHALL start a referral only for a patient who shares her record with the practice. Only
`pcp_physician` SHALL sign and send, with the attestation "I evaluated this patient" and a written reason.
#### Scenario: MA tries to sign
- **WHEN** `pcp_ma` signs and sends
- **THEN** the system refuses and the referral stays a draft

### Requirement: Completeness against published criteria
After sending, the `agent` SHALL check the referral against every on-Attune practice's criteria in the specialty and
mark it Qualified when complete for at least one, or Needs info with what is missing for all. The check MUST compare
paperwork only and MUST NOT judge her health.
#### Scenario: Missing result
- **WHEN** no practice's criteria are met because TSH is not on file
- **THEN** the referral is Needs info listing "TSH within 12 months", and attaching it re-runs the check

### Requirement: Insurance before the waitlist
A Qualified referral SHALL move to Insurance pending until her card is captured and verified within 24 hours, to
Insurance issue when a check fails, and to On waitlist once verified.
#### Scenario: Card verified
- **WHEN** `ops` verifies a captured card for a qualified referral
- **THEN** the referral is On waitlist and she is told "You're on the list"

### Requirement: Off-Attune fallback is shown, not sent
The `pcp_physician` SHALL be able to route a signed referral to an off-Attune practice in the same specialty with a
verified fax or a Direct address. The prototype MUST show the packet and MUST NOT transmit it.
#### Scenario: Unverified fax
- **WHEN** the physician picks an off-Attune practice whose fax is unverified
- **THEN** the system refuses until the number is verified
