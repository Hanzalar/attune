# Handoff: ai-journal

| Field | Value |
| --- | --- |
| Change ID | `ai-journal` |
| Current stage | `ready_for_review` (connector tested over HTTP; real assistants not yet connected) |
| Active agent & tool | Coding agent in VS Code, 2026-11-18 |
| Code branch | `feature/ai-journal` from `feature/cancellation-fill` |
| Specs branch | `spec/ai-journal` from `spec/cancellation-fill` |
| Business branch | `docs/prototype-handoff` (ADR-012, open questions) |

## 1. Work completed
- Domain: assistants as consent recipients, journal entries, suggestions (`assistant.ts`); `suggestUpdates`.
- Connector gateway `apps/assistant`: MCP connector and hub; calls no model.
- App: no chatbot (product owner, 2026-11-19). Home shows updates waiting from her assistant or how to connect one;
  Journal holds suggestions, a plain note and recent notes; the Assistants screen connects Claude or ChatGPT section
  by section and says when the connector isn't running (the public demo).
- Constitution rule 13 and the assistant, domain and web component rules, synced and installed.
- Three one-minute demo videos (`npm run demo:video`): referral loop, AI assistant, patient experience.

## 2. Decisions and deviations
- External assistant only; Attune holds no model credentials and generates no answers. Rules travel with every
  read.
- One tap to apply suggestions; no auto-apply.
- URL tokens for the prototype connector; OAuth (MCP authorization) before real use.
- "Muse" not listed: not identified yet (open question). Any MCP client works with the connector.
- In the AI video, a scripted demo client stands in for Claude, labelled on screen; its connector calls are real.

## 3. Verification evidence
```
$ npm run check
 Test Files  5 passed (5)
      Tests  42 passed (42)
✓ built
$ npx openspec validate --all --strict
Totals: 6 passed, 0 failed (6 items)
$ npm run agents:install -- --repo ../attune
[agents:install] Verified 13 targets. Updated 13 file(s).
```
The connector test starts the gateway and drives it over HTTP with the official MCP client: tools listed, shared
sections only with the rules, journal and suggestions queued, invalid suggestion skipped, unknown token and public
Host refused. The three films were recorded from the production build and reviewed frame by frame (contact sheets).

Not verified: Claude Code, the Claude app or ChatGPT connecting for real (needs a tunnel for the apps), screen
readers, real phones.

## 4. Blockers and deferred scope
- A tunnel and real assistant accounts for an end-to-end run.
- Counsel on patient-directed sharing to consumer AI, vendor terms, and `shared-record-api` before any real data.
- Patient interviews on AI journaling.

## 5. Next action
1. Add credentials (`.env.local` with `ANTHROPIC_API_KEY`, or `ant auth login`), restart `npm run assistant`, and
   repeat the walk with live Claude.
2. Merge after `cancellation-fill`, in the same order (business, meta, code, landing).
