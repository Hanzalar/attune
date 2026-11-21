<!-- CONSTITUTION:START -->
Generated from https://github.com/Hanzalar/attune/tree/meta/governance.
Source SHA-256: `577080a22b334891250cb0a4e270f75e025ef1c785bc9454d2ab767b06217d1c`.
Edit canonical sources in specs repo; regenerate this managed block.

# Component: assistant (Connector gateway: the MCP connector Claude, ChatGPT and other assistants use to reach her record, plus the record hub. Calls no model.)

Read the root AGENTS.md and relevant specifications first.

- Build every record text an assistant sees with assistantContext from @attune/domain; never assemble record data here.
- Assistants only queue commands for the app; the app runs them through the domain. Never write the record from the gateway.
- Hub endpoints (/api/hub/*) answer only requests addressed to localhost; the connector requires a token from an active assistant link.
- The gateway never calls a model and holds no model credentials; the conversation happens in her assistant's own app.
- Keep the connector test (official MCP client over HTTP) passing. Synthetic data only (ADR-007).
<!-- CONSTITUTION:END -->
