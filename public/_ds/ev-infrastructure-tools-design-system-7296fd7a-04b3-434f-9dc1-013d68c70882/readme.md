# EV Infrastructure Tools — Design System

**Identity:** *Current* direction — electric-blue roundel seal, cream chrome, slate-navy ink.
**Tagline:** *"The toolkit for building the charging network."*
**Founder signal:** *"Built by EV installers, for the trade"* — present but unnamed, a trust signal not a personal brand.

---

## The company

**EV Infrastructure Tools Ltd** builds purpose-built software for the EV charging installation industry. The audience is commercial & fleet installers, electrical contractors, housebuilders/developers and enterprise CPOs. The products are built by someone with real EV install experience — that's a differentiator, carried quietly.

### Product suite
| # | Product | What it does | Status |
|---|---------|-------------|--------|
| 01 | **Site Planner** | Photo markup, cable runs & auto-priced takeoff → branded PDF quote | Live |
| 02 | **Conductor** | BS 7671-compliant cable sizing — input the circuit, get the right cable + volt drop | In development |
| 03 | **Sparks** | AI install assistant trained on EV regs (OZEV, DNO, BS 7671, equipment spec) | Planned |
| 04 | **Foreman** | Project management built for EV installs — schedule engineers, track progress | Planned |

Products have **distinct names** tied loosely to the master brand. "Conductor" (cable = conductor), "Sparks" (trade slang for electrician), "Foreman" (site management). These are proposals — adjust freely.

### Sources
- **Real product:** `EV Site Planner (standalone).html` provided by the founder. The Site Planner UI kit is a faithful recreation; working decode at `uploads/planner_decoded.html`.
- **Brand:** original ground-up design, chosen from a 3-direction exploration at `explorations/Company Brand Directions.html`. Accent refreshed from the original copper to a vivid electric blue (`#1E6BFF`) — more energetic and on-theme for EV/electric, while keeping the cream chrome + slate-navy ink structure.

---

## Content fundamentals (voice & copy)

- **Person:** address the user as "you"; product is "EV Infrastructure Tools" or the specific product name. Imperative voice: "Set a scale", "Export the PDF", "Add a circuit".
- **Casing:** sentence case in all UI. No ALL CAPS except mono eyebrows/labels.
- **Length:** short. Buttons 1–3 words. Empty states: one helpful line. No padding copy.
- **Domain language:** use real installer terms — "DNO", "RCBO", "AFFL", "SWA", "volt drop", "BS 7671", "standard package", "surface reinstatement". This is what makes the brand authentic.
- **Numbers & units:** Space Grotesk numerals — `16mm²`, `32 m`, `CP-01`, `7kW AC`, `£1,840`.
- **Trust signal:** *"Built by EV installers, for the trade"* — use this, not a personal name.
- **Tone examples:**
  - Hero: *"The toolkit for building the charging network."*
  - Installer voice: *"Built by someone who's pulled real cable. Not a dev who Googled 'EV charger.'"*
  - Empty state: *"No photos yet — add one to start marking up."*
  - Status: `Within standard package` · `DNO application required` · `Scale not set`
- **No emoji.** The equipment colour palette carries visual meaning instead.

---

## Visual foundations

**Overall:** premium, infrastructure-grade, modern. Warm cream paper surfaces with cool slate-navy text — like a well-made technical manual. Electric-blue accent pops as the single brand colour.

### Colour system
- **Electric blue `#1E6BFF`** (`--accent-500`) — the brand mark. Used for primary actions, active tools, selection, the emblem. Always pair with cream/white text on top (`--accent-contrast = var(--cream-50)`). Never dark text on the blue fill.
- **Slate-navy `#16232E`** (`--ink-900`) — primary text and dark chrome (the photo canvas, rare dark panels). The emblem disc, and the "installed" status (kept navy so it stays distinct from the blue "planned" status).
- **Cream `#F4EFE5`** (`--cream-100`) — the app chrome. Warm light-grey panels, rails, headers. White cards float on top.
- **Equipment palette (`--eq-*`)** — the markup legend is a core brand asset: SWA orange, copper-wire periwinkle, DNO red, sub-distribution magenta, isolation steel, earth green, fused-spur gold, trunking grey. These domain colours are non-negotiable — they must be consistent across every tool.
- **Signal orange** — distinct from the electric-blue accent; used for hi-vis/field-create actions.
- **Stage (`--stage-*`)** — dark navy for the photo work canvas (Site Planner, mobile capture).
- **Green/amber/red/blue** — semantic states only (compliant/warning/fault/info).

### Typography
- **Bricolage Grotesque** (`--font-display`) — characterful premium grotesk. Headings, the wordmark, large callouts. 600–800 weight, tight tracking (-0.015 to -0.02em). Warm, distinctive, not corporate.
- **Hanken Grotesk** (`--font-sans`) — warm humanist grotesk for all body/UI copy. Dense tables and equipment schedules stay legible. 400–700.
- **Space Grotesk** (`--font-data`) — for all numbers, measurements, cable sizes, IDs. Engineered tabular feel: `16mm²`, `32 m`, `£1,840`. This is what makes the product feel precise.
- **IBM Plex Mono** (`--font-mono`) — raw code/values only, rare.

