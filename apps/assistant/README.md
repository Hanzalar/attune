# Attune assistant gateway

Makes Attune AI-native. She journals in plain words, and an assistant drafts the record updates (check-in
scores, medications started or stopped, notes for her story) for her to approve. She asks about her stats, labs,
visits and Patient Pack, and gets answers drawn only from what she shared.

Two ways in:

| Path | What it does | Needs |
| --- | --- | --- |
| **In-app Claude** | The Journal and Ask screens in the patient app call Claude through this gateway | This gateway running, Claude credentials, and Claude connected under Care team |
| **MCP connector** | Claude, ChatGPT or any MCP client reads her record, journals for her and drafts updates through `/mcp/<token>` | This gateway running and reachable by the assistant, and that assistant connected under Care team |

Without the gateway (the public demo on GitHub Pages), the app falls back to **demo replies**: a rules-based
stand-in that runs in the browser. Every demo reply is labelled "Demo replies (no AI model)".

## Run it

```bash
npm run assistant            # http://127.0.0.1:8787; the Vite dev server proxies /api to it
npm run dev                  # in another terminal
```

Credentials for in-app Claude are resolved by the Anthropic SDK: `ANTHROPIC_API_KEY`, or a profile from
`ant auth login`. Without them, the app says Claude isn't set up and uses demo replies. The connector works without
credentials, because it never calls a model; the assistant on the other end does.

Model: `claude-opus-5-5` at low effort, with server-side fallbacks enabled, so a safety decline is retried on
another model in the same call.

## Connect an assistant

1. In the patient app, open **Care team → AI assistants** and connect Claude or ChatGPT. Pick the sections it may
   read. Insurance is off by default.
2. The app shows a connector URL with a private token: `http://localhost:8787/mcp/<token>`.
3. Add it to the assistant:
   - **Claude Code:** `claude mcp add --transport http attune <url>`
   - **Claude or ChatGPT apps:** add a custom connector (MCP) with the URL. They connect from the internet, so
     expose the gateway through an HTTPS tunnel and set `VITE_CONNECTOR_BASE` to the tunnel's address so the app
     shows the right URL.

Tools the assistant gets:

| Tool | What it does |
| --- | --- |
| `read_record` | The sections she shared, each fact with its source, plus the rules (no diagnosis, no treatment advice) |
| `write_journal_entry` | Saves her words to her Attune journal |
| `suggest_record_updates` | Drafts updates. Each shows in the app and changes nothing until she applies it |

Every read appears in the app under **Your record → Who viewed your record**. Disconnecting ends the token and
every grant.

## How it stays safe

- **Consent per section, per assistant.** Assistants are recipients like practices. The gateway builds the
  record text with the same domain function (`assistantContext`) the app uses.
- **Drafts, not edits.** Assistants never change her record. The app runs each queued item through the domain,
  which checks the connection, the consent and each draft again.
- **Local by default.** The server binds `127.0.0.1`. App endpoints (`/api/*`) refuse any request not addressed to
  localhost, so a tunnel exposes only the token-guarded connector.
- **Nothing is stored.** The hub holds the latest record and a queue of commands in memory.
- **Synthetic data only.** No real health data until the HIPAA posture is decided (ADR-007). Real use needs a BAA
  with each model provider, OAuth for the connector (the MCP authorization spec) in place of URL tokens, and a
  server-side record store (`shared-record-api`).

## Test

`npm test` starts this gateway and drives the connector over HTTP with the official MCP client
(`test/connector.test.ts`). It needs no credentials.
