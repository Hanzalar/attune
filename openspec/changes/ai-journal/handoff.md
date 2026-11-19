# Handoff: ai-journal

| Field | Value |
| --- | --- |
| Change ID | `ai-journal` |
| Current stage | `verifying` (built and walked in demo mode; live Claude and remote connectors not yet run) |
| Active agent & tool | Coding agent in VS Code, 2026-11-18 |
| Code branch | `feature/ai-journal` from `feature/cancellation-fill` |
| Specs branch | `spec/ai-journal` from `spec/cancellation-fill` |
| Business branch | `docs/prototype-handoff` (ADR-012, open questions) |

## 1. Work completed
- Domain: assistant links as consent recipients, journal, drafts (`assistant.ts`), demo replies (`demoAssistant.ts`).
- Gateway `apps/assistant`: in-app Claude (journal drafts via structured outputs, Ask), hub, MCP connector.
- App: journal composer on Home after a live offer; Journal, Ask and AI assistants screens; Care team and Record
  updates; hub sync in the store.
- Constitution rule 13 and `assistant` component rules, synced and installed.

## 2. Decisions and deviations
- Messages API through our own gateway, not Managed Agents (health data; no BAA eligibility; no stored sessions).
- Model `claude-opus-5-5`, effort low, server-side fallbacks on.
- One tap to apply drafts; no auto-apply.
- URL tokens for the prototype connector; OAuth (MCP authorization) before real use.
- "Muse" not listed: not identified yet (open question). Any MCP client works with the connector.
- The gateway reads an optional git-ignored `.env.local` so a developer can add credentials without touching code.

## 3. Verification evidence
```
$ npm run check
 Test Files  5 passed (5)
      Tests  45 passed (45)
✓ built in 2.3s
$ npx openspec validate ai-journal --strict
Change 'ai-journal' is valid
$ curl http://127.0.0.1:8787/api/assistant/health
{"ready":false,"model":"claude-opus-5-5","reason":"No Claude credentials on this gateway. Run `ant auth login` or set ANTHROPIC_API_KEY, then restart it."}
```
Headless Chrome at 390px with the gateway running (demo replies; the connector driven by the official MCP client):
```
connect claude: true | url shown: true
drafts: checkIn:pending, addMed:pending -> apply all -> applied,applied
meds: ...; Magnesium | last check-in: {"date":"2026-11-18","sleep":1,"skin":2}
answer: A1c 5.7 % on 2026-09-22 (lab range 4.0–5.6, outside the range the lab printed) ...
connector read has labs: true
app shows connector entry: true | written in claude: true
record shows claude read: true | overflow: 0 | errors: none
```
Not verified: a live Claude call (no credentials on the build machine), the Claude and ChatGPT apps connecting
through a tunnel, screen readers, real phones.

## 4. Blockers and deferred scope
- Credentials for a live run; a tunnel for the Claude and ChatGPT apps.
- BAA with each model provider and `shared-record-api` before any real data (ADR-007, ADR-012).
- Patient interviews on AI journaling.

## 5. Next action
1. Add credentials (`.env.local` with `ANTHROPIC_API_KEY`, or `ant auth login`), restart `npm run assistant`, and
   repeat the walk with live Claude.
2. Merge after `cancellation-fill`, in the same order (business, meta, code, landing).
