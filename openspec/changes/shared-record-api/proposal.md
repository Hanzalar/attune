# Why
The hosted views share a record only inside one browser. A pilot needs the patient's phone, the MA's desktop and the
front desk's desktop to see the same referral, with each person signed in as their role.

# What Changes
- Add `services/api`: a small HTTP service that stores referrals as event logs and applies commands through
  `@attune/domain` (the same rules the browser runs today), with server-sent events for live updates.
- Role-scoped sign-in (patient, PCP staff, specialist staff) with invites per practice; no shared passwords.
- The web store switches from localStorage to the API behind the existing `useReferral` and `act` hooks when
  `VITE_API_URL` is set; the static demo keeps working without it.

# Capabilities
## New Capabilities
- `shared-record`: one server-side referral record per patient, readable and writable by the roles on that referral.

# Impact
New service and deployment target; hosting choice and BAA posture must be settled first (business ADR on HIPAA status).
Excluded: real PHI until the HIPAA and BAA decision is recorded; fax and Direct transport.
