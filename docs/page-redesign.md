# Page redesign

Implemented 2 October 2026. The sidebar, routes and project flow are unchanged; this pass redesigns the page content.

## Review findings

- **Your projects** gave three equal-weight header buttons, including the rarely needed recovery action. The current project appeared twice with the same details. Project rows showed little beyond a name and date, and one project left most of the page empty.
- **Project overview** did not show progress through Markup, Design lab, Programme, Snags and Issue in one place. The right column ended early, the lower sections had no card edges and different alignments, and a heavy outline surrounded the title after navigation.
- **Design lab and Snags** used tall count tiles with uppercase labels and no status colour. Design lab sections wrapped onto two rows of buttons on tablets.
- **Review & issue** left the seventh document type alone on a row.
- **Programme and snag registers** used 10–12px text, which is small on a tablet.

## Changes

- Your projects has New project and Open backup in the header, a Continue working card with the plan, counts and Open project / Go to markup actions, and a card grid with plan previews, type and revision, plan / charger / open-snag counts, record checks and the edit date. The project already open is marked "Open now". The whole card opens the project. Recovery moved to a storage panel at the foot of the page. Phones use compact rows.
- The project overview adds a five-step stage bar. Each step shows a status (done, in progress, needs attention or to do) and opens its page. The plan card carries the plan, charger, route and snag counts. A Record checks card lists the existing readiness checks beside Next actions. Site and contacts, Programme, Recent downloads and Project backup are equal cards. Tablets show the plan full width with the two summary cards side by side.
- Design lab sections use a single scrolling tab row. Count tiles in Design lab and Snags use sentence-case labels and coloured edges for measured, assumed, missing, open, fixed and overdue.
- Review & issue groups documents into Drawings and packs, and Schedules and records.
- Programme and snag registers use 12–14px text. Page header actions stay on one row on tablets.
- Overview rendering is read-only: it summarises a programme only after the Programme page has created one, and the stage and check summaries do not write to the project.

The record checks are the same readiness checks used in the project index. They show what has been recorded, not design approval, and the overview says so.

## Brand theme

Chosen from three mock-ups (refined, navy and lime, blueprint) on the real Overview and Your projects pages.

- Navy and lime come from the logo. The project overview opens with a navy header that carries the project name, address and stage bar. Completed stages, the Continue working card, the open project and record-check bars use lime. Blue remains the colour for actions and links.
- Your projects and the Home project list show a rendered preview of each plan with its markup, instead of the 120px background image. Previews are 560px JPEGs drawn from the plan the overview shows, refreshed after edits when you return to Your projects or Home. They are stored in IndexedDB under `preview_<project id>`, apart from the project index, saved records and backups, so they add nothing to `localStorage` or exported files. A project shows its old thumbnail until it is next opened. If browser storage is unavailable, cards fall back to the old thumbnail.
- Cards have soft shadows, and project cards lift on hover. Page titles are larger, and counts use tabular figures.
- The first-visit Home hero, Design lab and Profile tabs, and Review & issue icons use the same navy and lime.
- Text on navy uses #fff, #b8c9d6 or #8fa9bd, and amber #ffcf73 for warnings. Each meets the WCAG AA contrast ratio for its size. Lime is used as a background or bar, never as text on white.

## Styles

The page styles live in `design-preview.css`; the Home styles are at the end of `home.css`. The overview overrides from the presentation refresh were removed from `workbench.css` so one stylesheet owns each page layout.

## Verification

177 automated checks passed in Chromium: 93 static, integration and calculation checks; 10 workspace, 8 profile, 7 design, 6 refinement, 24 deep-debug, 5 presentation, 12 reliability and 12 planning browser checks. The planning run used a generated HEIC fixture, as CI does.

The design suite now also checks the five project stages, that the record checks match the readiness checks, that viewing the overview creates no programme activities, and that the open project is marked in the library.

Home, Your projects, Overview, Markup, Design lab, Programme, Snags, Issue and Profile were inspected at 1440px desktop, 1024px tablet and 390px phone widths, including the empty library and a new project with no plans. The redesigned pages were also checked for horizontal overflow at 320px.

The brand theme was re-verified with the same 177 checks. The design suite also checks that the overview stores a rendered preview, that the preview stays out of the project index, and that project cards show the stored preview after a reload. Every page was inspected again at desktop, tablet and phone widths, including the first-visit and returning Home pages.

Browser automation used Chromium. Firefox, WebKit, physical iPads and Safari were not tested in this pass; CI runs the reliability and planning suites in all three engines.

## Home for returning visits

Added 2 October 2026 after the brand theme. When the browser already has saved projects, Home opens with a navy welcome band for the project to continue: the project open in the workspace, otherwise the last one edited. The band carries the project name, reference and client, the project type, plan count and edit date, a lime Continue project button with New project and Open backup beside it, and the rendered plan preview, or a placeholder when the project has no plan yet. Both the button and the preview open the project. Up to three other recent projects follow as preview cards, then the guides and the three planner steps sit in cards. The first-visit Home is unchanged. The returning styles are at the end of `home.css`.

