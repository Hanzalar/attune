# Attune connector gateway

Attune has no chatbot of its own. She talks to the AI assistant she already uses (Claude, ChatGPT or any app that
supports MCP), and that assistant reaches her Attune record through this connector:

- **Journal there, record here.** "Log that I slept badly and my skin broke out." The assistant saves her words to
  her Attune journal and suggests updates (check-in scores, medications started or stopped, story notes). Nothing
  changes until she applies each one in Attune.
- **Ask there, answered from her record.** "What was my last A1c?" The assistant reads only the sections she
  shared, with sources, under rules that forbid diagnosis and treatment advice.
- **Every read is logged** under "Who viewed your record". She can change sections or disconnect at any time.

This server never calls a model. It holds no credentials; the assistant on the other end does the talking.

## Run it

```bash
npm run assistant            # connector gateway on http://127.0.0.1:8787
npm run dev                  # the app; Vite proxies /api/hub to the gateway
```

## Connect an assistant

1. In the patient app, open **Care team → AI assistants** and connect Claude or ChatGPT. Pick the sections it may
   read. Insurance is off by default.
2. The app shows a private connector address: `http://localhost:8787/mcp/<token>`.
3. Add it to the assistant:
   - **Claude Code:** `claude mcp add --transport http attune <url>`
   - **Claude or ChatGPT apps:** add a custom connector (MCP) with the address. They connect from the internet, so
     expose the gateway through an HTTPS tunnel and set `VITE_CONNECTOR_BASE` to the tunnel's address so the app
     shows the right one.

| Tool | What it does |
| --- | --- |
| `read_record` | The sections she shared, each fact with its source, after the rules every assistant follows |
| `write_journal_entry` | Saves her words to her Attune journal, marked as written in that assistant |
| `suggest_record_updates` | Suggests updates that wait in Attune until she applies or dismisses each one |

## How it stays safe

- **Consent per section, per assistant.** Assistants are recipients like practices. The record text comes from the
  same domain function the app uses (`assistantContext`).
- **Suggestions, not edits.** The gateway only queues commands. The app runs each one through the domain, which
  checks the connection, the consent and every suggested change again.
- **Local by default.** The server binds `127.0.0.1`. The hub endpoints (`/api/hub/*`) refuse any request not
  addressed to localhost, so a tunnel exposes only the token-guarded connector.
- **Nothing is stored.** The hub holds the latest record and a queue of commands in memory.
- **Synthetic data only.** No real health data until the HIPAA posture is decided (ADR-007). Real use needs OAuth
  for the connector (the MCP authorization spec) instead of URL tokens, a server-side record store
  (`shared-record-api`), and a review of each assistant vendor's terms for health data.

## Test

`npm test` starts this gateway and drives the connector over HTTP with the official MCP client
(`test/connector.test.ts`).
