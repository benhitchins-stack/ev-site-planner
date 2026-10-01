# EV Site Planner

Browser-based survey, markup and planning tools for UK EV charge point installers.
The site opens on an integrated home page with recent projects, backup import and
a worked example. The project workspace brings together Overview, Markup,
Programme, Snags and Issue, alongside the 3D showroom, guides and training.

Projects stay in browser storage on the device and site address being used. There
is no application server or project upload. Download a JSON backup to keep a
separate copy or move work to another device.

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

## R2.1 release

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

`npm test` runs the static integration, release, CDM lifecycle and RAMS bridge
checks. GitHub Pages runs these checks before publishing.

For the optional browser regression suite, install Playwright in a development
environment, install its Chromium browser, then run:

```sh
npm install --no-save --package-lock=false playwright
npx playwright install chromium
npm run test:browser
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

## Deploy

`.github/workflows/deploy-pages.yml` publishes only `public/` on pushes to `main`.
The existing custom domain is managed by the repository's Pages settings.
`netlify.toml` also points to `public/` for compatible static hosting.

The first-party scripts and styles use content-versioned URLs. All fonts and
runtime libraries are served locally from `public/vendor/`, including PDF import,
HEIC conversion, 3D rendering and the resource-page runtime. This is a static site,
not an installable offline PWA; the separately distributed portable build is a
different deliverable.

## Source layout

| Location | Purpose |
|---|---|
| `public/EV Site Planner.html` | Drawing engine, compatibility and HTML entry |
| `public/workspace.js`, `workspace.css` | Project navigation, persistence and plan exports |
| `public/home.js`, `home.css` | Home page and recent projects |
| `public/delivery.js` | Programme, snag records and PDF review |
| `public/bay-markings.js` | Bay symbols and lettering |
| `public/report-fonts.js` | Embedded DejaVu fonts for new reports |
| `public/cdm-controls.js`, `cdm-controls.css` | Existing commercial CDM tools |
| `public/Guide Library.dc.html`, `Learning Hub.dc.html` | Guidance and courses |
| `public/assets/`, `vendor/` | Local images, fonts and dependencies |
| `scripts/build-site.py` | Asset versioning and entry-page synchronisation |
| `tests/` | Static, lifecycle and optional browser checks |
| `unreleased/public/` | Held-back source, excluded from deployment |

Quotes/invoices, project support, RAMS and estate review remain outside the
published directory. Install Review remains removed. See `unreleased/README.md`.

The programme uses Monday to Friday plus the user's excluded dates; it does not
calculate a critical path or automatically supply bank holidays. Download history
records file downloads, not sending or approval. The tools assist qualified design
decisions and do not certify installations. This interface release does not claim
a new engineering or regulatory audit of inherited calculations or learning content.
