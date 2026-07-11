# EV Site Planner

Browser-based survey, markup, pricing and compliance suite for UK EV charge point installers and local authorities. Built as a set of static pages that share one design system, one runtime helper script and device-local storage. No server, no build step, no framework.

The suite runs entirely in the browser. Projects, quotes and survey data are saved on the device against the address you use, not uploaded anywhere.

## Run it locally

The pages link to each other and to shared files by relative path, so they must be served over http. Opening a `.dc.html` file directly with `file://` will not work: browsers block local file access.

Zero dependencies (Node 18+):

```
npm start
```

Then open http://localhost:8000. Set a different port with `PORT=3000 npm start`.

No Node? Any static server works, pointed at the `public/` folder:

```
python3 -m http.server 8000 --directory public
```

On first load the pages pull web fonts and three libraries from public CDNs (see Runtime dependencies), so keep the device online the first time.

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
| `Landing Page Final.dc.html` | Marketing landing page and pricing |
| `EV Site Planner.html` | The core tool: photo survey, markup, cable sizing, load check, exports |
| `Quotes & Invoices.dc.html` | Price a plan, issue quotes and invoices, track the pipeline |
| `Project Support.dc.html` | Workplace charging project management enquiry (bespoke quote) |
| `Guide Library.dc.html` | How-to guides and useful links |
| `Learning Hub.dc.html` | Short interactive training courses |
| `Council Estate Review.dc.html` | Local-authority estate compliance review |
| `Estate Check Library.dc.html` | The 56-check library behind the estate review |
| `Estate Review One-Pager.dc.html` | Council-facing sales sheet |
| `Business Hub.dc.html` | Back-office suite home (not linked from the customer-facing pages by design) |
| `RAMS Builder.dc.html` | Risk assessments and method statements (gated as coming soon) |

Shared files, siblings of the pages so relative paths resolve:

- `support.js`, `doc-page.js`, `estate-check-library.js` : shared runtime helpers.
- `_ds/` : the EV Infrastructure Tools design system (CSS tokens, `styles.css`, `_ds_bundle.js`). Every `.dc.html` page loads it. Editing a token here changes every satellite page. The core planner (`EV Site Planner.html`) is self-contained and does not depend on the bundle the same way.
- `assets/` : logo marks.

The core planner is plain HTML/CSS/JS in a single file (it embeds jsPDF and a canvas markup engine). The satellite tools are `.dc.html` pages styled by the design system. This split is deliberate.

## Repo layout

```
public/            The deployable website (single source of truth)
  index.html
  *.dc.html, EV Site Planner.html
  support.js, doc-page.js, estate-check-library.js
  _ds/  assets/
serve.mjs          Zero-dependency static server for local dev
package.json       npm start / npm run serve
netlify.toml       Static publish config (publish = public)
.github/workflows/ GitHub Pages deploy
```

## Runtime dependencies

Loaded from public CDNs on demand, cached by the browser after first use:

- Google Fonts: Bricolage Grotesque, Hanken Grotesk, Space Grotesk.
- pdf.js (`pdfjs-dist`): reads PDF drawings dropped onto the canvas.
- heic2any: converts iPhone HEIC photos to a usable format.
- qrcode-generator: builds the QR code on shareable decision packs.

Everything else is in the repo. If you need a fully offline build, self-host these four and rewrite the `<script>` and font `@import` references.

## Data and storage

Projects, quotes and survey data live in the browser (localStorage and IndexedDB), keyed to the address the pages are served from. Return with the same browser and address to find the work. There is no backend. Serving the site from a new domain starts fresh.

## Compliance note

The tools assist design decisions. They do not certify designs. Responsibility for any installation stays with the qualified installer. The council estate review outputs are evidence aids, not statements of compliance.