### Layout
- Light-first. Chrome (nav, panels, tool rails) is `--cream-100`. Cards are white. The work canvas (markup photo, map) is dark navy.
- 4px grid. Controls: 40px touch target default. Cards: 12px radius (`--radius-lg`).
- **Sidebar** is now light (warm cream), with an electric-blue active indicator — the product has warm, premium chrome, not a dark sidebar.

### Motion
- Fast, 120–180ms, `--ease-standard`. No bounce. Press = `translateY(1px)`. Primary hover = electric-blue step darker + `--shadow-accent-lg` glow. Respects `prefers-reduced-motion`.

### Logo
- Roundel seal — navy disc, electric-blue outer ring, blue dashed tick marks (meter dial), blue bolt.
- `assets/logo-mark.svg` — on light (cream/white) backgrounds.
- `assets/logo-mark-reversed.svg` — on dark (stage, ink-900) backgrounds; electric-blue disc, cream ring + navy bolt.
- `assets/favicon.svg` — simplified (disc + bolt, no ticks).
- Clear space: 0.5× emblem width on all sides. Never place on a patterned background.

---

## Iconography

- **Lucide** (https://lucide.dev) — clean outline icons, ~2px stroke, matching the premium engineering feel. CDN: `https://unpkg.com/lucide@latest`. Use `<i data-lucide="plug-zap"></i>` + `lucide.createIcons()`.
  - **Substitution flag:** Site Planner has its own inline SVG glyphs; Lucide is the closest open equivalent. Export those glyphs to `assets/icons/` to replace.
- **No emoji.** Equipment colour palette carries meaning instead.
- **Key glyphs:** `plug-zap`/`zap` (chargers), `square-stack` (EVDB), `gauge` (meter), `utility-pole` (DNO), `toggle-left` (isolator), `shield` (earth), `spline` (cable), `ruler` (set scale), `compass` (north), `file-down` (PDF export), `image-plus` (add photo), `sparkles` (Sparks AI), `calculator` (Conductor), `clipboard-list` (Foreman).

---

## Index / manifest

**Root** — `styles.css` (entry point), `readme.md`, `SKILL.md`.

**`tokens/`** — `fonts.css`, `colors.css`, `typography.css`, `spacing.css`, `elevation.css`, `base.css`.

**`assets/`** — `logo-mark.svg`, `logo-mark-reversed.svg`, `favicon.svg`, `image-slot.js`.

**`components/`** (each has `.jsx` + `.d.ts` + `.prompt.md`):
- `core/` — **Button**, **IconButton**, **Badge**, **Card**
- `forms/` — **Input**, **Select**, **Checkbox** (+ radio), **Switch**
- `navigation/` — **Sidebar** *(light-chrome, electric-blue active indicator)*, **Tabs**
- `data/` — **StatTile** (KPI), **StatusBadge** (EV equipment status)
- `map/` — **MapMarker**, **MapLegend**

**`ui_kits/`** — full-screen product recreations:
- `brand/` — **marketing homepage hero** with product suite. Use as the starting point for the website.
- `markup-tool/` — faithful Site Planner recreation (tool rail, dark canvas, side panel, PDF export).
- `dashboard/` — PM home (KPIs, project table, schedule, equipment usage).
- `site-map/` — network map with markers, legend and site detail card.
- `mobile/` — iOS field app (today's route, site detail, photo capture screen).

**`guidelines/`** — foundation specimen cards for the Design System tab (brand logo, electric-blue ramp, ink ramp, equipment palette, semantic colours, surfaces, display/body/data type, scale, spacing, elevation).

**`explorations/`** — `Brand Directions.html` (original 3-direction exploration), `Company Brand Directions.html` (the ground-up rebrand exploration).

---

## Using a component

```html
<link rel="stylesheet" href="styles.css" />
<script src="_ds_bundle.js"></script>
<script type="text/babel">
  const { Button, StatusBadge, MapMarker } = window.EVInfrastructureToolsDesignSystem_7296fd;
</script>
```
Runtime namespace: **`EVInfrastructureToolsDesignSystem_7296fd`**.

---

## Caveats & open questions

1. **Product names** (Conductor/Sparks/Foreman) are my proposals — confirm or rename.
2. **Fonts** are Google Fonts CDN (Bricolage Grotesque, Hanken Grotesk, Space Grotesk). Want them self-hosted? Send the woff2s or say the word and I'll write the `@font-face` rules.
3. **Icons** are Lucide — export the Site Planner's own glyphs and I'll swap them in.
4. **Dashboard/site-map/mobile** kits are brand-consistent companions, not recreations (only Site Planner source was available). Share those screens and I'll align them precisely.
5. **Emblem** is built from SVG. If you commission a proper logo, drop it into `assets/` and update the `@dsCard` brand card.
6. **Website** — the `ui_kits/brand/index.html` is a hero + suite section starter. Ready to extend into a full marketing site.
