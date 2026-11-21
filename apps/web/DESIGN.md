# Attune design system

Attune's own design system for the patient app, the PCP portal, the specialist portal, ops and the demo hub.
Tokens live in [`src/design/tokens.ts`](src/design/tokens.ts); components live in [`src/shared/ui.tsx`](src/shared/ui.tsx)
and [`src/shared/Brand.tsx`](src/shared/Brand.tsx). Every view uses them. Do not add raw colors, fonts or radii in a view.
Source: the prototype handoff and its concept boards on `business` (`product/prototype-handoff.md`, ADR-011).

## What it should feel like

**Ethereal editorial, feminine, never bubbly.** The patient app reads like a quiet magazine page made for her: a
serif-italic voice, soft blooms of wine and blush, cream paper with a torn edge, and one clear Forest button. It is
finite: Home ends with "You're caught up." The clinician portals use the same colors, plainer and denser, because the
MA and the front desk work in them all day.

## Principles

1. **One thing per screen.** Each patient screen answers "what is this, what state is it in, what do I do next", with
   one primary action.
2. **The voice speaks, the interface instructs.** Instrument Serif Italic is for titles and short human lines ("take
   your time."). Anything she must read to act is set in Instrument Sans.
3. **Acknowledge, never advise.** Asides in her ink say what happened ("9 days in a row."). They never interpret a
   symptom, name a condition or suggest a treatment.
4. **Color is never the only signal.** Every status is an icon plus a word (`StatusPill`). Chips show a check when
   selected. Trend lines differ in lightness, not only hue.
5. **Calm by design.** No red dots, no badges, no infinite scroll, no tab bar. Navigation is Home plus two header icons
   (Record, Care team). The designer still has to confirm whether a small tab bar is allowed.
6. **The gone state is a real screen.** Most offers are opened after the slot is taken (research on `business`). "That
   slot just filled. You're still on the list." gets the same care as the offer.

## Color

| Token | Hex | Use | On Cream |
| --- | --- | --- | --- |
| `wine` (Orchid Wine) | #5A1428 | Header blooms, issue ink, the mark | 12.3:1 |
| `raspberry` | #8E3853 | Overlines, links, asides in her ink | 6.8:1 |
| `dustyRose` | #AE6679 | **Large type only** (24px+) and borders | 3.9:1 |
| `clay` | #C2A08B | Decorative washes and lines. **Never text.** | 2.2:1 |
| `blush` | #F0C9C8 | Soft fills, overlines on wine, focus halo, issue background | — |
| `bone` | #F4EBE4 | App canvas | — |
| `cream` | #FAF4EE | Paper, panels, text on wine and forest | — |
| `forest` | #2E3A2A | Body text, primary buttons | 11.0:1 |
| `inkMuted` | #5B6355 | Secondary text (derived) | 5.7:1 |
| `line` | #8F7E72 | Input and control borders (derived) | 3.6:1 |
| `hairline` | #E2D5CA | Decorative dividers only (derived) | — |
| `sage` / `sand` + `sandInk` | #E3E8DC / #EFE2D6 + #6E4E36 | Done / attention backgrounds (derived) | 5.9:1 |

Status tones: `done` (sage, check), `progress` (cream, dot), `attention` (sand, clock), `issue` (blush with wine ink,
triangle), `neutral` (bone, circle). Focus is a 2px Forest outline with a Blush halo, visible on cream and on wine.

## Typography

| Role | Face | Size / line height |
| --- | --- | --- |
| Display (demo hub) | Instrument Serif Italic | 54 / 1.05 |
| Screen title (patient) | Instrument Serif Italic | 42 / 1.05 |
| Page title (clinician) | Instrument Serif Italic | 30 / 1.05 |
| Aside, in her ink | Instrument Serif Italic, Raspberry | 22 / 1.2 |
| Overline | Instrument Sans 600, +0.16em, uppercase | 14 |
| Body, patient | Instrument Sans 400 | 16 / 1.5 |
| Body, clinician | Instrument Sans 400 | 14 / 1.45 |
| Dense table (clinician only) | Instrument Sans 600 | 12, uppercase headers |

Both faces are SIL OFL and **self-hosted** through `@fontsource`, so no page sends a patient's IP address to a font
CDN. Patient text never goes below 14px. Identifiers and times use tabular figures (`.tnum`).

## Surfaces and texture

- **Bloom** (`<Bloom variant="wine" | "soft">`): florals drawn in code, layered radial gradients under fine SVG grain.
  They stand in for photography. `wine` is the title band on patient sub-screens and the demo hub; `soft` sits at the
  foot of a page.
- **Paper** (`<Paper>`): cream stock with faint fibers and a deterministic torn bottom edge, lifted by a soft shadow.
  The patient app's main container: notes, offers, the booked card.
- **Panel** (`<Panel>`): the clinician container. Cream, 1px hairline border, 10px radius, titled header row.
- Radius: 6 (buttons, chips, inputs), 10 (panels), 16 (sheets). Spacing on a 4px grid. Tap targets 44px on patient
  screens, 32px on clinician desktop controls.

## Components

| Component | Rule |
| --- | --- |
| `Button` | `primary` (Forest fill), `secondary` (outline), `quiet` (Raspberry text), `onDark`. One primary per screen. |
| `StatusPill` | Icon + word + tone. Labels come from `REFERRAL_STATUS`, `SLOT_STATUS`, `OFFER_STATUS` in the domain. |
| `Overline`, `Voice`, `Ink` | Spaced caps, serif-italic titles, serif-italic asides. |
| `Chip` | Toggle chip; selected is Forest with a check. |
| `Dots` | Five open circles for a check-in scale, labelled at both ends. |
| `Toggle` | Switch with a label and a plain consequence ("Turning this off stops future sharing"). |
| `Countdown` | Hold time as digits (the signal) and a bar (the echo). |
| `Notice` | Inline context or rule, with an icon. |
| `PatientPack` | The one-page Pack. Every item names its source; unshared sections say "Not shared with this office". |
| `Trends` | Patient-logged check-ins as small lines with averages. No flags, scores or interpretation. |
| `useToast` / `useAct` | Run a command; a refusal shows the rule's own words. |

## Do not

- Use Clay or Dusty Rose for small text, or any color as the only signal.
- Put health details in anything that leaves the app (push, SMS, email, calendar files).
- Show a diagnosis-style label, a severity score or a suggestion to her ("you have", "probably", "try").
- Show a practice a waiting patient, the queue, or anything about her before she accepts.
- Add photography, stock imagery, emoji, glassmorphism or bubbly rounded cards.
- Load fonts or scripts from a third-party host.
