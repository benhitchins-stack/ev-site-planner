# EV Site Planner

Browser-based survey, markup and planning tools for UK EV charge point installers. The released site centres on the EV Site Planner, with a 3D charger showroom, guide library and training courses. It uses static pages, device-local storage and no application server or build step.

The suite runs entirely in the browser. Project and survey data are saved on the device against the address you use, not uploaded anywhere.

## Run it locally

The pages link to each other and to shared files by relative path, so they must be served over http. Opening a `.dc.html` file directly with `file://` will not work: browsers block local file access.

Zero dependencies (Node 18+):

```
npm start
```

Then open http://localhost:8000. Set a different port with `PORT=3000 npm start`.

Run the static integration and CDM lifecycle tests with:

```
npm test
```

No Node? Any static server works, pointed at the `public/` folder:

```
python3 -m http.server 8000 --directory public
```

Every font and library is served from the site itself (`public/vendor/`), so it runs with no external requests at all, including fully offline hosting.

## Deploy it

Everything under `public/` is the complete website, ready to host. It is pure static output, so any static host serves it.

- GitHub Pages: automatic. `.github/workflows/deploy-pages.yml` publishes `public/` on every push to `main` and enables the Pages site on its first run.
- Netlify: `netlify.toml` sets `publish = "public"` with no build command. Drag the `public/` folder onto Netlify Drop, or connect the repo.
- Cloudflare Pages / Vercel: set the build output (publish) directory to `public` and leave the build command empty.

Point the host's default document at `index.html`; it redirects to the landing page.

## What is in the suite

Entry point: `public/index.html` redirects to the landing page. From there the pages cross-link.

| Page | What it is |
|------|------------|
| `Landing Page Final.dc.html` | Focused product landing page |
| `EV Site Planner.html` | The core tool: photo and drawing markup, cable sizing, load checks, CDM project controls, 3D charger showroom and exports |
| `Guide Library.dc.html` | How-to guides and useful links |
| `Learning Hub.dc.html` | Short interactive training courses |

Shared files, siblings of the pages so relative paths resolve:

- `support.js` : runtime helper for the guide library and training courses.
- `cdm-controls.js`, `cdm-controls.css` : the planner's commercial CDM workspace, controlled-document register, design-risk workflow and pack export.
- `assets/` : logo marks.

The main planner page is plain HTML/CSS/JS and embeds jsPDF and its canvas markup engine. Its commercial CDM workspace is loaded from the sibling `cdm-controls.js` and `cdm-controls.css` files.

## Held-back features

Quotes and invoices, project support, RAMS and estate review remain versioned under `unreleased/public/`. That directory is deliberately outside the deployed `public/` root, so these pages and their supporting assets cannot be reached on the live site. See `unreleased/README.md` for the release checklist.

## Repo layout

```
public/            The deployable website (single source of truth)
  index.html
  Landing Page Final.dc.html, EV Site Planner.html
  Guide Library.dc.html, Learning Hub.dc.html
  support.js, cdm-controls.js, cdm-controls.css
  assets/  vendor/
unreleased/public/ Source for held-back features, excluded from deployment
serve.mjs          Zero-dependency static server for local dev
package.json       npm start / npm run serve
netlify.toml       Static publish config (publish = public)
.github/workflows/ GitHub Pages deploy
```

## Runtime dependencies

All self-hosted in `public/vendor/` (versions and licences in `vendor/NOTICE.md`); the site makes no CDN or font-service requests:

- Fonts: Bricolage Grotesque, Hanken Grotesk, Space Grotesk, IBM Plex Mono (variable woff2, SIL OFL 1.1).
- pdf.js: reads PDF drawings dropped onto the canvas.
- heic2any: converts iPhone HEIC photos to a usable format.
- three.js: the 3D equipment showroom.
- React, ReactDOM and Babel standalone: the runtime for the design-system pages, loaded by `support.js`.

## Data and storage

Projects and survey data live in the browser (localStorage and IndexedDB), keyed to the address the pages are served from. Return with the same browser and address to find the work. There is no backend. Serving the site from a new domain starts fresh.

## Compliance note

The tools assist design decisions. They do not certify designs. Responsibility for any installation stays with the qualified installer.
