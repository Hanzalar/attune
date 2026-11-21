## 1. Domain (packages/domain)
- [x] 1.1 Types: assistant role, journal and care sections, optional check-in scales, assistant links, journal, proposals.
- [x] 1.2 `assistantContext`, draft validation, assistant commands with audit events; assistant views.
- [x] 1.3 External assistant only: no in-app chatbot or demo engine; assistants send `suggestUpdates`.
- [x] 1.4 Tests: grants limit context, reads logged, disconnect, suggestions inert until applied, invalid suggestions dropped, partial check-in merge, journaling via Claude, only connected assistants suggest.

## 2. Gateway (apps/assistant)
- [x] 2.1 Connector gateway calls no model (in-app Claude removed, 2026-11-19).
- [x] 2.2 Hub and MCP connector; localhost-only hub endpoints.
- [x] 2.3 Connector test over HTTP with the official MCP client.
- [x] 2.4 README: run, connecting Claude Code, Claude and ChatGPT, safety model.

## 3. App (apps/web)
- [x] 3.1 Connector helper and hub sync.
- [x] 3.2 Home assistant card; Journal (suggestions, note, recent notes) and AI assistants screens; no chat screen; Care team and Record updates.

## 4. Governance
- [x] 4.1 Constitution rule 13; assistant component rules; synced and installed.

## 5. Verify
- [x] 5.1 `npm run check` passes.
- [x] 5.2 Recorded walk of connect, journal through the connector, apply, ask and switch labs off (scripted client).
- [ ] 5.3 Connect from Claude Code, the Claude app and ChatGPT through a tunnel and journal for real.
- [ ] 5.4 Patient interviews on AI journaling (open question).
- [ ] 5.5 Clinical copy review of the assistant rules.

## 6. Demo video
- [x] 6.1 `npm run demo:video` records three one-minute films: referral loop, AI assistant, patient experience.

## 7. Handoff
- [x] 7.1 Update handoff.md.
