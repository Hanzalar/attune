<!-- CONSTITUTION:START -->
Generated from https://github.com/Hanzalar/attune/tree/meta/governance.
Source SHA-256: `0417ada0d96d6d34a9e4839a11d57fba5163667b0e1e7e2917eb6bfe0b9fa036`.
Edit canonical sources in specs repo; regenerate this managed block.

# Component: assistant (Assistant gateway: in-app Claude for the journal and Ask screens, record hub, and the MCP connector for Claude and ChatGPT)

Read the root AGENTS.md and relevant specifications first.

- Build every record text an assistant sees with assistantContext from @attune/domain; never assemble record data here.
- Assistants only queue commands for the app; the app runs them through the domain. Never write the record from the gateway.
- App endpoints (/api/*) answer only requests addressed to localhost; the connector requires a token from an active assistant link.
- Call Claude through the official Anthropic SDK with structured outputs for drafts; handle refusal stop reasons and map SDK errors to sentences a patient can act on.
- Keep the connector test (official MCP client over HTTP) passing without credentials. Synthetic data only (ADR-007).
<!-- CONSTITUTION:END -->
