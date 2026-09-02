# Plutus Hotel Revenue website

This repository contains the static website for Plutus Hotel Revenue. It is intentionally built with HTML, CSS and JavaScript so it can run directly on GitHub Pages without a build framework or server runtime.

## Redesign structure

- `index.html` - home page
- `revenue_management.html` - outsourced revenue management service
- `software.html` and vendor pages - practical hotel technology guidance
- `tips.html` and three guide pages - hotel marketing resources
- `hotel-break-even-calculator.html` - browser-based hotel break-even calculator
- `navigation.js` - shared header, footer, responsive navigation and contact-form enhancement
- `calculator.js` - calculator model, validation, graph, local saving, copy and print tools
- `styles.css` - shared visual system and responsive layouts
- `tools/validate_site.py` - static integrity checks

The calculator runs entirely in the visitor's browser. Entries are stored only in that browser's local storage and are not uploaded to Plutus.

## Calculator model

The main calculation is:

```text
Available room nights = (total rooms - rooms out of order) x days
Contribution per occupied room = revenue per occupied room - variable and revenue-based costs
Break-even room nights = fixed costs / contribution per occupied room
Break-even occupancy = break-even room nights / available room nights
```

OTA commission is weighted by the share of room revenue sold through OTA channels. Payment and other revenue-based fees are applied to room and ancillary revenue. The result is a planning estimate and depends on the classification and accuracy of the assumptions entered.

## Validation

Run these checks before publishing:

```bash
python tools/validate_site.py
node --check navigation.js
node --check calculator.js
```

The production domain is configured through the existing `CNAME` file. Legal pages are operational drafts and should receive professional legal review before the redesigned site replaces the current public version.
