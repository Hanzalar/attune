## 1. Domain (packages/domain)
- [x] 1.1 Types: assistant role, journal and care sections, optional check-in scales, assistant links, journal, proposals.
- [x] 1.2 `assistantContext`, draft validation, assistant commands with audit events; assistant views.
- [x] 1.3 Demo replies (`demoJournal`, `demoAnswer`).
- [x] 1.4 Tests: grants limit context, reads logged, disconnect, drafts inert until applied, invalid drafts dropped, partial check-in merge, journaling via Claude, demo replies sourced and non-diagnostic.

## 2. Gateway (apps/assistant)
- [x] 2.1 In-app Claude: journal drafts with structured outputs, Ask, health with credential check.
- [x] 2.2 Hub and MCP connector; localhost-only app endpoints.
- [x] 2.3 Connector test over HTTP with the official MCP client.
- [x] 2.4 README: run, credentials, connecting Claude Code, Claude and ChatGPT, safety model.

## 3. App (apps/web)
- [x] 3.1 Assistant client and hub sync.
- [x] 3.2 Home journal composer; Journal, Ask and AI assistants screens; Care team and Record updates.

## 4. Governance
- [x] 4.1 Constitution rule 13; assistant component rules; synced and installed.

## 5. Verify
- [x] 5.1 `npm run check` passes.
- [x] 5.2 Browser walk in demo mode: journal, apply drafts, ask, connect, connector URL.
- [ ] 5.3 Live Claude run with credentials (none on the build machine).
- [ ] 5.4 Connect from Claude Code, the Claude app and ChatGPT through a tunnel.
- [ ] 5.5 Patient interviews on AI journaling (open question).
- [ ] 5.6 Clinical copy review of assistant rules and answers.

## 6. Handoff
- [x] 6.1 Update handoff.md.
