## ADDED Requirements

### Requirement: One design system
Every web view SHALL take colour, type, radius and elevation from `src/design/tokens.ts` and shared components from
`src/shared/ui.tsx`, as documented in `apps/web/DESIGN.md`.
#### Scenario: New view
- **WHEN** an agent adds a view
- **THEN** it uses the tokens and components and adds no raw colours or fonts

### Requirement: State is never colour alone
Statuses MUST pair colour with an icon and a word.
#### Scenario: Waiting status
- **WHEN** a referral waits on the PCP office
- **THEN** the view shows a warning pill with an icon and the words naming who it waits on

### Requirement: Readable and private by default
Text SHALL meet WCAG AA contrast; patient reading text SHALL be at least 16px; fonts SHALL be self-hosted so no page
requests a third-party host.
#### Scenario: Page load
- **WHEN** any page loads
- **THEN** every request goes to the site's own origin
