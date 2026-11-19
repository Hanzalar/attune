# Why
The product owner asked for Attune to be AI-native: she journals in plain words and an assistant updates the app
for her, and she can ask about her stats, Patient Pack and labs, natively in Claude and ChatGPT as well as in the
app (2026-11-18). It follows the handoff's promise that she stops retelling her story (`business`,
`product/prototype-handoff.md`) and the discovery finding that specialists restart the history even when notes were
sent (`business`, `discovery/referral-gap.md`, Patients F and G).

Not yet supported by discovery: no interview has asked whether patients would journal to an AI that updates their
record, or which assistant they use. Added to `open-questions.md`; ADR-012 records the gap (constitution rule 11).

# What Changes
- **Assistants are consent recipients.** She connects Claude or ChatGPT and picks sections (journal and
  "referrals and visits" are new sections, for assistants only). Every read is logged under "Who viewed your record";
  disconnecting ends the token and every grant.
- **Journal → drafts → her approval.** She writes freely; the assistant replies briefly and drafts updates (today's
  check-in scales, medications started or stopped, story notes). Nothing changes until she applies a draft.
- **Ask about her record.** Answers come only from shared sections, with sources; no diagnosis, interpretation or
  treatment advice (rules in `ASSISTANT_RULES`).
- **Native in Claude and ChatGPT.** An MCP connector (`/mcp/<token>`) with `read_record`, `write_journal_entry`
  and `suggest_record_updates`. What assistants send is queued for the app, which runs it through the domain.
- **In-app Claude.** A gateway we host calls Claude (Opus 5.5, structured outputs for drafts, server-side
  fallbacks). Messages API, not Managed Agents: health data, no BAA eligibility, no stored session history.
- **Demo replies.** Without a gateway (the public demo) a rules-based stand-in answers in the browser, labelled
  "Demo replies (no AI model)".
- Home puts the journal composer right after a live offer.
- Constitution rule 13; new `assistant` component rules.

# Capabilities
## New Capabilities
- `assistant-consent`: connecting, per-section grants, logged reads, disconnect.
- `journal-drafts`: journal entries, assistant replies, drafts she applies or dismisses.
- `record-qa`: answers from shared sections only, with sources, never diagnosis.
- `mcp-connector`: tools for Claude, ChatGPT and other MCP clients; local-only app endpoints.

# Impact
Views: patient app (Home, Journal, Ask, AI assistants, Care team, Record). Components: `packages/domain`
(types, `assistant.ts`, `demoAssistant.ts`), `apps/web` (assistant client, hub sync, screens), new
`apps/assistant` (gateway). Stacks on `cancellation-fill`.

Excluded: real model calls in the public demo, OAuth for the connector (URL tokens in the prototype), a server-side
record store, any clinician-facing AI, voice journaling.

Regulatory gates touched: consent (assistants are recipients; reads logged), FDA CDS (answers stay display-only;
no interpretation), HIPAA (real data needs a BAA with each model provider and the `shared-record-api` store; ADR-007
still blocks real PHI).
