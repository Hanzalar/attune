## ADDED Requirements

### Requirement: Native connector for Claude and ChatGPT
The gateway SHALL expose an MCP server at `/mcp/<token>` with `read_record`, `write_journal_entry` and
`suggest_record_updates`. A token MUST belong to an active assistant link. What assistants send SHALL be queued for
the app, which runs it through the domain; the gateway MUST NOT change her record itself.
#### Scenario: Journaling from Claude
- **WHEN** she tells Claude "log that my skin flared" and Claude calls `write_journal_entry`
- **THEN** the entry appears in her Attune journal marked as written in Claude

### Requirement: App endpoints stay local
The gateway's app endpoints SHALL answer only requests addressed to localhost, so exposing the connector through a
tunnel exposes nothing else.
#### Scenario: Request through a tunnel
- **WHEN** a request for the hub inbox arrives with a public Host header
- **THEN** the gateway refuses it with 403