## Project page headers

Added 2 October 2026. Design lab, Programme, Snags and Review & issue open with the same navy header as the overview: the project type and reference as the eyebrow, the page title and description, and the page actions on the right, with the primary action in lime. Under the header, a compact stage strip shows the five project stages with the same done, in progress, needs attention and to do states as the overview, marks the current page, and opens any stage on tap. Phones scroll the strip sideways. My profile uses the navy header without the strip. The header and strip are built by `pageHead` in `workspace.js` (shared with `planning.js` and `profile.js` through `EVWorkspace.pageHead`), and the strip reads the same stage summary as the overview without writing to the project. Your projects keeps its white heading above the navy Continue working card.

## Guide and course headers

Added 2 October 2026. The Guide Library and Learning Hub pages open with the planner's navy bar: white page name and subtitle, a quiet More tools button and a lime Back to planner action, so the pages reached from Home's guide cards share the look of the planner. The page content below the bar is unchanged. The colours sit in each page's header markup; `resources.css` adds the bar's shadow, the hover states and a lime focus ring.

## Drawing page tool strip

Added 2 October 2026. The Markup tool strip (undo and redo, the four canvas tools, the equipment categories, Technical and Focus) takes the planner's navy, with the active tool and the open category marked in lime, so the drawing page matches the page headers. The plan strip below stays light to frame the canvas, with a lime tint on the Scale recorded chip, and the zoom control gets the soft card shadow. Styles only: the controls, their order and their behaviour are unchanged, and the Technical menu keeps its dark text. The rules are at the end of `design-preview.css`.

## Drawing page panels and dialogs

Added 2 October 2026. The panels and dialogs that open from the Markup page take the planner's navy title row: the equipment picker (title, search and Library, Favourites and Recent tabs), the plan settings panel (eyebrow, title and its Plans & settings and Selected item tabs), the project details and review dialogs (title, description and step tabs), the plan review and export dialog and the photo adjuster. Lime marks the active tab, a chosen equipment tile and the active segment choice, and the sub-navigation in the plan settings panel takes a lime tint. The Technical menu and the Display options keep their light look with the rounded corners and soft shadow used elsewhere. Content areas, forms, buttons and footers are unchanged. Styles only, at the end of `design-preview.css`.

## Older pop-ups

Added 2 October 2026. The remaining pop-ups from the original planner open with the same navy title row as the newer panels: the technical dialogs reached from the Markup page's Technical menu (single-line diagram, cable calculations, charging simulator, DNO application data and materials list), the earthing and protection wizard, the PDF page import, the CDM project controls (whose section tabs sit on the navy row with the open tab in lime) and the small measurement and scale prompts. The content, forms and footer buttons inside them are unchanged, and the 3D showroom keeps its own dark look. Styles only, at the end of `design-preview.css`.

## Home with more impact

Added 2 October 2026 after Ben asked for a more impressive home page. The navy band at the top (the first-visit hero and the returning welcome band) gains a faint blueprint grid, a soft lime glow behind the plan preview and a decorative site strip along its foot: a lime cable run draws in from a supply pillar when the page opens, and chargers and bay outlines appear along it. The strip is an inline SVG marked decorative, so it adds nothing to the page's reading order, and every animation stops when the browser asks for reduced motion. Below the band on returning visits, section headings carry a lime bar, projects without a plan show a navy placeholder, the guides sit on a dotted light panel with blue and lime icon tiles, and the three planner steps sit in a navy band with lime numbers. Copy, buttons, routes and saved data are unchanged. Styles at the end of `home.css`; the strip is built by `siteArt` in `home.js`.

## Buttons and fields inside the panels and pop-ups

Added 2 October 2026. The buttons and fields inside the Markup page's panels and pop-ups use one set: the main action in each footer (Calc sheet, Save CDM pack, Download PDF, OK, Next, Place and so on) is navy with white text, the other buttons are white with the planner's grey-blue border, and a danger action keeps red text. Fields are white with the same border and rounded corners, and a focused field shows a navy border with a lime ring. Selected states (segment choices, the scale prompt's chips, the CDM delivery route and the review's In PDF toggle) are navy, and checkboxes, radios and sliders take navy. The title rows, tabs and tool strip from the earlier steps are unchanged, and the quiet link-style buttons and text links keep blue. Styles only, at the end of `design-preview.css`.
## Home counts and guide pictures

Added 2 October 2026 after the home page gained its site strip. The welcome band shows the project's counts as small tiles with lime figures: plans always, and chargers and open snags once the project index has recorded them (`units` and `snags` from `projStatusMeta`), so an older entry without those fields shows plans alone. The guides panel on returning visits carries a picture above each card: the 3D showroom with a wall charger, the guide library's selected guides and the training courses page (`assets/home-guides-*.jpg`, loaded lazily and only on returning visits). The icon tile overlaps the foot of each picture with a white or navy ring. Nothing is written to the project index; the band reads it. Styles at the end of `home.css`; the markup is `stats` and `pic` in `home.js`.
