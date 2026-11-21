# Why
The product owner asked for Attune to be AI-native: she journals in plain words and an assistant updates the app
for her, and she can ask about her stats, Patient Pack and labs, natively in Claude and ChatGPT (2026-11-18). On
2026-11-19 they set the direction: the chatbot is external, not inside Attune. It follows the handoff's promise that she stops retelling her story (`business`,
`product/prototype-handoff.md`) and the discovery finding that specialists restart the history even when notes were
sent (`business`, `discovery/referral-gap.md`, Patients F and G).

Not yet supported by discovery: no interview has asked whether patients would journal to an AI that updates their
record, or which assistant they use. Added to `open-questions.md`; ADR-012 records the gap (constitution rule 11).

# What Changes
- **No in-app chatbot.** She talks to the assistant she already uses (Claude, ChatGPT or any MCP app). Attune is
  the record behind it.
- **Assistants are consent recipients.** She connects one and picks sections (journal and "referrals and visits"
  are new sections, for assistants only). Every read is logged under "Who viewed your record"; disconnecting ends
  the token and every grant.
- **Journal there, suggestions here.** When she tells her assistant how she is, it saves her words to her Attune
  journal and suggests updates (today's check-in scales, medications started or stopped, story notes). Nothing
  changes until she applies a suggestion in Attune.
- **Ask there, answered from her record.** The assistant reads only shared sections, with sources, under rules
  that forbid diagnosis, interpretation and treatment advice (`ASSISTANT_RULES`, returned with every read).
- **MCP connector** (`/mcp/<token>`) with `read_record`, `write_journal_entry` and `suggest_record_updates`. What
  assistants send is queued for the app, which runs it through the domain. The gateway calls no model.
- Home shows updates waiting from her assistant right after a live offer, or how to connect one. The Journal screen
  holds suggestions, a plain note box and recent notes.
- Constitution rule 13; `assistant` component rules.

# Capabilities
## New Capabilities
- `assistant-consent`: connecting, per-section grants, logged reads, disconnect.
- `journal-drafts`: journal entries and suggestions she applies or dismisses.
- `record-qa`: questions asked in her assistant, answered from shared sections only; no in-app chatbot.
- `mcp-connector`: tools for Claude, ChatGPT and other MCP clients; local-only app endpoints.

# Impact
Views: patient app (Home, Journal, AI assistants, Care team, Record). Components: `packages/domain` (types,
`assistant.ts`), `apps/web` (connector helper, hub sync, screens), new `apps/assistant` (connector gateway).
Stacks on `cancellation-fill`.

Excluded: an in-app chatbot, model calls from Attune, OAuth for the connector (URL tokens in the prototype), a
server-side record store, any clinician-facing AI, voice journaling.

Regulatory gates touched: consent (assistants are recipients; reads logged), FDA CDS (rules keep answers
display-only; Attune itself generates no answers), HIPAA (patient-directed sharing to her own assistant still needs
counsel's view and a review of each vendor's terms; ADR-007 still blocks real PHI).
