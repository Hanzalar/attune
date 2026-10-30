<!-- CONSTITUTION:START -->
Generated from https://github.com/Hanzalar/attune/tree/meta/governance.
Source SHA-256: `c2542066760117871f6fb341f5deb085cb87762c326bd8ef078da6d319126323`.
Edit canonical sources in specs repo; regenerate this managed block.

# Component: web (Patient app, PCP admin and specialist admin pages over one shared record)

Read the root AGENTS.md and relevant specifications first.

- Views read rules from @attune/domain; do not re-implement stages, codes, ranking or evidence in components.
- Go through the store's act(); show the rule's refusal message instead of hiding the control.
- Patient app is mobile-first: no horizontal scroll at 390px, safe-area insets respected, tap targets at least 22px.
- Admin views must stay usable at phone width even though they are designed for desktop.
- Keep files under 400 lines; split by tab or panel.
<!-- CONSTITUTION:END -->
