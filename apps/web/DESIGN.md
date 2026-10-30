# Attune Clinical UI

Attune's own design system for the patient app, PCP admin, specialist admin, the walkthrough and the landing page.
Tokens live in [`src/design/tokens.ts`](src/design/tokens.ts); components live in [`src/shared/ui.tsx`](src/shared/ui.tsx).
Every view uses them. Do not add raw colors, fonts or radii in a view.

## What it should feel like

Clinical software people trust at a glance: calm, precise, dense where staff work all day, and generous where
patients read on a phone. One visual system across all three views, so a referral looks the same to the patient,
the MA and the front desk.

## Principles

1. **Read first, decorate never.** Every screen answers "what is this, what state is it in, what do I do next" in
   that order. One primary action per screen.
2. **Color is never the only signal.** About 8% of men have color-vision deficiency. Every status pairs a color with
   an icon and a word (`StatusPill`). Charts are distinguishable in grayscale. (NHS colour guidance; NIST GCR 15-996.)
3. **One limited palette.** One brand blue, three status hues (success, warning, danger), cool neutrals. No second
   palette for any one view. Switching color systems inside one app is an EHR usability failure.
4. **Contrast at WCAG AA or better.** Body text at least 4.5:1, large text, icons and input borders at least 3:1. Focus is a
   2px ink ring with an amber halo, visible on white and on navy.
5. **Show the next step and its owner.** Like a good booking flow: one decision per step, a visible progress bar,
   immediate feedback on every tap, and the "in network" answer on the card, not behind a click.
6. **Identifiers are monospace.** Codes, NPIs, fax numbers, reference IDs and times use Plex Mono with tabular
   figures so 0/O and 1/l/I never get confused.

## Typography

| Role | Face | Size / line height | Weight |
| --- | --- | --- | --- |
| Display (landing only) | IBM Plex Sans | 38 / 1.15 | 600 |
| Page title | IBM Plex Sans | 24 / 1.25 (patient), 20 / 1.3 (clinical) | 600 |
| Section title | IBM Plex Sans | 18 / 1.35 | 600 |
| Body, patient | IBM Plex Sans | 16 / 1.5 | 400 |
| Body, clinical | IBM Plex Sans | 14 / 1.45 | 400 |
| Label, overline | IBM Plex Sans | 12 / 1.3, +0.04em, uppercase | 600 |
| Data, identifiers | IBM Plex Mono | 13 to 14, tabular | 500 |

IBM Plex is open source (SIL OFL), was drawn for interfaces, has tabular figures and distinct I, l and 1. It is
**self-hosted** from `@fontsource`, so no page sends a patient's IP address to a font CDN.
Patient reading text never goes below 16px; clinical tables never below 13px.

## Color

| Token | Hex | Use |
| --- | --- | --- |
| `canvas` | #F3F5F8 | App background |
| `surface` | #FFFFFF | Cards, panels, tables |
| `sunken` | #EEF1F5 | Wells, read-only fields, code chips |
| `border` / `borderStrong` | #D3DAE3 / #7D8A9A | Dividers / input outlines (3.5:1 on white) |
| `text` / `textMuted` / `textSubtle` | #101A28 / #4A5869 / #5C6875 | Primary, secondary, tertiary text |
| `brand` / `brandHover` / `brandSoft` | #0B5E8E / #084A70 / #E6F0F7 | Primary actions, links, selection |
| `navy` | #0F2338 | Clinical header bar, landing hero |
| `success` + `successSoft` | #17714A / #E4F3EB | Done, signed, in network, booked |
| `warning` + `warningSoft` | #8A5A00 / #FFF3D6 | Waiting, needs review, lab gap |
| `danger` + `dangerSoft` | #B3261E / #FCE9E7 | Declined, withdrawn, out of network, errors |
| `focus` | #F2A900 | Outer halo of the focus ring; the inner 2px ring is `text`, so focus is 17:1 on light and 8:1 on navy |

## Shape and space

- Radius: 4 (chips, inputs), 6 (buttons, cards), 10 (sheets and modals). No pill-shaped cards.
- Spacing on a 4px grid. Patient screens use 16px gutters and 12px between cards; clinical screens 16px panel padding.
- Borders separate; shadows only lift overlays (`ELEVATION.overlay`). Cards get a 1px border, not a shadow.
- Tap targets: 44px minimum on patient screens, 32px on clinical desktop controls.

## Components

| Component | Rule |
| --- | --- |
| `Button` | `primary` (brand fill), `secondary` (outline), `quiet` (text), `danger`. One primary per screen. Disabled buttons say why nearby. |
| `StatusPill` | Icon + word + tone. Tones: `neutral`, `info`, `success`, `warning`, `danger`. |
| `Panel` | Clinical container with a titled header row and optional right-side meta. |
| `Card` | Patient container: white, 1px border, 6px radius. |
| `Stepper` | Numbered steps with the current one named. Used for the booking flow. |
| `SlotButton` | A bookable time. Shows day and time on two lines; selected state is brand fill plus a check icon. |
| `ProviderCard` | Name, practice, in-network pill, distance, next openings as `SlotButton`s, PMOS experience. Never shows commercial status. |
| `Notice` | Inline banner for context or rules (info, warning, danger), with an icon. |
| `Metric` | Label, monospace value with unit, and a status line with icon. |
| `Toast` | Bottom-center confirmation of the last action; errors stay longer and say how to fix it. |

## Patterns

- **Booking (patient):** Choose doctor and time, choose what to share, review and send, then track. The progress bar
  stays visible. The held time shows on every later screen until the office confirms it.
- **Work queue (PCP, specialist):** Left list with status pills, right detail. The detail ends in one decision row.
  Rule refusals show as a toast with the rule's own message, never a silently hidden button.
- **Evidence:** Every item names its source in a `Chip`. Patient-logged data is labelled as such.

## Do not

- Use serif display faces, coral or cream backgrounds, gradients, glassmorphism or emoji.
- Encode state with color alone, or put meaning in placeholder text.
- Rank, badge or highlight a specialist by commercial relationship.
- Show diagnosis-style labels to patients ("your type", "you have"). Show what was tracked and where it came from.

## Sources

- NIST GCR 15-996, *Technical Basis for User Interface Design of Health IT* (Wiklund et al., 2015).
- NHS digital service manual, colour: do not rely on colour alone.
- Healthcare IT News, "5 dos and don'ts of EHR interface design": limited palette, consistency across screens.
- Pratt IxD critique of Zocdoc (2024): step-by-step constraints, in-network signal on the card, immediate slot feedback.
