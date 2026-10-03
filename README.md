# EV Site Planner

## Design lab and reliability

Open **Design lab** from a project for survey evidence, design comparison,
change impact, charging-day scenarios, phased expansion/replay and revision
history. See the [workflow guide](docs/design-lab.md) and
[independent electrical review handoff](docs/electrical-review-handoff.md).

Project saves now detect conflicting tabs. **Your projects → Recover missing
projects** can restore full saved records that disappeared from the index.
PDF.js is upgraded to the verified 6.3.289 release.

## Current workspace

The site includes the project dashboard and Markup workspace. Open a worked
example from Home to explore it, or import a project backup. Each site address
has its own browser storage; use a downloaded backup to move projects between
addresses or devices.

Site audits check an existing EV site against PAS 1899:2022 and the Public
Charge Point Regulations 2023. Start one from the Site audits section on Home,
or open a project and choose Audit this site. The site type and public access
decide which of the 23 checks apply; each is answered as Pass, Action needed,
Fail or Not applicable with a note, a measurement where there is a limit and
up to four photos, and the evidence pack PDF is reviewed and downloaded like
the other reports. The audit lives in the project record (`pack.audit`) and
rides inside backups; see [docs/site-audit.md](docs/site-audit.md). The check
wording is draft v0.9 pending specialist review, and the pack supports a
submission rather than certifying compliance.

Your projects shows a card for each saved project with a preview of its
marked-up plan, counts and record checks. The project overview opens with a
navy header and a five-step stage bar (Markup, Design lab, Programme, Snags and
Issue), and lists the record checks beside the next actions. See the
[page redesign notes](docs/page-redesign.md).

The preview adds a dashboard with an annotated plan preview and recorded next
actions, a searchable project list, collapsible navigation, a floating equipment
palette, a contextual settings panel and a drawing focus view. Shared typography,
forms and buttons also carry through to Profile and the delivery pages. Home,
the guide library and training courses use direct descriptions, consistent type
and responsive layouts. Guide search matches displayed titles and keywords.

Default customer reports and emails describe proposed work and recorded project
details. They no longer assume bookings, deliveries, fees, refunds or submitted
DNO applications. Previously saved email templates remain unchanged; resetting
a template loads the revised default. Knowledge checks are described as revision
and practice, with no claim to award a qualification. This copy review does not
replace a technical review of the reference material or electrical calculations.

The latest design pass groups selected-item settings into electrical, mounting,
appearance and design-option sections. A selected charger's label, model and
rating remain at the top. Model search, favourites and recently placed equipment
are available in the floating picker; Place another like this retains the chosen
configuration. Equipment references remain stable in project backups. Compact
on-screen labels have leader lines and avoid nearby equipment where space allows;
full labels remain available. The plan key is separate from the drawing, and
exported legends and title details sit below the artwork.

The overview uses compact counts and a single Continue markup action. Home shows
recent projects first when work is saved in the browser. Profile has Details,
Qualifications and Branding tabs, with a real sample PDF to check names and logos.
Plans, engineer/client packs, programmes and snag reports share page thumbnails,
zoom controls and a consistent review layout. Downloads use the previewed PDF.
Document footers share author, company, revision and preparation-date information.
Phone item controls open as a bottom panel with part of the drawing still visible.

Run `npm run test:refinement` for equipment search, favourites, configuration copies,
label preservation, report refresh/download behaviour, profile tabs and phone
reviews. Use the Playwright setup below. These preferences and projects remain
local to this browser; no account or shared equipment catalogue is required.

Run `npm run test:design` with the Playwright setup below for selection, placement,
editing, navigation, backup and PDF regression checks for this layout.

Run `npm run test:debug` for malformed backups, browser storage failures, project
and plan switching, PDF refresh races, cancelled imports and delayed image decoding.
The [debug audit](docs/debug-audit.md) records the fixes, coverage and limits.
The calculation checks in `npm test` verify recorded current caps, future positions
and arithmetic consistency across the configured cable families.

The guide library runs from plain-English basics to advanced design notes in four
levels, with diagrams, calculators, a glossary, level checks, saved guides and
reading progress. Inside the planner, Help buttons and ? buttons open the matching
guide in a help drawer, with search and a short tour. See
[docs/guide-library.md](docs/guide-library.md).

Browser-based survey, markup and planning tools for UK EV charge point installers.
The site opens on an integrated home page with recent projects, backup import and
a worked example. The project workspace brings together Overview, Markup,
Programme, Snags and Issue, alongside the 3D showroom, guides and training.

