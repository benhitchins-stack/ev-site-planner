# EV Site Planner: architecture

Last reviewed: Phase 1 stabilisation (July 2026).

## What this repository is

A fully static, browser-based suite for UK EV charge point installers and
local authorities. There is no backend, no build step and no framework in the
core planner: every page is served as-is from `public/`.

```
public/
  index.html                     Redirect to the landing page
  Landing Page Final.dc.html     Marketing / entry page (DC runtime)
  EV Site Planner.html           THE CORE PLANNER (single file, ~1.5 MB)
  Quotes & Invoices.dc.html      Quoting and invoicing satellite
  RAMS Builder.dc.html           RAMS satellite (gated "coming soon")
  Project Support.dc.html        Bespoke project-management requests
  Business Hub.dc.html           Standalone CRM (no planner linkage)
  Guide Library.dc.html          How-to guides
  Learning Hub.dc.html           Training courses
  Council Estate Review.dc.html  Local-authority estate review tool
  Estate Check Library / One-Pager
  support.js                     DC runtime (React-based) for the .dc.html pages
  doc-page.js, estate-check-library.js
  vendor/                        Self-hosted libraries and fonts (no CDN calls)
  assets/                        Logos
serve.mjs                        Zero-dependency static dev server (PORT, default 8000)
playwright.config.js             Test configuration (starts serve.mjs itself)
tests/                           Playwright regression suite
docs/                            This documentation
```

## The core planner

`public/EV Site Planner.html` is a single self-contained file: CSS, HTML and
roughly 14,000 lines of application JavaScript, plus embedded vendored
libraries (jsPDF; three.js is loaded from `vendor/` for the 3D showroom).

Why a single file: the planner predates any tooling in this repository and is
deliberately distributable as one artefact. Installers can download the HTML
file and open it locally (there is a runtime warning banner for restricted
previews). Splitting it into modules is a Phase 2+ decision and must weigh
that offline, single-file use case.

Internal structure, in file order:

1. Main stylesheet, then a second `enh-2026` style block (site walk, cable
   check, stage navigation and overview styles).
2. Body markup: header (brand, mode switch, site chip, Find, File, undo/redo,
   Features, Export), the stage bar (`#stagebar`), the workspace (category bar
   `#catbar`, tool palette `#rail`, canvas `#cv`), the side panel (`#side`,
   Pack/Selected tabs) and a set of dialog backdrops.
3. Application script:
   - `MODES`, asset/route/mark definitions, rate and compliance tables
   - `pack` state, `newPack()`, `normalisePack()` (the schema authority)
   - canvas engine (`draw`, `drawScene`, pointer handling, tools)
   - history (`snapshot`, `pushHist`, `undo`, `redo`)
   - autosave (`autosaveNow`, IndexedDB with localStorage fallback)
   - side panel (`renderSide`, `packPanel`, `propsPanel`, `wireSide`)
   - project stages (`evalProject`, `overviewBody`, `buildStageBar`,
     `setStage`, the action runner)
   - exports (engineer/client/summary PDFs, PNG, CSV, SLD, DNO, programme,
     BOM, handover certificate, decision pack)
   - projects store, cross-module links, Find palette, welcome dialog
   - boot sequence (bottom of the file)

## The seven-stage journey (Phase 1)

The stage bar under the header presents Overview plus Survey, Design, Verify,
Price, Plan, Install and Handover. Stages only regroup the existing side-panel
cards; the canvas and tools are shared by every stage. `evalProject()` derives
each stage's status (Not started, In progress, Ready for review, Complete,
Blocked), the open-issue list and the deterministic Next action from pack data
only. Statuses are advisory summaries, not certifications: Complete is only
awarded on explicit user evidence (survey shots filed, quote accepted,
compliance closed, snags signed off, commissioning signed off).

## Satellite tools and coupling

The satellites are React-style pages mounted by `support.js` (the DC runtime).
The planner never imports it. All coupling between planner and satellites is
device-local storage plus URL hashes:

- Planner writes `evsp_projects` and `evsp_proj_<id>`, then navigates to a
  satellite with `#from=<projId>`.
- Satellites stamp the planner id into their own records
  (`plannerRef.projId`, `planId`, `packId`) and the planner reads those
  stores back to show linked chips and quote drift.

See `docs/STORAGE.md` for the full key inventory.

## Hosting and deployment

- GitHub Pages serves `public/` on every push to `main`
  (`.github/workflows/deploy-pages.yml`).
- `netlify.toml` supports the same static publish if connected.
- Tests run in a separate workflow (`planner-tests.yml`) and never deploy.

## Major runtime dependencies

All self-hosted under `public/vendor/`: jsPDF (embedded), pdf.js, three.js,
Babel (for the DC pages), heic2any, qrcode, React (production build) and the
font files. There are no CDN requests; the only optional outbound call is the
postcode lookup (postcodes.io) which degrades silently when offline.

## Current limitations

- The planner file is large (about 1.5 MB raw, 0.43 MB gzipped) and is parsed
  in one go; local first paint is fast but slow devices pay a parse cost.
- `renderSide()` rebuilds the whole side panel with innerHTML and is called
  from `draw()`, including during pan and zoom. With a 75-item pack a pan
  frame costs roughly 10 to 17 ms. Pre-existing behaviour; acceptable today
  but the first place to look for Phase 2 performance work.
- Undo history serialises the entire pack, including photo data URLs, capped
  by count (40) and character budget.
- One browser profile equals one device store. There is no sync, no multi-user
  and no server backup. Export files are the durable copies.
