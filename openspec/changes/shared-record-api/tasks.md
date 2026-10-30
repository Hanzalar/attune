## 1. Decide
- [ ] 1.1 ADR on business: HIPAA posture, hosting provider and BAA, data retention.

## 2. Build (services/api)
- [ ] 2.1 Event-log store; commands applied through @attune/domain `dispatch`.
- [ ] 2.2 Role-scoped auth and per-practice invites.
- [ ] 2.3 Server-sent events for live updates.

## 3. Web (apps/web)
- [ ] 3.1 API-backed store behind `useReferral` / `act` when `VITE_API_URL` is set.

## 4. Verify and hand off
- [ ] 4.1 Walk the loop on three devices; record evidence in handoff.md.