Open **My profile** from the home page or workspace sidebar to save your name,
role, contact details, company details, logo and qualifications. Qualification
records support an awarding body, certificate reference and expiry or renewal
date. Logos can be PNG, JPG, WebP or SVG and are converted to a portable image.

Profiles save in this browser and can be exported or imported as a separate
`.evprofile.json` backup. They pre-fill new projects when enabled. Each project
retains its own author snapshot; use **Use profile on this project** to update an
existing project. Name and branding appear on plan exports, with optional
qualifications on programme and snag reports. This is a local professional
profile, with no account registration or cross-device sync.

Projects stay in browser storage on the device and site address being used. There
is no application server or project upload. Download a JSON backup to keep a
separate copy or move work to another device. After the first save the planner
asks the browser to keep its saved projects when space runs low; browsers decide,
and Safari may still clear data after about a week without a visit. The backup
button shows a dot when a project has changes since its last backup, the
overview's backup card gives the date, and a reminder appears on the overview
when those changes follow a backup more than a week old (or no backup at all).
Saved projects keep their existing format and storage keys.

## Run and edit

Node 18 or later, with no runtime dependencies to install:

```sh
npm start
```

Open http://localhost:8000. Alternatively serve `public/` with any static server.

`public/EV Site Planner.html` is the canonical HTML entry. After editing it or the
workspace assets, run the small Python 3 packaging step:

```sh
npm run build
npm test
```

The packaging step updates asset content hashes and synchronises `index.html`,
`home.html` and `Landing Page Final.dc.html`. All four addresses open the same
home page and workspace. The generated pages are committed, so hosting requires
no build step. Avoid editing the generated copies independently.

## R2.2 release

- Reusable professional profiles, qualification records and company logo upload.
- Browser-local autosave with recovery, profile backup import and export.
- Project-specific author snapshots and branding on plan, programme and snag PDFs.

- Integrated home page, project details wizard and recent-project dashboard.
- Focused markup toolbar, technical tools menu and selected-plan PDF review.
- EV car-and-cable bay markings, colour options and custom bay text.
- Editable programme activities with owners, progress, overlapping dates and
  user-entered non-working dates.
- Snag register linked to the original canvas markers, with before/after photos,
  target dates, actions and close-out records.
- Programme and snag PDF previews with page navigation and zoom.
- Complete project snapshots, including work containing only site details or CDM
  records. Queued saves capture independent data and project changes are serialised.
- Backup imports create a separate record. Invalid files leave the current project
  intact, and a newer recovery copy takes precedence over an older stored record.

The existing CDM workspace, controlled-document register, risk records, safety
markings, commissioning data and legacy backup fields are retained. CDM controls
are available from the Technical menu and the Markup panel's Checks tab.

## Checks

`npm test` runs static integration, release, CDM lifecycle, RAMS bridge,
measurement, backup-validation, site audit, PDF-policy and calculation checks. Pull requests
run these plus all browser suites. GitHub Pages waits for the same checks before
publishing, including the Chromium, Firefox and WebKit reliability scenarios.

To run browser regression checks locally, install Playwright in a development
environment, install its Chromium browser, then run:

```sh
npm install --no-save --package-lock=false playwright@1.56.1
npx playwright install chromium firefox webkit
npm run test:browser
npm run test:profile
npm run test:reliability
EVSP_BROWSER=firefox npm run test:reliability
EVSP_BROWSER=webkit npm run test:reliability
```

An existing compatible Chromium can be supplied with
`CHROMIUM_EXECUTABLE_PATH=/path/to/chromium`. Set `EVSP_TEST_OUTPUT` to choose the
location for screenshots, the sample PDF and JSON results. The default is
`/tmp/evsp-browser-checks`.

The browser suite checks home-page assets, address-only recovery, duplicate-click
protection, save snapshot isolation, fallback recovery, safe backup import, CDM
access, plan PDF export, mobile layout, showroom, guides and training. Programme
and snag workflows were additionally exercised with legacy migration, overlapping
dates, photo evidence, filtered reports, long notes, pagination and reload.
The profile suite checks real editing, logo conversion and invalid-file recovery,
profile backup round trips, project snapshot isolation, preferences, branded PDF
downloads, storage failure recovery and narrow phone layouts.

## Deploy

`.github/workflows/deploy-pages.yml` publishes only `public/` on pushes to `main`.
The existing custom domain is managed by the repository's Pages settings.
`netlify.toml` also points to `public/` for compatible static hosting.

