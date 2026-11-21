# Design: ai-journal

## Context
The cancellation-fill prototype keeps one world in the browser. The AI-native journal adds a reader and writer
outside the browser (Claude, ChatGPT) without giving it write access, and without sending data the patient didn't
grant.

## Implementation
- Code branch `feature/ai-journal` from `feature/cancellation-fill`.
- `packages/domain/src/types.ts`: `Role` gains `assistant`; `SectionKey` gains `journal` and `care`; `CheckIn`
  scales are optional (a draft may rate only some); `World` (schema 4) gains `assistants`, `journal`, `proposals`.
- `config.ts`: `AI_ASSISTANTS` (Claude, ChatGPT), `ASSISTANT_SECTIONS` / `ASSISTANT_DEFAULT_SECTIONS` (insurance
  off by default), `ASSISTANT_RULES` (returned ahead of every record read, naming the connector tools).
- `assistant.ts`: `assistantContext` builds the only record text any assistant sees; `proposalProblem` validates
  suggestions; `applyAssistantCommand` handles connect, disconnect, writeJournal, suggestUpdates, applyProposal and
  dismissProposal, each with one audit event. `viewRecord` accepts the `assistant` role.
- `apps/web/src/shared/connector.ts`: connector tokens and addresses. `store.ts` syncs with the hub from the ticker
  tab: push the world, pull queued commands, run them through `act()`, ack with refusals. The patient app has no
  chat screen: Home shows updates waiting (or how to connect), Journal holds suggestions, notes and recent notes.
- `apps/assistant`: Node connector gateway that calls no model. `mcp.ts` (stateless Streamable HTTP MCP server per
  request), `hub.ts` (in-memory world and inbox), `server.ts` (routing, localhost-only hub endpoints).

## Decisions
- External chatbot only (product owner, 2026-11-19). Attune never calls a model, so it holds no model credentials
  and generates no answers itself; the rules travel with every read.
- One-tap approval instead of auto-apply: anything in her record can reach her doctors.
- URL tokens for the prototype connector; the MCP authorization spec (OAuth) before any real use.
- The browser stays the only writer; the gateway queues. This avoids a second source of truth until
  `shared-record-api` exists.
- "Muse" was named by the product owner; it is not identified yet, so it is not listed. Any MCP client can use the
  connector.

## Verification
Domain tests for consent, logging, suggestions and validation; a connector test that starts the gateway and drives
it with the official MCP client over HTTP; three recorded films walking the app (`npm run demo:video`).
