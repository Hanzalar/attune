<!-- CONSTITUTION:START -->
Generated from https://github.com/Hanzalar/attune/tree/meta/governance.
Source SHA-256: `25efcf711b801a7f064944b99eb9a7a94a1a141239ce82f2aa267fdfa1fab7f3`.
Edit canonical sources in specs repo; regenerate this managed block.

# Component: web (Patient app, PCP portal, specialist portal, ops and demo hub over one shared record)

Read the root AGENTS.md and relevant specifications first.

- Views read rules and read models from @attune/domain; do not re-implement statuses, eligibility, ordering or consent in components.
- Go through the store's act(); show the rule's refusal message instead of hiding the control.
- Use the Attune design system (apps/web/DESIGN.md): tokens from src/design/tokens.ts and components from src/shared/ui.tsx; no raw colors, fonts or radii in views, and no status shown by color alone.
- Patient app is mobile-first: text 14px or larger, no red dots or badges, no infinite scroll, no horizontal scroll at 390px, tap targets at least 44px.
- Clinician portals stay usable at phone width even though they are designed for desktop.
- Keep files under 400 lines; split by screen or panel.
<!-- CONSTITUTION:END -->