The first-party scripts and styles use content-versioned URLs. All fonts and
runtime libraries are served locally from `public/vendor/`, including PDF import,
HEIC conversion, 3D rendering and the resource-page runtime. The HEIC converter
loads only when a photo cannot be decoded natively; ordinary visits do not load
its 1.35 MB script. The 1.9 MB report fonts likewise download the first time a PDF
is prepared, or in the background on the Issue page. PDF imports and previews disable font-code evaluation. This is a static site,
not an offline PWA; the separately distributed portable build is a
different deliverable. `public/manifest.webmanifest` lets phones and tablets add
it to the Home Screen with its own name, icon and navy bar. On iPhone and iPad a
Home Screen app keeps its own storage, separate from Safari, so use a backup to
move projects between them.

## Source layout

| Location | Purpose |
|---|---|
| `public/EV Site Planner.html` | Drawing engine, compatibility and HTML entry |
| `public/workspace.js`, `workspace.css` | Project navigation, persistence and plan exports |
| `public/workbench.js`, `workbench.css` | Grouped item settings, equipment library, labels and responsive design |
| `public/report-viewer.js` | Shared PDF previews and document branding |
| `public/home.js`, `home.css` | Home page and recent projects |
| `public/profile.js`, `profile.css` | Personal and company profile, qualifications and report branding |
| `public/delivery.js` | Programme, snag records and PDF review |
| `public/audit-core.js`, `audit.js`, `audit.css` | Site audit checks, page, photos and evidence pack |
| `public/bay-markings.js` | Bay symbols and lettering |
| `public/report-fonts.js` | Embedded DejaVu fonts for new reports, loaded when a PDF is prepared |
| `public/manifest.webmanifest` | Home Screen name, colours and icons |
| `public/cdm-controls.js`, `cdm-controls.css` | Existing commercial CDM tools |
| `public/Guide Library.dc.html`, `guide-library.js`, `guides.js`, `guide-art.js`, `guides.css` | Guide library: content, diagrams and the library page |
| `public/help.js`, `help.css` | Help drawer, ? buttons and the planner tour |
| `public/Learning Hub.dc.html` | Training courses |
| `public/assets/`, `vendor/` | Local images, fonts and dependencies |
| `scripts/build-site.py` | Asset versioning and entry-page synchronisation |
| `scripts/make-app-images.cjs` | Redraws the app icons and link preview picture with Playwright |
| `tests/` | Static, lifecycle and optional browser checks |
| `unreleased/public/` | Held-back source, excluded from deployment |

Quotes/invoices, project support, RAMS and estate review remain outside the
published directory. Install Review remains removed. See `unreleased/README.md`.

The programme uses Monday to Friday plus the user's excluded dates; it does not
calculate a critical path or automatically supply bank holidays. Download history
records file downloads, not sending or approval. The tools assist qualified design
decisions and do not certify installations. This interface release does not claim
a new engineering or regulatory audit of inherited calculations or learning content.

## Design review, 3 October 2026

The [design review](docs/design-review-2026-10-03.md) checks every page, dialog and PDF at desktop, iPad and phone widths and recommends nine themes of design work in three tiers: fix what looks broken, make the client documents worth sending, stop showing passes the data does not support, make Markup work on an iPad, give readiness checks one home and one vocabulary, set a behaviour baseline for dialogs and assistive technology, shorten the route to the first plan, stop style drift, and polish the guides and phone layouts. Each of the 90 verified findings gives its evidence and a recommended change.

## Reliability review, 2 October 2026

The [deep review](docs/deep-review-2026-10-02.md) records fixes, remaining risks
and a prioritised product roadmap. Backups wait for pending image imports and
finish active routes, project lists retain entries beyond 100 projects, and
unsafe backup structures are rejected before replacing the open project.
Invalid route lengths have inline feedback. Missing upstream cable information
and unverified TT CPC disconnection data remain incomplete in calculations.
These changes do not validate the inherited engineering tables or replace a
qualified design review.


To run the planning browser suite on Linux, also install libheif-examples and
libheif-plugin-x265 so the genuine HEIC fixture can be generated:

```sh
EVSP_TEST_OUTPUT=/tmp/evsp-planning python3 tests/make-heic-fixture.py
EVSP_TEST_OUTPUT=/tmp/evsp-planning npm run test:planning
```

Use EVSP_BROWSER=firefox or EVSP_BROWSER=webkit to change engines.
The release workflow runs scripts/verify-live.mjs after Pages deployment,
checking the published bytes and HTTPS against the committed release.
