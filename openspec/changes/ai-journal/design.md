# Design: ai-journal

## Context
The cancellation-fill prototype keeps one world in the browser. The AI-native journal adds a reader and writer
outside the browser (Claude, ChatGPT) without giving it write access, and without sending data the patient didn't
grant.

## Implementation
- Code branch `feature/ai-journal` from `feature/cancellation-fill`.
- `packages/domain/src/types.ts`: `Role` gains `assistant`; `SectionKey` gains `journal` and `care`; `CheckIn`
  scales are optional (a draft may rate only some); `World` (schema 4) gains `assistants`, `journal`, `proposals`.
- `config.ts`: `AI_ASSISTANTS` (Claude in-app and connector, ChatGPT connector), `LOCAL_ASSISTANT` (demo replies),
  `ASSISTANT_SECTIONS` / `ASSISTANT_DEFAULT_SECTIONS` (insurance off by default), `ASSISTANT_RULES`.
- `assistant.ts`: `assistantContext` builds the only record text any assistant sees; `proposalProblem` validates
  drafts; `applyAssistantCommand` handles connect, disconnect, writeJournal, assistantReply, applyProposal and
  dismissProposal, each with one audit event. `viewRecord` accepts the `assistant` role.
- `demoAssistant.ts`: rules-based `demoJournal` and `demoAnswer`, same rules, labelled.
- `apps/web/src/shared/assistant.ts`: `engineFor` (Claude only when the gateway is ready and Claude is connected),
  `journal()` saves first, then drafts; `ask()`; reads by Claude are logged as views. `store.ts` syncs with the hub
  from the ticker tab: push the world, pull queued commands, run them through `act()`, ack with refusals.
- `apps/assistant`: Node gateway. `claude.ts` (Opus 5.5, low effort, `betaZodOutputFormat` structured drafts,
  server-side fallbacks, refusal handling, typed error mapping), `mcp.ts` (stateless Streamable HTTP MCP server per
  request), `hub.ts` (in-memory world and inbox), `server.ts` (routing, localhost-only app endpoints).

## Decisions
- Messages API over Managed Agents: health data, no BAA eligibility for Managed Agents, no stored session history.
- One-tap approval instead of auto-apply: anything in her record can reach her doctors.
- URL tokens for the prototype connector; the MCP authorization spec (OAuth) before any real use.
- The browser stays the only writer; the gateway queues. This avoids a second source of truth until
  `shared-record-api` exists.
- ChatGPT connects through the connector only; the in-app engine is Claude.
- "Muse" was named by the product owner; it is not identified yet, so it is not listed. Any MCP client can use the
  connector.

## Verification
Domain tests for consent, logging, drafts, validation and demo replies; a connector test that starts the gateway
and drives it with the official MCP client over HTTP; a browser walk of journal, apply, ask and connect.
