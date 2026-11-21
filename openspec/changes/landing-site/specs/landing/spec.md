## ADDED Requirements

### Requirement: Three audience views
The landing page SHALL present separate views for patients, PCP offices and specialists, reachable by `#patients`,
`#pcp` and `#specialists`, each naming what that audience does and linking to its demo view.
#### Scenario: Specialist link
- **WHEN** a visitor opens `/attune/#specialists`
- **THEN** the specialists view is shown and links to `specialist/`

### Requirement: Honest claims only
The page MUST NOT claim pricing, compliance, FDA status, live clinic use or testimonials, and MUST state that the demo
is synthetic and that Attune does not diagnose or treat.
#### Scenario: Status notice
- **WHEN** a visitor reads the page
- **THEN** a notice says Attune is an early demo with synthetic data

### Requirement: No third-party requests
The page SHALL load every asset from its own origin.
#### Scenario: Page load
- **WHEN** the page loads
- **THEN** no request goes to another host

### Requirement: Safe deploy overlay
The Pages build MUST fail if a landing file would overwrite a file from the app build.
#### Scenario: Clash
- **WHEN** the landing branch adds a path that exists in the app build
- **THEN** the overlay step fails and nothing deploys
