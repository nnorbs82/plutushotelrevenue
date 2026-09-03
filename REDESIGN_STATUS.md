# Plutus Website Redesign Status

## Safety
- Production/default branch: `main`
- Main checkpoint at start of redesign: `31b84ede14b4a5f2c7023345f202bae8f2338464`
- Redesign branch: `plutus-redesign`
- Safety checkpoint branch: `pre-plutus-redesign-2026-09-02`
- The custom domain remains defined by the existing `CNAME` and is not being switched as part of redesign work.

## Design direction
The redesign keeps Plutus separate from the Hotel Elisabeth visual identity. It uses:
- dark editorial charcoal
- warm gold/champagne accents
- warm paper backgrounds
- large Newsreader display typography with Manrope UI typography
- asymmetric editorial layouts
- hotel-performance dashboard motifs
- restrained interaction and responsive mobile navigation

## Redesigned routes
- Home
- About
- Revenue Management
- Hotel Software
- Mews PMS
- Cloudbeds PMS
- SiteMinder
- Tips & Insights
- Hotel Photoshoot Tips
- Hotel Web Design Tips
- Digital Marketing Tips
- Blog
- Contact
- Privacy placeholder
- Terms placeholder
- Admin public-route guard

## New free tool
`break_even_calculator.html`

The calculator includes:
- rooms and analysis period
- target occupancy and ADR
- ancillary revenue per occupied room
- detailed fixed costs
- detailed variable occupied-room costs
- blended commission/payment cost percentage
- break-even occupancy
- occupied room nights required to break even
- average rooms per day required
- break-even revenue
- contribution per occupied room
- ADR required at target occupancy
- RevPAR
- operating result and margin
- 30%-100% occupancy scenario table
- live revenue-vs-total-cost canvas graph
- cost-structure view
- local browser persistence
- copyable summary
- print / save-to-PDF layout

## Content retained / reframed
Core Plutus positioning, founder experience, service scope, historical headline performance indicators and hotel-software categories were retained from the current repository, with wording reorganised for clarity and a more modern commercial narrative.

## Launch blockers / review items
1. Privacy policy: current repository contains no substantive policy copy. The redesign intentionally uses a launch-note placeholder rather than inventing legal terms.
2. Terms & Conditions: current repository contains no substantive terms. The redesign intentionally uses a launch-note placeholder.
3. Historical performance statistics should be reconfirmed before launch.
4. Software wording should receive a final owner review before publication.
5. Final cross-device visual QA should be done after the branch has a deployable preview URL.

## Launch rule
Do not merge `plutus-redesign` into `main` or change the production deployment until the redesigned branch has been visually reviewed and the legal-copy blockers above are resolved.
