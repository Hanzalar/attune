<!-- CONSTITUTION:START -->
Generated from https://github.com/Hanzalar/attune/tree/meta/governance.
Source SHA-256: `d4cfc3e1c6f5445b9e6c41131dab1bd5bcb002e1ca631bc9dd093335b854e73a`.
Edit canonical sources in specs repo; regenerate this managed block.

# Component: web (Patient app, PCP admin and specialist admin pages over one shared record)

Read the root AGENTS.md and relevant specifications first.

- Views read rules from @attune/domain; do not re-implement stages, codes, ranking or evidence in components.
- Go through the store's act(); show the rule's refusal message instead of hiding the control.
- Use Attune Clinical UI (apps/web/DESIGN.md): tokens from src/design/tokens.ts and components from src/shared/ui.tsx; no raw colors, fonts or radii in views, and no status shown by color alone.
- Patient app is mobile-first: no horizontal scroll at 390px, safe-area insets respected, tap targets at least 44px.
- Admin views must stay usable at phone width even though they are designed for desktop.
- Keep files under 400 lines; split by tab or panel.
<!-- CONSTITUTION:END -->
